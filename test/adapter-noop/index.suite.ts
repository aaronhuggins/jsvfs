import { strictEqual } from 'assert'
import { NoopAdapter } from '../../packages/adapter-noop/index'

describe('Module @jsvfs/adapter-noop', () => {
  it('should return void on all operations', async () => {
    const noop = new NoopAdapter()
    const accumulator = []

    for await (const a of noop.snapshot()) {
      accumulator.push(a)
    }

    strictEqual(accumulator.length, 0)

    const result1 = await noop.flush()

    strictEqual(typeof result1, 'undefined')

    const result2 = await noop.link('', '', 'softlink')

    strictEqual(typeof result2, 'undefined')

    const result3 = await noop.mkdir('')

    strictEqual(typeof result3, 'undefined')

    const result4 = await noop.write('')

    strictEqual(typeof result4, 'undefined')

    const result5 = await noop.remove('', 'file')

    strictEqual(typeof result5, 'undefined')
  })
})
