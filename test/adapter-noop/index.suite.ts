import { doesNotReject, strictEqual } from 'assert'
import { NoopAdapter } from '../../packages/adapter-noop/index'

describe ('Module @jsvfs/adapter-noop', () => {
  it('should return void on all operations', async () => {
    const noop = new NoopAdapter()
    let counter = 0

    for await (const a of noop.snapshot()) {
      counter += 1
    }

    strictEqual(counter, 0)

    await doesNotReject(async () => {
      await noop.flush()
    })

    await doesNotReject(async () => {
      await noop.link('', '', 'softlink')
    })

    await doesNotReject(async () => {
      noop.mkdir('')
    })

    await doesNotReject(async () => {
      noop.write('')
    })
  })
})
