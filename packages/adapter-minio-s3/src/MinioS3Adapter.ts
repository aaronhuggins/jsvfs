import { BucketItem, Client, ClientOptions } from 'minio'
import { isValidBucketName } from 'minio/dist/main/helpers'
import { Journal } from '@jsvfs/errors'
import { parse, streamToAsyncGenerator } from './helpers'
import type { Adapter, ItemType, LinkType, SnapshotEntry } from '@jsvfs/types'
import type { JournalOp, MinioS3AdapterOpts, MinioS3JournalEntry } from './types'

/** An adapter for Amazon S3 compatible storage. */
export class MinioS3Adapter implements Adapter {
  /** Creates an instance of MinIO S3 adapter. */
  constructor (opts: MinioS3AdapterOpts) {
    const { access } = opts

    if (typeof access === 'undefined') {
      throw new Error("Option 'access' cannot be undefined.")
    } else {
      this.minioClient = new Client(access)
    }

    if (isValidBucketName(opts.bucketName)) {
      this.root = opts.bucketName
    } else {
      this.root = '/'
    }

    this.bucketCache = new Set()
    this.region = opts.region
    this.include = Array.isArray(opts.include) ? Object.freeze(Array.from(opts.include)) : Object.freeze([])
    this.flushEnabled = opts.flushEnabled ?? false
    this.createIfNotExist = typeof opts.region === 'string'
      ? true
      : opts.createIfNotExist ?? false
    this.handle = 'minio-s3'
    this.journal = new Journal<MinioS3JournalEntry>()
  }

  /** The backing options for MinIO client. */
  readonly minioOptions: ClientOptions
  /** The backing instance of MinIO client. */
  readonly minioClient: Client
  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** The set of encountered buckets. */
  readonly bucketCache: Set<string>
  /** The file globs to apply to `snapshot` and `flush` operations. */
  readonly include: readonly string[]
  /** The region to create new buckets in. */
  readonly region?: string
  /** Whether to create a container if it does not yet exist. */
  createIfNotExist: boolean
  /** Enable or disable flushing the file system. */
  flushEnabled: boolean
  /** Log useful messages to the journal about file operations. */
  journal: Journal<MinioS3JournalEntry>
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: 'minio-s3'

  /** Returns true if root is the storage account. */
  get isGlobal (): boolean {
    return this.root === '/'
  }

  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data.
   * @returns {AsyncGenerator<[string, SnapshotEntry]>} The asynchronous iterable to get the snapshot.
   */
  async * snapshot (): AsyncGenerator<[string, SnapshotEntry]> {
    for await (const bucketName of this.listBuckets('snapshot')) {
      try {
        for await (const blobItem of this.listObjects(bucketName, 'snapshot')) {
          const contents = await this.readBlob(client, blobItem.name, 'snapshot')
          const snapshotName = this.isGlobal
            ? '/' + name + '/' + blobItem.name
            : '/' + blobItem.name

          // Need to add glob behavior to include files from the options.
          yield [snapshotName, { type: 'file', contents }]
        }
      } catch (error) {
        this.journal.push({
          level: 'error',
          message: `Could not list blobs in container '${name}'.`,
          op: 'snapshot',
          error
        })
      }
    }
  }

  /** Create a file or write the contents of a file to persistent storage. */
  async write (path: string, contents: Buffer = Buffer.alloc(0)): Promise<void> {
    const parsed = parse(path, this.root)
    const container = await this.getContainer(parsed.container, 'write')
    const blobClient = container.getBlockBlobClient(parsed.blobName)

    try {
      await blobClient.uploadData(contents)
    } catch (error) {
      this.journal.push({
        level: 'error',
        message: `Could not upload blob '${parsed.blobName}' to container '${parsed.container}'.`,
        op: 'write',
        error
      })
    }
  }

  /** Make a directory or directory tree in persistent storage. Technically unsupported by Microsoft, as 'directories' are virtual. */
  async mkdir (path: string): Promise<void> {}

