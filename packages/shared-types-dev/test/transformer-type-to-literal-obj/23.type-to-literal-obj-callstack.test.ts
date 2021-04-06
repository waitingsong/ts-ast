/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  basename,
  join,
} from '@waiting/shared-core'
import ts from 'typescript'

import { expectedDict } from '../literal/config'

import { Db, DbDict, genDbDict } from './demo6'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {

  describe('Should transTypetoLiteralObj works', () => {
    it('demo1', async () => {
      const ret: DbDict<Db> = genDbDict<Db>()
      assert.deepStrictEqual(ret, expectedDict)
    })
  })

})

