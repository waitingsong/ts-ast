/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { fileShortPath, genCurrentDirname, isWin32 } from '@waiting/shared-core'
import { $ } from 'zx'

import {
  createSourceFile,
  transformCallExpressionToLiteralType,
  TransFormOptions,
} from '../../src/index.js'
import { CallExpressionPosKey } from '../../src/lib/ts-morph/tpl-literal.types.js'
import { testConfig } from '../root.config.js'

import { expectedDict, expectedDict2 } from './config.js'


const __dirname = genCurrentDirname(import.meta.url)

describe(fileShortPath(import.meta.url), () => {
  const { testDir } = testConfig

  const path01 = 'test/literal/demo1.ts'
  const path03 = 'test/literal/demo3.ts'
  const path04 = 'test/literal/demo4.ts'
  const path05 = 'test/literal/demo5.ts'
  const path07 = 'test/literal/demo7.ts'

  const path1 = join(testDir, '..', path01).replace(/\\/ug, '/')
  const path3 = join(testDir, '..', path03)
  const path4 = join(testDir, '..', path04)
  const path5 = join(testDir, '..', path05)
  const path7 = join(testDir, '..', path07)

  // const paths = `"${path01}" "${path03}" "${path04}" "${path05}" "${path07}"`
  const paths: string[] = [
    path01,
    path03,
    path04,
    path05,
    path07,
  ]

  const tsConfigFilePath = join(__dirname, '../../tsconfig.json')
  const defaultOpts = {
    needle: 'genDbDict',
    leadingString: 'eslint-disable',
    trailingString: 'eslint-enable',
  }

  beforeEach(async () => {
    await $`git restore ${paths}`
  })
  after(async () => {
    await $`git restore ${paths}`
  })

  describe('Should transformCallExpressionToLiteralType work', () => {
    it('demo1', async () => {
      const path = path1
      const file = createSourceFile(path, { tsConfigFilePath })
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
      }

      transformCallExpressionToLiteralType(opts)
      await file.save()

      const pathFix = isWin32 ? `file:///${path}` : path
      const dict = (await import(pathFix)).dict
      assert.deepStrictEqual(dict, expectedDict)

      const code = await readFile(path, { encoding: 'utf-8' })
      assert(code)
      assert(! code.includes(' as DbDict<'))
      assert(! code.includes(' as import('))
    })
    it('demo1 result', () => {
      const path = path1
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
      }

      const ret = transformCallExpressionToLiteralType(opts)
      assert(ret.size > 0)
      const arr = ret.fromKey('dict')
      assert(arr.length === 1)
      assert.deepStrictEqual(arr[0], expectedDict)

      let posKey: CallExpressionPosKey = 'dict:5:14'
      let obj = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj, expectedDict)

      posKey = 'dict:5:33'
      obj = ret.fromPosKey(posKey)
      assert(! obj)
    })

    it('demo3', async () => {
      const path = path3
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const pathFix = isWin32 ? `file:///${path}` : path
      const { dict1, dict2 } = await import(pathFix)
      assert.deepStrictEqual(dict1, expectedDict)
      assert.deepStrictEqual(dict2, expectedDict2)
    })
    it('demo3 result', () => {
      const path = path3
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
      }

      const ret = transformCallExpressionToLiteralType(opts)
      assert(ret.size === 2)

      const arr1 = ret.fromKey('dict1')
      assert(arr1.length === 1)
      const [obj1] = arr1
      assert.deepStrictEqual(obj1, expectedDict)

      const arr2 = ret.fromKey('dict2')
      assert(arr2.length === 1)
      const [obj2] = arr2
      assert.deepStrictEqual(obj2, expectedDict2)

      let posKey: CallExpressionPosKey = 'dict1:5:14'
      assert.deepStrictEqual(ret.fromPosKey(posKey), expectedDict)
      posKey = 'dict2:6:14'
      assert.deepStrictEqual(ret.fromPosKey(posKey), expectedDict2)
    })

    it('demo4', () => {
      const path = path4
      const file = createSourceFile(path, { tsConfigFilePath })
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
      }

      const ret = transformCallExpressionToLiteralType(opts)
      assert(ret.size === 2)
      const arr = ret.fromKey('dict')
      assert(arr.length === 2)

      let posKey: CallExpressionPosKey = 'dict:5:14'
      const obj1 = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj1, expectedDict)
      posKey = 'dict:9:9'
      const obj2 = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj2, expectedDict2)
    })

    it('demo5', async () => {
      const path = path5
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        needle: 'transPlaceHolder',
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const pathFix = isWin32 ? `file:///${path}` : path
      const { dict1, dict2 } = await import(pathFix)
      assert.deepStrictEqual(dict1, expectedDict)
      assert.deepStrictEqual(dict2, expectedDict2)
    })
    it('demo5 result', () => {
      const path = path5
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        needle: 'transPlaceHolder',
      }

      const ret = transformCallExpressionToLiteralType(opts)
      assert(ret.size === 2)

      const arr1 = ret.fromKey('dict1')
      assert(arr1.length === 1)
      const [obj1] = arr1
      assert.deepStrictEqual(obj1, expectedDict)

      const arr2 = ret.fromKey('dict2')
      assert(arr2.length === 1)
      const [obj2] = arr2
      assert.deepStrictEqual(obj2, expectedDict2)

      let posKey: CallExpressionPosKey = 'dict1:5:14'
      assert.deepStrictEqual(ret.fromPosKey(posKey), expectedDict)
      posKey = 'dict2:6:14'
      assert.deepStrictEqual(ret.fromPosKey(posKey), expectedDict2)
    })

    it('demo7', async () => {
      const path = path7
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        needle: 'transPlaceHolder',
      }

      transformCallExpressionToLiteralType(opts)
      await file.save()

      const pathFix = isWin32 ? `file:///${path}` : path
      const dict = (await import(pathFix)).dict
      assert.deepStrictEqual(dict, expectedDict)

      const code = await readFile(path, { encoding: 'utf-8' })
      assert(code)
      assert(code.includes(' as DbDict<Db>'))
      assert(! code.includes(' as import('))
    })
  })

})

