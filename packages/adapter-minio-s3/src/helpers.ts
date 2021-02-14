import { PathParseResult } from './types'

/** Parses a given path into a container and blob name. */
export function parse (path: string, root: string): PathParseResult {
  if (root === '/') {
    const parts = path.split('/')

    if (parts[0] === '') {
      return {
        bucketName: parts[1],
        blobName: parts.slice(2).join('/')
      }
    }

    return {
      bucketName: parts[0],
      blobName: parts.slice(1).join('/')
    }
  }

  return {
    bucketName: root,
    blobName: path[0] === '/' ? path.substring(1) : path
  }
}
