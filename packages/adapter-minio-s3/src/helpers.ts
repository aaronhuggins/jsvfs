import { PathParseResult } from './types'

/** Function for iterating over a string and ensuring it is a valid container name.
 * See [Microsofts documentation](https://docs.microsoft.com/en-us/rest/api/storageservices/naming-and-referencing-containers--blobs--and-metadata#container-names)
 */
export function isContainerName (str: string): boolean {
  const validChars = '-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const minLength = 3
  const maxLength = 63
  const invalidStartChar = '-'
  const invalidSequence = '--'

  if (
    typeof str !== 'string' ||
    str.length < minLength ||
    str.length > maxLength ||
    str.includes(invalidSequence) ||
    str.startsWith(invalidStartChar)
  ) return false

  for (const char of [...str]) {
    if (!validChars.includes(char)) return false
  }

  return true
}

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
