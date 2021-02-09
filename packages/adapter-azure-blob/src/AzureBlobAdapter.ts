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

    this.root = ''
    this.handle = 'azure-blob'
    this.journal = []
  }

  /** The backing instance of blob service client. */
  readonly blobService: BlobServiceClient
  /** A cache of encountered container clients to optimize performance. */
  readonly containerCache: Map<string, ContainerClient>
  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** Log useful messages to the journal about file operations. */
  journal: JournalEntry[]
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: 'azure-blob'

  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data.
   * @returns {AsyncGenerator<[string, SnapshotEntry]>} The asynchronous iterable to get the snapshot.
   */
  async * snapshot (): AsyncGenerator<[string, SnapshotEntry]> {}

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
}
