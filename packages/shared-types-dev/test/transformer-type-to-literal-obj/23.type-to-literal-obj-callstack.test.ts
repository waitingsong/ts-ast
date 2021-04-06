/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  basename,
  join,
} from '@waiting/shared-core'
import ts from 'typescript'

import { expectedDict } from '../literal/config'

import { Db, DbDict, genDbDict, alter, fake } from './demo6'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {

  describe('Should transTypetoLiteralObj works', () => {
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
      catch (ex) {
        assert((ex.message as string).includes('ret:35:15'))
        return
      }
      assert(false, 'Should throw error, but not')
    })
  })

})

