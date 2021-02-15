/**
 * [[include:packages/adapter-multi/README.md]]
 * @packageDocumentation
 * @module @jsvfs/adapter-multi
 */
import { Journal } from '@jsvfs/extras'
import { Adapter, ItemType, JournalEntry, LinkType, SnapshotEntry } from '@jsvfs/types'

/**
 * Observe an array or journal in order to capture each push.
 * @hidden
 */
function observe (journal: any[], observer: (...item: any[]) => void): void {
  if (Array.isArray(journal)) {
    const originalPush = journal.push

    if (typeof originalPush === 'function') {
      Object.defineProperty(journal, 'push', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function push (...args: any[]): number {
          const result: number = originalPush.apply(this, args)

          observer(...args)

          return result
        }
      })
    }
  }
}

/** An adapter for No-Operation; essentially makes the VFS a memory-only instance. */
export class MultiAdapter implements Adapter {
  /** Creates an instance of noop adapter. */
  constructor () {
    this.root = ''
    this.handle = 'multi'
    this.journal = new Journal()
    this.adapters = []
  }

  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** The store of registered adapters */
  private readonly adapters: Adapter[]
  /** Log useful messages to the journal about file operations. */
  journal: Journal<JournalEntry>
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: 'multi'

  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data. This is a no-op.
   * @returns {AsyncGenerator<[string, SnapshotEntry]>} The asynchronous iterable to get the snapshot.
   */
  async * snapshot (): AsyncGenerator<[string, SnapshotEntry]> {}

  /** Read a file from persistent storage; returns the first available non-empty result. */
  async read (path: string): Promise<Buffer> {
    for (const adapter of this.adapters) {
      if (typeof adapter.read === 'function') {
        const buffer = await adapter.read(path)

        if (buffer.length > 0) {
          return buffer
        }
      }
    }

    return Buffer.alloc(0)
  }

  /** Create a file or write the contents of a file to persistent storage. */
  async write (path: string, contents?: Buffer): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.write(path, contents)
    }
  }

  /** Make a directory or directory tree in persistent storage. */
  async mkdir (path: string): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.mkdir(path)
    }
  }

  /** Create a link in persistent storage. */
  async link (from: string, to: string, type: LinkType): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.link(from, to, type)
    }
  }

  /** Remove items from persistent storage. */
  async remove (path: string, type: ItemType): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.remove(path, type)
    }
  }

  /** Flush the underlying file system to prepare for a commit. This is a no-op. */
  async flush (): Promise<void> {}

  /** Register an adapter. Any attempt to register an instance of MultiAdapter will be silently ignored. */
  register (adapter: Adapter): void {
    if (typeof adapter === 'object' && adapter.handle !== this.handle) {
      this.adapters.push(adapter)
      observe(adapter.journal, (...items: any[]) => {
        this.journal.push(...items)
      })
    }
  }
}
