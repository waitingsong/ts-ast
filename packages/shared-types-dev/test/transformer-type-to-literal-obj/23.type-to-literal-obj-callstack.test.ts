import {
  basename,
  join,
} from '@waiting/shared-core'

import { expectedDict } from '../literal/config'
import { Db, DbDict } from '../literal/types'

import { genDbDict, alter, fake } from './demo6'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {

  describe('Should computeCallExpressionToLiteralObj works', () => {
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
        void ret
      }
      catch (ex: any) {
        assert((ex as Error).message.includes('ret:32:15'), (ex as Error).message)
        return
      }
      assert(false, 'Should throw error, but not')
    })
  })

})

