/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { relative } from 'path'

import { join } from '@waiting/shared-core'

import {
  retrieveVarnameFromCallExpressionCallerInfo,
  CallerInfo,
} from '../../src/index'


// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {

  describe('Should retrieveVarnameFromCallExpressionCallerInfo() work', () => {
    it('normal 1', () => {
      const path = join(__dirname, 'config3.ts')
      const opts: CallerInfo = {
        path,
        line: 5,
        column: 23,
      }
      const name = retrieveVarnameFromCallExpressionCallerInfo(opts)
      assert(name === 'dbDict')
    })
  })

})