  /** Create a link in persistent storage. Definitely unsupported by Microsoft, so we copy the file contents from an existing blob. */
  async link (linkPath: string, linkTarget: string, type: LinkType): Promise<void> {
    const parsedPath = parse(linkPath, this.root)
    const parsedTarget = parse(linkTarget, this.root)
    const containerFrom = await this.getContainer(parsedTarget.container, 'link')
    const containerTo = await this.getContainer(parsedPath.container, 'link')
    const blobFrom = containerFrom.getBlockBlobClient(parsedTarget.blobName)
    const blobTo = containerTo.getBlockBlobClient(parsedPath.blobName)

    try {
      await blobTo.syncCopyFromURL(blobFrom.url)
    } catch (error) {
      this.journal.push({
        level: 'error',
        message: `Could not copy blob to '${parsedPath.blobName}' in container '${parsedPath.container}' from '${parsedTarget.blobName}' in container '${parsedTarget.container}'.`,
        op: 'link',
        error
      })
    }
  }

  /** Remove items from persistent storage. */
  async remove (path: string, type: ItemType): Promise<void> {
    const parsed = parse(path, this.root)
    const container = await this.getContainer(parsed.container, 'remove')
    const blobClient = container.getBlockBlobClient(parsed.blobName)

    switch (type) {
      case 'file':
      case 'hardlink':
      case 'softlink':
        try {
          await blobClient.deleteIfExists()
        } catch (error) {
          this.journal.push({
            level: 'error',
            message: `Could not delete blob '${parsed.blobName}' from container '${parsed.container}'.`,
            op: 'remove',
            error
          })
        }
    }
  }

  /** Flush the underlying file system to prepare for a commit. */
  async flush (): Promise<void> {
    if (this.flushEnabled) {
      for await (const [name, client] of this.listBuckets('flush')) {
        for await (const blobItem of client.listBlobsFlat()) {
          const blobClient = client.getBlockBlobClient(blobItem.name)

          // Need to add glob behavior to include files from the options.
          try {
            await blobClient.deleteIfExists()
          } catch (error) {
            this.journal.push({
              level: 'error',
              message: `Could not delete blob '${blobItem.name}' from container '${name}'.`,
              op: 'flush',
              error
            })
          }
        }
      }
    }
  }

  /** Reads a blob from blob storage. */
  private async readBlob (container: string | ContainerClient, blobName: string, op: JournalOp): Promise<Buffer> {
    const containerClient = typeof container === 'string' ? await this.getContainer(container, 'snapshot') : container
    const blobClient = containerClient.getBlockBlobClient(blobName)

    try {
      return await blobClient.downloadToBuffer()
    } catch (error) {
      this.journal.push({
        level: 'error',
        message: `Could not read blob '${blobName}' from container '${containerClient.containerName}'.`,
        op,
        error
      })
      return Buffer.alloc(0)
    }
  }

  private async * listObjects (name: string, op: JournalOp): AsyncGenerator<BucketItem> {
    const generator = streamToAsyncGenerator<BucketItem>(this.minioClient.listObjects(name, '', false))

    for await (const item of generator) {
      yield item
    }
  }

  /** Get or initialize the given container by name. */
  private async getBucket (name: string, op: JournalOp, exists: boolean = false): Promise<string> {
    const bucketCached = this.bucketCache.has(name)

    if (!bucketCached) {
      if (!exists && this.createIfNotExist) {
        try {
          await this.minioClient.makeBucket(name, this.region ?? 'us-east-1')
        } catch (error) {
          this.journal.push({
            level: 'error',
            message: `Could not create bucket '${name}' in region '${this.region ?? 'us-east-1'}'.`,
            op,
            error
          })
        }
      }

      this.bucketCache.add(name)
    }

    return name
  }

  /** List the buckets for this instance and optionally cache them. */
  private async * listBuckets (op: JournalOp): AsyncGenerator<string> {
    if (this.bucketCache.size === 0) {
      if (this.isGlobal) {
        const bucketItems = await this.minioClient.listBuckets()

        for (const containerItem of bucketItems) {
          yield await this.getBucket(containerItem.name, op, true)
        }
      } else {
        yield await this.getBucket(this.root, op)
      }
    } else {
      for (const item of this.bucketCache.values()) {
        yield item
      }
    }
  }
}