/** The valid item types implemented by jsvfs. */
export type ItemType = 'file' | 'folder' | 'hardlink' | 'root' | 'softlink'

/** An adapter for the underlying persistent file storage.
 * 
 * Rules for implementing an adapter:
 * 1. Throwing errors is unacceptable; log errors to the journal.
 * 2. Adapters must create paths recursively.
 * 3. Adapters must implement all methods.
 * 4. Unsupported methods must be a noop.
 */
export interface Adapter {
  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data. */
  snapshot (): AsyncGenerator<[string, 'folder' | Buffer]>
  /** Create a file or write the contents of a file to persistent storage. */
  write (path: string, contents?: Buffer): Promise<void>
  /** Make a directory or directory tree in persistent storage. */
  mkdir (path: string): Promise<void>
  /** Create a link in persistent storage. */
  link (from: string, to: string, type: 'hardlink' | 'softlink'): Promise<void>
  /** Remove items from persistent storage. */
  remove (path: string, type: ItemType): Promise<void>
  /** Flush the underlying file system to prepare for a commit. */
  flush (): Promise<void>
  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** Log useful messages to the journal about file operations. */
  journal: JournalEntry[]
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: string
}

export interface JournalEntry {
  id: string | number
  op: 'delete' | 'exists' | 'list' | 'read' | 'write'
  level: 'info' | 'warn' | 'error' | 'crit'
  message: string
  [property: string]: any
}
