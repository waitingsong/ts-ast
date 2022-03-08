import assert from 'assert/strict'
import { relative } from 'path'

import { expectedDict } from '../literal/config'
import { Db, DbDict } from '../literal/types'

import { genDbDict, alter, fake } from './demo6'


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {

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

