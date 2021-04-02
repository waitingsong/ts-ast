/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  basename,
  join,
} from '@waiting/shared-core'
import ts from 'typescript'

import {
  retrieveVarnameFromCallerInfo,
  CallerInfo,
} from '../../src/index'

import { literalObj1, literalObj2 } from './config'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {

  describe('Should getCallExpressionByPosition works', () => {
    it('normal 1', () => {
      const path = join(__dirname, 'config3.ts')
      const opts: CallerInfo = {
        path,
        line: 4,
        column: 22,
      }
      const name = retrieveVarnameFromCallerInfo(opts)
      assert(name === 'dbDict')
    })
  })

})

