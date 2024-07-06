import assert from 'node:assert/strict'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileShortPath, genCurrentDirname } from '@waiting/shared-core'

import type { CallerInfo } from '../../src/index.js'
import { retrieveVarnameFromCallExpressionCallerInfo } from '../../src/index.js'


const __dirname = genCurrentDirname(import.meta.url)

describe(fileShortPath(import.meta.url), () => {

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

