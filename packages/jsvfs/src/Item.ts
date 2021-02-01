import type { Adapter, ItemType } from '@jsvfs/types'

export type Item = File | Folder | Link | Root

abstract class ItemBase {
  constructor (item: Partial<ItemBase>) {
    this.type = item.type
    this.path = item.path
    this.name = item.name
    this.contents = item.contents
    this.parent = item.parent
    this.committed = false
  }

  /** The file system adapter instance to use. */
  adapter: Adapter
  /** The type of item. */
  type: ItemType
  /** The absolute path to the item. */
  path: string
  /** The name of the item. */
  name: string
  /** Contents of the item. */
  contents?: any
  /** The parent of the item. */
  parent?: ParentItem
  /** The status of the commit. */
  committed: boolean
  /** The size of the item. */
  abstract get size (): number
  /** Method to commit the item to persistent storage. */
  abstract commit (): Promise<void>
}

export class ParentItem extends ItemBase {
  constructor (item: Partial<ParentItem>) {
    super({
      ...item,
      type: item.type === 'root' ? 'root' : 'folder'
    })

    this.contents = new Map()
  }

  /** The type of item, root or a folder. */
  type: 'folder' | 'root'
  /** The children of the folder. */
  contents: Map<string, Item>

  list (): string[]
  list (long: true): Item[]
  list (long: boolean): string[] | Item[]
  list (long: boolean = false): string[] | Item[] {
    if (long) return Array.from(this.contents.values())

    return Array.from(this.contents.keys())
  }

  get (name: string): Item {
    return this.contents.get(name)
  }

  set (name: string, item: Item): void {
    item.parent = this

    this.contents.set(name, item)
  }

  delete (name: string): boolean {
    return this.contents.delete(name)
  }

  get size (): number {
    let result = 0

    for (const item of this.contents.values()) {
      result += item.size
    }

    return result
  }

  get count (): number {
    return this.contents.size
  }

  async commit (): Promise<void> {
    // Don't commit again.
    if (this.committed) return

    if (this.count > 0) {
      for (const item of this.contents.values()) {
        await item.commit()
      }
    } else {
      await this.adapter.mkdir(this.path)
    }

    this.committed = true
  }
}

/** Represents a folder item in the file system. */
export class Folder extends ParentItem {
  constructor (item: Partial<Folder>) {
    super({
      ...item,
      type: 'folder'
    })
  }

  /** The type of item, a folder. */
  type: 'folder'
}

/** A special item; represents the top-level of the file system. */
export class Root extends ParentItem {
  constructor (adapter: Adapter) {
    super({ type: 'root', adapter })

    this.contents = new Map()
    this.path = '/'
    this.name = 'ROOT'
  }

  /** The type of item, a root folder. */
  type: 'root'
}

/** Represents a file item in the file system. */
export class File extends ItemBase {
  constructor (item: Partial<File>) {
    super({
      ...item,
      type: 'file'
    })
  }

  /** The type of item, a file. */
  type: 'file'
  contents: Buffer

  get size (): number {
    return this.contents.length
  }

  async commit (): Promise<void> {
    // Don't commit again.
    if (this.committed) return

    await this.adapter.write(this.path, this.contents)

    this.committed = true
  }
}

/** Represents a link item in the file system; defaults to type 'softlink'. */
export class Link extends ItemBase {
  constructor (item: Partial<Link>) {
    super({
      ...item,
      type: item.type || 'softlink'
    })
  }

  /** The type of item, either a hardlink or softlink. */
  type: 'hardlink' | 'softlink'
  contents: ParentItem | File

  get size (): number {
    return 0
  }

  async commit (): Promise<void> {
    // Don't commit again.
    if (this.committed) return

    // Ensure that the target exists before linking.
    if (!this.contents.committed) await this.contents.commit()

    await this.adapter.link(this.path, this.contents.path, this.type)

    this.committed = true
  }
}
