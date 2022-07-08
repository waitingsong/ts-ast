/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
import assert from 'node:assert/strict'
import { join, relative } from 'node:path'

import {
  retrieveVarnameFromCallExpressionCallerInfo,
  CallerInfo,
} from '../../src/index'


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

