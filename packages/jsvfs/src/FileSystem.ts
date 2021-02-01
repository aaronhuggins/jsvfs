import { NoopAdapter } from '@jsvfs/adapter-noop'
import { basename, getItemAtPath, SEPARATOR, setItemAtPath } from './helpers'
import { File, Folder, Item, Link, Root } from './Item'
import type { Adapter } from '@jsvfs/types'

/** Create a virtual file system in memory. */
export class FileSystem {
  /** @param {Adapter} [adapter] - The adapter for this instance; if none is provided, then it defaults to noop. */
  constructor (adapter?: Adapter) {
    this.adapter = adapter

    if (typeof this.adapter === 'undefined') {
      this.adapter = new NoopAdapter()
    }

    this.root = new Root(this.adapter)
  }

  /** The file system adapter for this instance. */
  private adapter: Adapter
  /** The root of the file system tree. */
  private root: Root

  /** The separator character for this file system. */
  get separator (): '/' {
    return SEPARATOR
  }

  /** Read the contents of a file. */
  read (path: string): Buffer {
    const item = getItemAtPath(this.root, path)

    switch (item.type) {
      case 'file':
        return item.contents
      case 'hardlink':
      case 'softlink':
        if (item.contents.type === 'file') {
          return item.contents.contents
        }
      default:
        throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
    }
  }

  /** Write the contents of a file; creating directories in the tree as needed. Optionally append to the file. */
  write (path: string, contents?: string | String | Buffer, append: boolean = false): void {
    if (typeof contents === 'undefined') {
      contents = Buffer.alloc(0)
    } else if (typeof contents === 'string' || contents instanceof String) {
      contents = Buffer.from(contents, 'utf8')
    }

    let item: Item

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {
      // Ignore errors; will create directory tree and encounter errors later as needed.
    }

    if (append && typeof item !== 'undefined') {
      switch (item.type) {
        case 'file':
          item.contents = Buffer.concat([item.contents, contents])
          break
        case 'hardlink':
        case 'softlink':
          if (item.contents.type === 'file') {
            item.contents.contents = Buffer.concat([item.contents.contents, contents])
            break
          }
        default:
          throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
      }
    } else {
      if (typeof item === 'object') {
        throw new ReferenceError(`Item of type ${item.type} already exists at path ${path}`)
      }

      setItemAtPath(this.root, new File({
        adapter: this.adapter,
        contents: Buffer.from(contents),
        name: basename(path),
        path
      }))
    }
  }

  /** Delete a file; if the target is a link, also deletes the link. Returns false if the item does not exist. */
  delete (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {}

    if (typeof item === 'undefined') return false

    switch (item.type) {
      case 'file':
        return item.parent.delete(item.name)
      case 'hardlink':
      case 'softlink':
        if (item.contents.type === 'file') {
          return item.parent.delete(item.name) &&
            item.contents.parent.delete(item.contents.name)
        }
      default:
        throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
    }
  }

  /** Make a directory or directory tree; silently continues if path already exists. */
  mkdir (path: string): void {
    if (!this.exists(path)) {
      setItemAtPath(this.root, new Folder({
        adapter: this.adapter,
        name: basename(path),
        path
      }))
    }
  }

  /** Read the contents of a directory. */
  readdir (path: string): string[]
  readdir (path: string, long: true): Item[]
  readdir (path: string, long: boolean): string[] | Item[]
  readdir (path: string, long: boolean = false): string[] | Item[] {
    let item: Item

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {}

    if (typeof item === 'undefined') return []

    switch (item.type) {
      case 'folder':
      case 'root':
        return item.list(long)
      case 'hardlink':
      case 'softlink':
        switch (item.contents.type) {
          case 'folder':
          case 'root':
            return item.contents.list(long)
        }
      default:
        throw new TypeError(`Expected a folder, encountered a file at path ${path}`)
    }
  }

  /** Remove a directory and it's contents. */
  rmdir (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {}

    if (typeof item === 'undefined') return false

    switch (item.type) {
      case 'folder':
      case 'root':
        return item.parent.delete(item.name)
      case 'hardlink':
      case 'softlink':
        switch (item.contents.type) {
          case 'folder':
          case 'root':
            return item.parent.delete(item.name) &&
              item.contents.parent.delete(item.contents.name)
        }
      default:
        throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
    }
  }

  /** Create a link to a folder or file; optionally create as a hardlink. Returns false if the link cannot be created. */
  link (from: string, to: string, type: Link['type'] = 'softlink'): boolean {
    if (!this.exists(from)) {
      try {
        const item = getItemAtPath(this.root, to)

        switch (item.type) {
          case 'hardlink':
          case 'softlink':
            return false
        }

        setItemAtPath(this.root, new Link({
          adapter: this.adapter,
          contents: item,
          name: basename(from),
          path: from,
          type
        }))

        return true
      } catch (error) {}
    }

    return false
  }

  /** Remove a link; returns false if not a link. */
  unlink (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {}

    if (typeof item === 'undefined') return false

    switch (item.type) {
      case 'hardlink':
      case 'softlink':
        item.parent.delete(item.name)
        break
      default:
        return false
    }

    return true
  }

  /** Check to see if a path exists in the file system tree. */
  exists (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {
      // Ignore errors; just checking for existence.
    }

    return typeof item !== 'undefined'
  }

  /** Prepare the file system with a snapshot of the underlying persistent file system. */
  async snapshot (): Promise<void> {
    for await (const [path, data] of this.adapter.snapshot()) {
      if (data === 'folder') {
        this.mkdir(path)
      } else {
        this.write(path, data)
      }
    }
  }

  /** Commit the current state of the file system to persistent storage. */
  async commit (): Promise<void> {
    await this.adapter.flush()
    await this.root.commit()
  }
}
