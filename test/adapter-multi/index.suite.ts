import { doesNotReject, doesNotThrow, strictEqual } from 'assert'
import { MultiAdapter, observe } from '../../packages/adapter-multi/index'
import { NoopAdapter } from '../../packages/adapter-noop/index'
import { MinioS3Adapter } from '../../packages/adapter-minio-s3/index'
import { Journal } from '../../packages/extras/index'
import { JournalEntry } from '../../packages/types/index'
import { connection, s3rver } from '../adapter-minio-s3/helpers'

describe('Module @jsvfs/adapter-multi', () => {
  before(async function () {
    await s3rver.start()
  })

  after(async function () {
    await s3rver.stop()
  })

  it('should construct an instance', () => {
    const adapter = new MultiAdapter()

    strictEqual(adapter instanceof MultiAdapter, true)
  })

  it('should register adapters', () => {
    const adapter = new MultiAdapter()

    adapter.register(new NoopAdapter())
    adapter.register(new MinioS3Adapter({ access: connection }))
    // Ignores this adapter since it is a 'multi' instance.
    adapter.register(adapter)
  })

  it('should perform file system operations', async () => {
    const adapter = new MultiAdapter()

    adapter.register(new NoopAdapter())
    adapter.register(new MinioS3Adapter({
      access: connection,
      createIfNotExist: true
    }))

    await doesNotReject(async () => {
      const a = await adapter.snapshot()
      await a.next()
    })

    await doesNotReject(async () => {
      await adapter.flush()
    })

    await doesNotReject(async () => {
      await adapter.read('/nothing/file.txt')
    })

    await doesNotReject(async () => {
      await adapter.write('/nothing/file.txt', Buffer.from([1, 2, 3]))
    })

    await doesNotReject(async () => {
      await adapter.read('/nothing/file.txt')
    })

    await doesNotReject(async () => {
      await adapter.mkdir('/nothing/folder')
    })

    await doesNotReject(async () => {
      await adapter.link('/nothing/file2.txt', '/nothing/file.txt', 'hardlink')
    })

    await doesNotReject(async () => {
      await adapter.remove('/nothing/file.txt', 'file')
    })
  })

  it('should observe an array', () => {
    const a: any[] = []
    const b = new Journal()
    const c: any[] = []
    const expected1 = 12
    const expected2: JournalEntry = {
      level: 'info',
      op: 'flush',
      message: 'Anything goes.'
    }
    const accumulator: any[] = []
    const observer = (...items: any[]): void => {
      accumulator.push(...items)
    }

    observe(a, observer)
    observe(b, observer)

    a.push(expected1)
    b.push(expected2)

    strictEqual(accumulator[0], expected1)
    strictEqual(accumulator[1], expected2)

    Object.defineProperty(c, 'push', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: null
    })

    doesNotThrow(() => {
      observe(c, observer)
    })

    doesNotThrow(() => {
      observe({} as any, observer)
    })
  })
})
