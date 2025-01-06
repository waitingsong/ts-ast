import assert from 'node:assert/strict'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileShortPath } from '@waiting/shared-core'
import ts from 'typescript'

import type { TransTypetoLiteralObjOpts } from '../../src/index.js'
import { transTypetoLiteralObj } from '../../src/index.js'
import { expectedDict } from '../literal/config.js'


const __dirname = join(fileURLToPath(import.meta.url), '..')

describe(fileShortPath(import.meta.url), () => {
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
  }

  before(async () => {
    await rm(testRetFile, { force: true, recursive: true })
  })
  afterEach(async () => {
    await rm(testRetFile, { force: true, recursive: true })
  })

  describe('Should transTypetoLiteralObj work', () => {
    it('demo1', async () => {
      const demo = '../literal/demo1.ts.example.ts'
      const path = join(__dirname, demo)
      console.log('0000')
      const program = ts.createProgram(
        [path],
        compilerOpts,
      )
      const file = program.getSourceFile(path)
      if (! file) {
        throw new TypeError('sourceFile undefined')
      }
      console.log('0001')

      const opts: TransTypetoLiteralObjOpts = {
        ...defaultOpts,
      }
      const tf = transTypetoLiteralObj(program, opts)
      console.log('0002')
      const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(file, [tf])
      console.log('0003')
      const [fileRet] = result.transformed
      if (! fileRet) {
        assert(false)
      }
      const printer = ts.createPrinter()
      console.log('0004')
      const codeRet = printer.printFile(fileRet)
      console.log('0005')
      await writeFile(testRetFile, codeRet)
      console.log('0006')

      // const mod = require(testRetFile) as unknown
      const pathFix = `file://${testRetFile}`
      const mod = await import(pathFix) as unknown
      console.log('0007')
      assert(mod)
      // @ts-expect-error
      const dict = mod.dict as typeof expectedDict
      // console.info({ codeRet, dict })
      assert.deepStrictEqual(dict, expectedDict)
      console.log('0008')
    })
  })

})

