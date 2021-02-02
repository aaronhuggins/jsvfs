/**
 * If you're looking to use `@jsvfs/jsvfs`, you're best to start with that module.
 * 
 * This module is the default noop backend for `jsvfs` and probably already imported if you have installed `jsvfs`.
 * 
 * If you're looking to create new adapters, please use `@jsvfs/types` and look to `@jsvfs/adapter-node-fs` as an example.
 * @packageDocumentation
 * @module @jsvfs/adapter-noop
 */

import type { Adapter, ItemType, JournalEntry } from '@jsvfs/types'

/** An adapter for No-Operation; essentially makes the VFS a memory-only instance. */
export class NoopAdapter implements Adapter {
  /** Creates an instance of noop adapter. */
  constructor () {
    this.root = ''
    this.handle = 'noop'
    this.journal = []
  }

  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** Log useful messages to the journal about file operations. */
  journal: JournalEntry[]
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: 'noop'

  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data.
   * @param {string} [path='/'] - The current path as the tree is descended.
   * @param {boolean} [read=true] - Whether to retrieve the underlying data.
   * @returns {AsyncGenerator<[string, 'folder' | Buffer]>} The asynchronous iterable to get the snapshot.
   */
  async *snapshot (): AsyncGenerator<[string, 'folder' | Buffer]> {}

  /** Create a file or write the contents of a file to persistent storage. */
  async write (path: string, contents?: Buffer): Promise<void> {}

  /** Make a directory or directory tree in persistent storage. */
  async mkdir (path: string): Promise<void> {}

  /** Create a link in persistent storage. */
  async link (from: string, to: string, type: 'hardlink' | 'softlink'): Promise<void> {}

  /** Remove items from persistent storage. */
  async remove (path: string, type: ItemType): Promise<void> {}

  /** Flush the underlying file system to prepare for a commit. */
  async flush (): Promise<void> {}
}
