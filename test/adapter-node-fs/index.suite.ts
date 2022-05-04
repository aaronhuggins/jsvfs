// deno-lint-ignore-file require-await no-explicit-any
import sinon from "https://cdn.skypack.dev/sinon@11.1.2?dts"
import * as fs from "https://deno.land/std@0.137.0/node/fs.ts";
import { describe, it } from "https://deno.land/x/deno_mocha@0.3.0/mod.ts"
import { resolve } from 'https://deno.land/std@0.137.0/node/path.ts'
import { doesNotReject, strictEqual } from 'https://deno.land/std@0.137.0/node/assert.ts'
import { process } from 'https://deno.land/std@0.137.0/node/process.ts'
import { Buffer } from "https://deno.land/std@0.137.0/node/buffer.ts"
import { NodeFSAdapter } from '../../modules/adapter-node-fs/mod.ts'

const { access, mkdir, symlink, writeFile } = fs.promises

async function exists (file: string): Promise<boolean> {
  try {
    await access(file, 0)
  } catch (_error) {
    return false
  }

  return true
}

describe('Module @jsvfs/adapter-node-fs', () => {

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
    sinon.stub(fs.promises, 'readdir').callsFake(async (path: any): Promise<any[] | undefined> => {
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
    await mkdir(Deno.cwd() + '/fake')
    await mkdir(Deno.cwd() + '/fake/folder')
    await mkdir(Deno.cwd() + '/fake/folder/subfolder')
    await symlink(Deno.cwd() + '/fake/folder/subfolder', Deno.cwd() + '/fake/folder/sublink', 'dir')
    await writeFile(Deno.cwd() + '/fake/file.txt', Buffer.alloc(0))

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
      await nodeFs.read('/file2.txt')
    })

    await doesNotReject(async () => {
      await nodeFs.write('/file2.txt')
    })

    await doesNotReject(async () => {
      await nodeFs.write('/file4.txt', Buffer.from([1, 2]))
    })

    await doesNotReject(async () => {
      await nodeFs.read('/file4.txt')
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
    const cwd = Deno.cwd() + '/fake2'
    const folder = '/folder'
    const file = '/file.txt'

    await mkdir(cwd)
    await mkdir(cwd + folder)
    await writeFile(cwd + file, Buffer.alloc(0))

    const nodeFs = new NodeFSAdapter({ cwd })

    strictEqual(await exists(cwd + folder), true)
    strictEqual(await exists(cwd + file), true)

    await doesNotReject(async () => {
      await nodeFs.remove(folder, 'folder')
    })

    strictEqual(await exists(cwd + folder), false)

    await doesNotReject(async () => {
      await nodeFs.remove(file, 'file')
    })

    strictEqual(await exists(cwd + file), false)

    await doesNotReject(async () => {
      await nodeFs.remove('/', 'root')
    })
  })
})
