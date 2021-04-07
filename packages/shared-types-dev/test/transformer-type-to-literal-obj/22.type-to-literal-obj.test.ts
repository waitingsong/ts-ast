/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  basename,
  join,
  rimraf,
  writeFileAsync,
} from '@waiting/shared-core'
import ts from 'typescript'

import {
  transTypetoLiteralObj,
  TransTypetoLiteralObjOpts,
} from '../../src/index'
import { expectedDict } from '../literal/config'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {
  const testRetFile = join(__dirname, '../literal/.temp.ts')
  const compilerOpts = {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ESNext,
    inlineSourceMap: false,
    module: ts.ModuleKind.CommonJS,
  }
  const tsConfigFilePath = join(__dirname, '../../tsconfig.json')
  const defaultOpts = {
    tsConfigFilePath,
    needle: 'genDbDict',
    leadingString: 'eslint-disable',
    trailingString: 'eslint-enable',
    appendingTypeAssert: true,
  }

  before(async () => {
    await rimraf(testRetFile)
  })
  afterEach(async () => {
    await rimraf(testRetFile)
  })

  describe('Should transTypetoLiteralObj works', () => {
    it('demo1', async () => {
      const demo = '../literal/demo1.ts.example.ts'
      const path = join(__dirname, demo)
      const program = ts.createProgram(
        [path],
        compilerOpts,
      )
      const file = program.getSourceFile(path)
      if (! file) {
        throw new TypeError('sourceFile undefined')
      }

      const opts: TransTypetoLiteralObjOpts = {
        ...defaultOpts,
      }
      const tf = transTypetoLiteralObj(program, opts)
      const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(file, [tf])
      const [fileRet] = result.transformed
      if (! fileRet) {
        assert(false)
        return
      }
      const printer = ts.createPrinter()
      const codeRet = printer.printFile(fileRet)
      await writeFileAsync(testRetFile, codeRet)

      const dict = require(testRetFile).dict
      // console.info({ codeRet, dict })
      assert.deepStrictEqual(dict, expectedDict)
    })
  })

})

