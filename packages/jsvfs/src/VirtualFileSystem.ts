import { NoopAdapter } from '@jsvfs/adapter-noop'
import { basename, destructure, getItemAtPath, join, normalize, SEPARATOR, setItemAtPath } from './helpers'
import { File, Folder, Item, Link, RealItem, Root } from './Item'
import type { Adapter, ItemType, LinkType } from '@jsvfs/types'

/** Create a JavaScript virtual file system in memory. */
export class VirtualFileSystem {
  /** @param {Adapter} [adapter] - The adapter for this instance; if none is provided, then it defaults to noop. */
  constructor (adapter?: Adapter) {
    this.adapter = adapter

    if (typeof this.adapter === 'undefined') {
      this.adapter = new NoopAdapter()
    }

    this.root = new Root(this.adapter)
    this.rmCache = new Map()
  }

  /** The file system adapter for this instance. */
  private adapter: Adapter
  /** The root of the file system tree. */
  private root: Root
  /** An internal cache of paths removed from root. */
  private rmCache: Map<string, ItemType>

  /** The separator character for this file system. */
  get separator (): '/' {
    return SEPARATOR
  }

  private isRmCached (path): boolean {
    const tree = destructure(path)
    let cachedPath = ''

    for (const leaf of tree) {
      cachedPath = join(cachedPath, leaf)

      if (this.rmCache.has(cachedPath)) return true
    }

    return false
  }

  /** Read the contents of a file. */
  read (path: string): Buffer {
    const item = getItemAtPath(this.root, path)

    switch (item.type) {
      case 'file':
        return item.contents
      default:
        throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
    }
  }

  /** Write the contents of a file; creating directories in the tree as needed. Optionally append to the file. */
  write (path: string, contents?: string | String | Buffer, append: boolean = false): void {
    if (typeof contents === 'undefined') {
      contents = Buffer.alloc(0)
    } else if (contents instanceof String || typeof contents === 'string') {
      contents = Buffer.from(contents, 'utf8')
    }

    let item: RealItem

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
        default:
          throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
      }
    } else {
      if (typeof item === 'object') {
        switch (item.type) {
          case 'file':
            item.contents = Buffer.from(contents)
            break
          default:
            throw new ReferenceError(`Item of type ${item.type} already exists at path ${path}`)
        }
      } else {
        setItemAtPath(this.root, new File({
          adapter: this.adapter,
          contents: Buffer.from(contents),
          name: basename(path),
          path
        }))
      }
    }

    if (this.isRmCached(path)) this.rmCache.delete(normalize(path))
  }

  /** Delete a file; if the target is a hardlink, also deletes the link contents. Returns false if the item does not exist. */
  delete (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path, false)
    } catch (error) {}

    if (typeof item === 'undefined') {
      this.rmCache.set(normalize(path), 'file')
      return false
    }

    switch (item.type) {
      case 'file':
        this.rmCache.set(normalize(path), item.type)
        return item.parent.delete(item.name)
      case 'hardlink':
        if (item.contents.type === 'file') {
          this.rmCache.set(normalize(path), item.type)
          this.rmCache.set(normalize(item.contents.path), item.contents.type)
          return item.parent.delete(item.name) &&
            item.contents.parent.delete(item.contents.name)
        }
      case 'softlink':
        if (item.contents.type === 'file') {
          this.rmCache.set(normalize(path), item.type)
          return item.parent.delete(item.name)
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

      if (this.isRmCached(path)) this.rmCache.delete(normalize(path))
    }
  }

  /** Read the contents of a directory. */
  readdir (path: string): string[]
  readdir (path: string, long: true): Item[]
  readdir (path: string, long: boolean): string[] | Item[]
  readdir (path: string, long: boolean = false): string[] | Item[] {
    let item: RealItem

    try {
      item = getItemAtPath(this.root, path)
    } catch (error) {}

    if (typeof item === 'undefined') return []

    switch (item.type) {
      case 'folder':
      case 'root':
        return item.list(long)
      default:
        throw new TypeError(`Expected a folder, encountered a file at path ${path}`)
    }
  }

  /** Remove a directory and it's contents. If the path is a folder link, both the link and the link target will be removed. */
  rmdir (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path, false)
    } catch (error) {}

    if (typeof item === 'undefined') {
      this.rmCache.set(normalize(path), 'folder')
      return false
    }

    switch (item.type) {
      case 'folder':
      case 'root':
        this.rmCache.set(normalize(path), item.type)
        return item.parent.delete(item.name)
      case 'hardlink':
      case 'softlink':
        switch (item.contents.type) {
          case 'folder':
          case 'root':
            this.rmCache.set(normalize(path), item.type)
            this.rmCache.set(normalize(item.contents.path), item.contents.type)
            return item.parent.delete(item.name) &&
              item.contents.parent.delete(item.contents.name)
        }
      default:
        throw new TypeError(`Expected a file, encountered a folder at path ${path}`)
    }
  }

  /** Create a link to a folder or file; optionally create as a hardlink. Returns false if the link cannot be created. */
  link (from: string, to: string, type: LinkType = 'softlink'): boolean {
    if (!this.exists(from)) {
      try {
        const item = getItemAtPath(this.root, to)

        setItemAtPath(this.root, new Link({
          adapter: this.adapter,
          contents: item,
          name: basename(from),
          path: from,
          type
        }))

        return true
      } catch (error) {
        return false
      }
    }

    return false
  }

  /** Remove a link; returns false if not a link. Does not delete files, this is not a Node API. */
  unlink (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path, false)
    } catch (error) {}

    if (typeof item === 'undefined') {
      this.rmCache.set(normalize(path), 'softlink')
      return false
    }

    switch (item.type) {
      case 'hardlink':
      case 'softlink':
        this.rmCache.set(normalize(path), item.type)
        return item.parent.delete(item.name)
    }

    return false
  }

  /** Check to see if a path exists in the file system tree. */
  exists (path: string): boolean {
    let item: Item

    try {
      item = getItemAtPath(this.root, path, false)
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

    for (const [path, type] of this.rmCache) {
      await this.adapter.remove(path, type)
    }
  }
}
