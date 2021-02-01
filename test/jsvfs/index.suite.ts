import { doesNotThrow, strictEqual, throws } from 'assert'
import { dirname } from 'path'
import { VirtualFileSystem } from '../../packages/jsvfs/index'
import { NoopAdapter } from '../../packages/adapter-noop/index'

describe('Module @jsvfs/jsvfs/index.ts', () => {
  const testFolderPath = 'folder/subfolder'
  const testFilePath = testFolderPath + '/file.txt'

  it('should construct a virtual file system', () => {
    const vfs = new VirtualFileSystem()

    strictEqual((vfs as any).adapter instanceof NoopAdapter, true)
    strictEqual(vfs.separator, '/')
  })

  it('should read and write file items', () => {
    const adapter = new NoopAdapter()
    const vfs = new VirtualFileSystem(adapter)
    const testMsg = 'Hello, world!'

    doesNotThrow(() => {
      vfs.write(testFilePath)
    })

    const result1 = vfs.read(testFilePath)

    strictEqual(Buffer.isBuffer(result1), true)
    strictEqual(result1.length, 0)

    doesNotThrow(() => {
      vfs.write(testFilePath, testMsg)
    })

    const result2 = vfs.read(testFilePath)

    strictEqual(Buffer.isBuffer(result2), true)
    strictEqual(result2.toString('utf8'), testMsg)

    doesNotThrow(() => {
      vfs.write(testFilePath, new String(testMsg))
    })

    const result3 = vfs.read(testFilePath)

    strictEqual(Buffer.isBuffer(result3), true)
    strictEqual(result3.toString('utf8'), testMsg)

    doesNotThrow(() => {
      vfs.write(testFilePath, testMsg, true)
    })

    const result4 = vfs.read(testFilePath)

    strictEqual(Buffer.isBuffer(result4), true)
    strictEqual(result4.toString('utf8'), testMsg + testMsg)

    throws(() => {
      vfs.read(testFolderPath)
    })

    throws(() => {
      vfs.write(testFolderPath)
    })

    throws(() => {
      vfs.write(testFolderPath, '', true)
    })
  })

  it('should delete file items', () => {
    const vfs = new VirtualFileSystem()

    vfs.write(testFilePath)

    const result1 = vfs.exists(testFilePath)

    strictEqual(result1, true)

    doesNotThrow(() => {
      vfs.delete(testFilePath)
    })

    const result2 = vfs.exists(testFilePath)

    strictEqual(result2, false)

    doesNotThrow(() => {
      vfs.delete('/cats')
    })

    throws(() => {
      vfs.delete(testFolderPath)
    })
  })

  it('should create and remove folders', () => {
    const vfs = new VirtualFileSystem()

    doesNotThrow(() => {
      vfs.mkdir(testFolderPath)
    })

    const result1 = vfs.exists(testFolderPath)

    strictEqual(result1, true)

    doesNotThrow(() => {
      vfs.mkdir(testFolderPath)
    })

    doesNotThrow(() => {
      vfs.rmdir(testFolderPath)
    })

    const result2 = vfs.exists(testFolderPath)

    strictEqual(result2, false)

    const result3 = vfs.exists(dirname(testFolderPath))

    strictEqual(result3, true)

    doesNotThrow(() => {
      vfs.rmdir('/dogs')
    })

    vfs.write(testFilePath)

    throws(() => {
      vfs.rmdir(testFilePath)
    })
  })

  it('should list folder children', () => {
    const vfs = new VirtualFileSystem()
    const otherPath = testFolderPath + '/other'

    vfs.write(testFilePath)
    vfs.mkdir(otherPath)

    const results1 = vfs.readdir(testFolderPath)

    strictEqual(results1.length, 2)
    strictEqual(typeof results1[1], 'string')

    const results2 = vfs.readdir(testFolderPath, true)

    strictEqual(results2.length, 2)
    strictEqual(typeof results2[0].type, 'string')

    const results3 = vfs.readdir(otherPath, true)

    strictEqual(results3.length, 0)

    const results4 = vfs.readdir('/squirrel', true)

    strictEqual(results4.length, 0)

    throws(() => {
      vfs.readdir(testFilePath)
    })
  })
})
