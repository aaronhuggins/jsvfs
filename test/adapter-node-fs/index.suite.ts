import * as mockFs from 'mock-fs'
import * as sinon from 'sinon'
import * as fs from 'fs'
import { join, resolve } from 'path'
import { doesNotReject, strictEqual } from 'assert'
import { NodeFSAdapter } from '../../packages/adapter-node-fs/index'

const { existsSync, mkdirSync, symlinkSync, writeFileSync } = fs

describe('Module @jsvfs/adapter-node-fs', () => {
  before(function () {
    // Weird issue where, sometimes, the before hook times out in Mocha.
    this.timeout(5000)

    mockFs({
      // Allows the files to be accessible during the filesystem mock, without actually being deleted.
      '.nyc_output': mockFs.load(join(process.cwd(), '.nyc_output'), { lazy: true }),
      node_modules: mockFs.load(join(process.cwd(), 'node_modules'), { lazy: true }),
      packages: mockFs.load(join(process.cwd(), 'packages'), { lazy: true }),
      test: mockFs.load(join(process.cwd(), 'test'), { lazy: true })
    })
  })

  after(() => {
    mockFs.restore()
  })

  it('should construct an instance', () => {
    const nodeFs = new NodeFSAdapter()
    const nodeFs2 = new NodeFSAdapter({ flushEnabled: true })

    strictEqual(nodeFs.flushEnabled, false)
    strictEqual(nodeFs.handle, 'node-fs')
    strictEqual(nodeFs.root, process.cwd())
    strictEqual(Array.isArray(nodeFs.journal), true)
    strictEqual(nodeFs2.flushEnabled, true)
  })

  it('should handle flush API', async () => {
    sinon.stub(fs.promises, 'readdir').callsFake(async (path: any): Promise<any[]> => {
      switch (path) {
        case resolve('fake'):
          return [
            {
              name: 'folder',
              isDirectory: () => true,
              isFile: () => false,
              isSymbolicLink: () => false
            },
            {
              name: 'error',
              isDirectory: () => true,
              isFile: () => false,
              isSymbolicLink: () => false
            },
            {
              name: 'error.file',
              isDirectory: () => false,
              isFile: () => true,
              isSymbolicLink: () => false
            },
            {
              name: 'file.txt',
              isDirectory: () => false,
              isFile: () => true,
              isSymbolicLink: () => false
            }
          ]
        case resolve('fake/folder'):
          return [
            {
              name: 'subfolder',
              isDirectory: () => true,
              isFile: () => false,
              isSymbolicLink: () => false
            },
            {
              name: 'sublink',
              isDirectory: () => false,
              isFile: () => false,
              isSymbolicLink: () => true
            }
          ]
        case resolve('fake/error'):
          throw new Error('FAKE')
      }
    })
    mkdirSync('fake')
    mkdirSync('fake/folder')
    mkdirSync('fake/folder/subfolder')
    symlinkSync('fake/folder/subfolder', 'fake/folder/sublink', 'dir')
    writeFileSync('fake/file.txt', Buffer.alloc(0))

    const nodeFs = new NodeFSAdapter({ cwd: 'fake' })
    const checkSnapshot = async (expected: number): Promise<void> => {
      const accumulator = []

      for await (const a of nodeFs.snapshot()) {
        accumulator.push(a)
      }

      strictEqual(accumulator.length, expected)
    }

    await checkSnapshot(5)

    // With flushEnabled === false
    await doesNotReject(async () => {
      await nodeFs.flush()
    })

    await checkSnapshot(5)

    sinon.restore()

    // With flushEnabled === true
    await doesNotReject(async () => {
      nodeFs.flushEnabled = true

      await nodeFs.flush()
    })

    await checkSnapshot(0)
  })

  it('should handle individual file/folder APIs', async () => {
    const nodeFs = new NodeFSAdapter({ cwd: 'fake' })

    await doesNotReject(async () => {
      await nodeFs.write('/file2.txt')
    })

    await doesNotReject(async () => {
      await nodeFs.write('/file4.txt', Buffer.from([1, 2]))
    })

    await doesNotReject(async () => {
      await nodeFs.link('/file1.txt', '/file2.txt', 'softlink')
    })

    await doesNotReject(async () => {
      await nodeFs.link('/file3.txt', '/file4.txt', 'hardlink')
    })

    await doesNotReject(async () => {
      await nodeFs.mkdir('/folder')
    })
  })

  it('should handle remove item API', async () => {
    const cwd = 'fake2'
    const folder = '/folder'
    const file = '/file.txt'

    mkdirSync(cwd)
    mkdirSync(cwd + folder)
    writeFileSync(cwd + file, Buffer.alloc(0))

    const nodeFs = new NodeFSAdapter({ cwd })

    strictEqual(existsSync(cwd + folder), true)
    strictEqual(existsSync(cwd + file), true)

    await doesNotReject(async () => {
      await nodeFs.remove(folder, 'folder')
    })

    strictEqual(existsSync(cwd + folder), false)

    await doesNotReject(async () => {
      await nodeFs.remove(file, 'file')
    })

    strictEqual(existsSync(cwd + file), false)

    await doesNotReject(async () => {
      await nodeFs.remove('/', 'root')
    })
  })
})
