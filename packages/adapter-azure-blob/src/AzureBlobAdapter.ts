import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential as BlobCredential } from '@azure/storage-blob'
import { isContainerName } from './helpers'
import type { Adapter, ItemType, JournalEntry, LinkType, SnapshotEntry } from '@jsvfs/types'
import type { AzureBlobAdapterOpts } from './types'

/** An adapter for Azure Storage Blobs. */
export class AzureBlobAdapter implements Adapter {
  /** Creates an instance of Azure blob adapter. */
  constructor (opts: AzureBlobAdapterOpts) {
    const { access } = opts

    if (typeof access === 'undefined') throw new Error("Option 'access' cannot be undefined.")

    if ('connectionString' in access) {
      this.blobService = BlobServiceClient.fromConnectionString(access.connectionString)
    } else if (
      'storageAccount' in access &&
      'storageKey' in access
    ) {
      this.blobService = new BlobServiceClient(
        `https://${access.storageAccount}.blob.core.windows.net`,
        new BlobCredential(access.storageAccount, access.storageKey)
      )
    } else {
      throw new Error("Option 'access' does not contain either a connection string or an account and key.")
    }

    if (isContainerName(opts.container)) {
      this.root = opts.container
    } else {
      this.root = '/'
    }

    this.include = Array.isArray(opts.include) ? Object.freeze(Array.from(opts.include)) : Object.freeze([])
    this.flushEnabled = opts.flushEnabled ?? false
    this.createIfNotExist = opts.createIfNotExist ?? false
    this.handle = 'azure-blob'
    this.journal = []
  }

  /** The backing instance of blob service client. */
  readonly blobService: BlobServiceClient
  /** A cache of encountered container clients to optimize performance. */
  readonly containerCache: Map<string, ContainerClient>
  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** The file globs to apply to `snapshot` and `flush` operations. */
  readonly include: readonly string[]
  /** Whether to create a container if it does not yet exist. */
  createIfNotExist: boolean
  /** Enable or disable flushing the file system. */
  flushEnabled: boolean
  /** Log useful messages to the journal about file operations. */
  journal: JournalEntry[]
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: 'azure-blob'

  /** Returns true if root is the storage account. */
  get isGlobal (): boolean {
    return this.root === '/'
  }

  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data.
   * @returns {AsyncGenerator<[string, SnapshotEntry]>} The asynchronous iterable to get the snapshot.
   */
  async * snapshot (): AsyncGenerator<[string, SnapshotEntry]> {
    for await (const [name, client] of this.listContainers()) {
      for await (const blobItem of client.listBlobsFlat()) {
        const contents = await this.readBlob(client, blobItem.name)
        const snapshotName = this.isGlobal
          ? '/' + name + '/' + blobItem.name
          : '/' + blobItem.name

        // Need to add glob behavior to include files from the options.
        yield [snapshotName, { type: 'file', contents }]
      }
    }
  }

  /** Create a file or write the contents of a file to persistent storage. */
  async write (path: string, contents?: Buffer): Promise<void> {}

  /** Make a directory or directory tree in persistent storage. */
  async mkdir (path: string): Promise<void> {}

  /** Create a link in persistent storage. */
  async link (from: string, to: string, type: LinkType): Promise<void> {}

  /** Remove items from persistent storage. */
  async remove (path: string, type: ItemType): Promise<void> {}

  /** Flush the underlying file system to prepare for a commit. */
  async flush (): Promise<void> {}

  private async readBlob (container: string | ContainerClient, blobName: string): Promise<Buffer> {
    const containerClient = typeof container === 'string' ? await this.getContainer(container) : container
    const blobClient = containerClient.getBlobClient(blobName)

    try {
      return await blobClient.downloadToBuffer()
    } catch (error) {
      return Buffer.alloc(0)
    }
  }

  /** Get or initialize the given container by name. */
  private async getContainer (name: string, exists: boolean = false): Promise<ContainerClient> {
    let containerClient = this.containerCache.get(name)

    if (typeof containerClient === 'undefined') {
      containerClient = this.blobService.getContainerClient(this.root)

      if (!exists && this.createIfNotExist) {
        try {
          await containerClient.createIfNotExists()
        } catch (error) {
          // We don't care about this error. Hide it.
        }
      }

      this.containerCache.set(name, containerClient)
    }

    return containerClient
  }

  /** List the containers for this instance and optionally cache them. */
  private async * listContainers (): AsyncGenerator<[string, ContainerClient]> {
    if (this.containerCache.size === 0) {
      if (this.isGlobal) {
        for await (const containerItem of this.blobService.listContainers()) {
          if (!containerItem.deleted) {
            yield [containerItem.name, await this.getContainer(containerItem.name, true)]
          }
        }
      } else {
        yield [this.root, await this.getContainer(this.root)]
      }
    }
  }
}
