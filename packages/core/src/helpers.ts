import { Folder, Item, ParentItem, RealItem, Root } from './Item'

export const SEPARATOR = '/'

/** Normalize a path to match expectations. */
export function normalize (path: string): string {
  const absolute = SEPARATOR + path

  return absolute.replace(/(\\+|\/+)/gu, SEPARATOR)
}

/** Destructure a path to an array. */
export function destructure (path: string): string[] {
  return normalize(path).split(SEPARATOR)
}

/** Perform a POSIX join on one or more strings. */
export function join (...paths: string[]): string {
  return normalize(paths.join(SEPARATOR))
}

/** Get the base name of the given path. */
export function basename (path: string): string {
  const tree = destructure(path)

  if (tree.length === 0 || (tree.length === 1 && tree[0] === '')) {
    return SEPARATOR
  }

  if (tree[tree.length - 1] === '') {
    return tree[tree.length - 2]
  }

  return tree[tree.length - 1]
}

/** Get an item in the file system tree. Optionally return links at a path instead of link contents. */
export function getItemAtPath (root: Root, path: string): RealItem
export function getItemAtPath (root: Root, path: string, resolveLinks: false): Item
export function getItemAtPath (root: Root, path: string, resolveLinks: true): RealItem
export function getItemAtPath (root: Root, path: string, resolveLinks: boolean = true): Item {
  const tree = destructure(path)
  let item: Item = root

  for (let i = 0; i < tree.length; i += 1) {
    let current: Item

    if ('get' in item) {
      current = item.get(tree[i])
    } else {
      if (i + 1 < tree.length) {
        throw new TypeError(`Expected a folder; encountered a ${item.type} named '${item.name}' at path ${item.path}`)
      }
      break
    }

    if (typeof current === 'undefined') {
      throw new ReferenceError(`Item does not exist at path ${path}`)
    }

    switch (current.type) {
      case 'root':
      case 'folder':
        item = current
        break
      case 'file':
        if (i + 1 < tree.length) {
          throw new TypeError(`Expected a folder; encountered a ${current.type} named '${current.name}' at path ${current.path}`)
        }
        item = current
        break
      case 'hardlink':
      case 'softlink':
        switch (current.contents.type) {
          case 'folder':
            if (i + 1 === tree.length && !resolveLinks) {
              item = current
            } else {
              item = current.contents
            }
            break
          case 'file':
            if (i + 1 < tree.length) {
              throw new TypeError(`Expected a folder; encountered a ${current.contents.type} named '${current.name}' at path ${current.path}`)
            } else if (i + 1 === tree.length && !resolveLinks) {
              item = current
            } else {
              item = current.contents
            }
            break
        }
        break
      default:
        throw new TypeError(`FATAL: Unexpected item type ${(current as Item).type} encountered.`)
    }
  }

  return item
}

/** Set an item in the file system tree. */
export function setItemAtPath (root: Root, item: Item): void {
  const tree = destructure(item.path)
  let parent: ParentItem = root

  for (let i = 0; i < tree.length; i += 1) {
    if (i + 1 === tree.length) {
      parent.set(item.name, item)
      break
    }

    let current: Item

    if ('get' in parent) {
      current = parent.get(tree[i])

      if (typeof current === 'undefined') {
        current = new Folder({
          adapter: root.adapter,
          name: tree[i],
          path: join(parent.path, tree[i])
        })

        parent.set(current.name, current)

        parent = current

        continue
      }
    } else {
      if (i + 1 < tree.length) {
        throw new TypeError(`Expected a folder; encountered a ${item.type} named '${item.name}' at path ${item.path}`)
      }
      break
    }

    switch (current.type) {
      case 'root':
      case 'folder':
        parent = current
        break
      case 'hardlink':
      case 'softlink':
        switch (current.contents.type) {
          case 'root':
          case 'folder':
            parent = current.contents
            break
          default:
            throw new TypeError(`Expected a folder; encountered a ${current.contents.type} named '${current.name}' at path ${current.path}`)
        }
        break
      default:
        throw new TypeError(`Expected a folder; encountered a ${current.type} named '${current.name}' at path ${current.path}`)
    }
  }
}
