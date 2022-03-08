import assert from 'assert/strict'
import { readFile } from 'fs/promises'
import { relative } from 'path'

import { join } from '@waiting/shared-core'
import { firstValueFrom } from 'rxjs'
import { run } from 'rxrunscript'

import {
  createSourceFile,
  transformCallExpressionToLiteralType,
  TransFormOptions,
} from '../../src/index'

import { expectedDict, expectedDict2 } from './config'


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {
  const path1 = join(__dirname, 'demo1.ts')
  const path3 = join(__dirname, 'demo3.ts')
  const path4 = join(__dirname, 'demo4.ts')
  const path5 = join(__dirname, 'demo5.ts')
  const path7 = join(__dirname, 'demo7.ts')
  const paths = `"${path1}" "${path3}" "${path4}" "${path5}" "${path7}"`

  const tsConfigFilePath = join(__dirname, '../../tsconfig.json')
  const defaultOpts = {
    needle: 'genDbDict',
    leadingString: 'eslint-disable',
    trailingString: 'eslint-enable',
  }

  beforeEach(async () => {
    await firstValueFrom(run(`git restore ${paths}`))
  })
  after(async () => {
    await firstValueFrom(run(`git restore ${paths}`))
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

      const dict = require(path).dict
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

      let posKey = 'dict:5:14'
      let obj = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj, expectedDict)

      posKey = 'dict:5:33'
      obj = ret.fromPosKey(posKey)
      assert(! obj)
    })

    it('demo3', () => {
      const path = path3
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const { dict1, dict2 } = require(path)
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

      let posKey = 'dict1:5:14'
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

      let posKey = 'dict:5:14'
      const obj1 = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj1, expectedDict)
      posKey = 'dict:9:9'
      const obj2 = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj2, expectedDict2)
    })

    it('demo5', () => {
      const path = path5
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        needle: 'transPlaceHolder',
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const { dict1, dict2 } = require(path)
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

      let posKey = 'dict1:5:14'
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

      const dict = require(path).dict
      assert.deepStrictEqual(dict, expectedDict)

      const code = await readFile(path, { encoding: 'utf-8' })
      assert(code)
      assert(code.includes(' as DbDict<Db>'))
      assert(! code.includes(' as import('))
    })
  })

})

