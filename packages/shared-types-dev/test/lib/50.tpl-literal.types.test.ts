import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { fileShortPath, genCurrentDirname, genCurrentFilename, getCallerStack } from '@waiting/shared-core'

import * as Foo from '##/lib/ts-morph/tpl-literal.types.js'


describe(fileShortPath(import.meta.url), () => {

  describe('Should work', () => {
    it('test1()', () => {
      void Foo
    })
  })

})

