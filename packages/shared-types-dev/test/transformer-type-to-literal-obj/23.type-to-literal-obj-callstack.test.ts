import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'

import { expectedDict } from '../literal/config.js'
import type { Db, DbDict } from '../literal/types.js'

import { alter, fake, genDbDict } from './demo6.js'


describe(fileShortPath(import.meta.url), () => {

  describe('Should computeCallExpressionToLiteralObj work', () => {
    it('w/o needle', async () => {
      const ret: DbDict<Db> = alter<Db>()
      assert.deepStrictEqual(ret, expectedDict)
    })

    it('with needle', async () => {
      const ret: DbDict<Db> = genDbDict<Db>()
      assert.deepStrictEqual(ret, expectedDict)
    })

    it('fake', async () => {
      try {
        const ret: DbDict<Db> = fake<Db>()
        console.warn({ ret })
      }
      catch (ex) {
        assert((ex as Error).message.includes('Retrieve variable name failed'), (ex as Error).message)
        return
      }
      assert(false, 'Should throw error, but not')
    })
  })

})

