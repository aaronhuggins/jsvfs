import { promises } from 'fs'
import { dirname, join, posix, resolve } from 'path'
import type { Adapter, JournalEntry } from '@jsvfs/types'

const { link, mkdir, readdir, readFile, rmdir, symlink, unlink, writeFile } = promises

/** An adapter for NodeJS local filesystems using the `fs` module. */
export class FileSystemAdapter implements Adapter {
  /** Creates an instance of file system adapter.
   * @param {string} [cwd] - The desired working directory for this adater; defaults to process current working directory.
   */
  constructor (cwd?: string) {
    this.root = typeof cwd === 'string' ? resolve(cwd) : process.cwd()
    this.handle = 'node-fs'
    this.journal = []
  }

  /** The real root of this file system which will be committed to. */
  readonly root: string
  /** Log useful messages to the journal about file operations. */
  journal: JournalEntry[]
  /** The handle for this adapter, basically an id. Should be something simple but descriptive, like 'node-fs' or 'blob'. */
  handle: 'node-fs'

  /** Snapshot of the underlying file system; an asynchronous iterable which returns an entry of path and data.
   * @param {string} [path='/'] - The current path as the tree is descended.
   * @param {boolean} [read=true] - Whether to retrieve the underlying data.
   * @returns {AsyncGenerator<[string, 'folder' | Buffer]>} The asynchronous iterable to get the snapshot.
   */
  async *snapshot (path: string = '/', read: boolean = true): AsyncGenerator<[string, 'folder' | Buffer]> {
    const result = await promises.readdir(path === '/' ? this.root : join(this.root, path), { withFileTypes: true })

    for (const entry of result) {
      const newPath = posix.join(path, entry.name)

      switch (true) {
        case entry.isDirectory():
          yield [newPath, 'folder']
          for await (const [path, data] of this.snapshot(newPath)) {
            yield [path, data]
          }
          break
        case entry.isFile():
          yield [newPath, read ? await readFile(join(this.root, newPath)) : Buffer.alloc(0)]
          break
      }
    }
  }

  /** Create a file or write the contents of a file to persistent storage. */
  async write (path: string, contents?: Buffer): Promise<void> {
    const newPath = join(this.root, path)
    const parent = dirname(newPath)

    await mkdir(parent, { recursive: true })
    await writeFile(newPath, contents)
  }

  /** Make a directory or directory tree in persistent storage. */
  async mkdir (path: string): Promise<void> {
    const newPath = join(this.root, path)

    await mkdir(newPath, { recursive: true })
  }

  /** Create a link in persistent storage. */
  async link (from: string, to: string, type: 'hardlink' | 'softlink'): Promise<void> {
    const newFrom = join(this.root, from)
    const newTo = join(this.root, to)

    switch(type) {
      case 'hardlink':
        await link(newTo, newFrom)
        break
      case 'softlink':
        await symlink(newTo, newFrom)
        break
    }
  }

  /** Flush the underlying file system to prepare for a commit. This is a destructive operation. */
  async flush (): Promise<void> {
    const result = await readdir(this.root, { withFileTypes: true })

    for (const entry of result) {
      const path = join(this.root, entry.name)

      switch (true) {
        case entry.isDirectory():
          await rmdir(path, { recursive: true })
          break
        case entry.isFile():
          await unlink(path)
          break
      }
    }
  }
}
