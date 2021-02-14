import { Readable } from 'stream'
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

/** Convert a Readable stream to an Async Generator. Based on https://www.derpturkey.com/nodejs-async-generators-for-streaming */
export function streamToAsyncGenerator<T> (reader: Readable, chunkSize?: number): AsyncGenerator<T, void, unknown> {
  async function signalReadable (reader: Readable): Promise<void> {
    return await new Promise(resolve => {
      reader.once('readable', resolve)
    })
  }

  async function signalEnd (reader: Readable): Promise<void> {
    return await new Promise(resolve => {
      reader.once('end', resolve)
    })
  }

  async function * generator () {
    const endPromise = signalEnd(reader)

    while (!reader.readableEnded) {
      while (reader.readable) {
        const val = reader.read(chunkSize) || reader.read()

        if (typeof val !== 'undefined') {
          yield val
        } else {
          break
        }
      }

      const readablePromise = signalReadable(reader)

      await Promise.race([endPromise, readablePromise])
    }
  }

  return generator()
}
