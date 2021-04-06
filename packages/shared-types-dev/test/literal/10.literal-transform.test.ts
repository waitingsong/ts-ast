/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  basename,
  join,
  rimraf,
} from '@waiting/shared-core'
import { run } from 'rxrunscript'

import {
  createSourceFile,
  transformCallExpressionToLiteralType,
  TransFormOptions,
} from '../../src/index'

import { expectedDict, expectedDict2 } from './config'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {
  const path1 = join(__dirname, 'demo1.ts')
  const path2 = join(__dirname, 'demo2.ts')
  const path3 = join(__dirname, 'demo3.ts')
  const path4 = join(__dirname, 'demo4.ts')
  const tsConfigFilePath = join(__dirname, '../../tsconfig.json')
  const defaultOpts = {
    needle: 'genDbDict',
    resultType: 'DbDict',
    leadingString: 'eslint-disable',
    trailingString: 'eslint-enable',
  }

  beforeEach(async () => {
    await run(`cp -f "${path1}.example.ts" ${path1}`).toPromise()
    await run(`cp -f "${path2}.example.ts" ${path2}`).toPromise()
    await run(`cp -f "${path3}.example.ts" ${path3}`).toPromise()
    await run(`cp -f "${path4}.example.ts" "${path4}"`).toPromise()
  })
  after(async () => {
    await rimraf(path1)
    await rimraf(path2)
    await rimraf(path3)
    await rimraf(path4)
  })

  describe('Should transformCallExpressionToLiteralType works', () => {
    it('demo1', () => {
      const path = path1
      const file = createSourceFile(path, { tsConfigFilePath })
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: './types',
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const dict = require(path).dict
      assert.deepStrictEqual(dict, expectedDict)
    })
    it('demo1 w/o importModuleName', () => {
      const path = path1
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: '',
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const dict = require(path).dict
      assert.deepStrictEqual(dict, expectedDict)
    })
    it('demo1 result', () => {
      const path = path1
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: './types',
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

    it('demo2', () => {
      const path = path2
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: './types',
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const dict = require(path).dict
      assert.deepStrictEqual(dict, expectedDict)
    })
    it('demo2 w/o importModuleName', () => {
      const path = path2
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: '',
      }

      try {
        transformCallExpressionToLiteralType(opts)
      }
      catch (ex) {
        assert(ex instanceof TypeError)
        const { message } = ex as TypeError
        assert(message.includes('has no properties'))
        assert(message.includes('pidName:'))
        assert(message.includes('pidPath:'))
        return
      }
      assert(false, 'Should throw error but not')
    })
    it('demo2 result', () => {
      const path = path2
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: './types',
      }

      const ret = transformCallExpressionToLiteralType(opts)
      assert(ret.size > 0)
      const arr = ret.fromKey('dict')
      assert(arr.length === 1)
      assert.deepStrictEqual(arr[0], expectedDict)
    })

    it('demo3', () => {
      const path = path3
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: './types',
      }

      transformCallExpressionToLiteralType(opts)
      file.saveSync()

      const { dict1, dict2 } = require(path)
      assert.deepStrictEqual(dict1, expectedDict)
      assert.deepStrictEqual(dict2, expectedDict2)
    })
    it('demo3 w/o importModuleName', () => {
      const path = path3
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: '',
      }

      try {
        transformCallExpressionToLiteralType(opts)
      }
      catch (ex) {
        assert(ex instanceof TypeError)
        const { message } = ex as TypeError
        assert(message.includes('has no properties'))
        assert(message.includes('pidName:'))
        assert(message.includes('pidPath:'))
        return
      }
      assert(false, 'Should throw error but not')
    })
    it('demo3 result', () => {
      const path = path3
      const file = createSourceFile(path)
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: './types',
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
      posKey = 'dict2:31:14'
      assert.deepStrictEqual(ret.fromPosKey(posKey), expectedDict2)
    })

    it('demo4', () => {
      const path = path4
      const file = createSourceFile(path, { tsConfigFilePath })
      const opts: TransFormOptions = {
        ...defaultOpts,
        sourceFile: file,
        importModuleName: '',
      }

      const ret = transformCallExpressionToLiteralType(opts)
      assert(ret.size === 2)
      const arr = ret.fromKey('dict')
      assert(arr.length === 2)

      let posKey = 'dict:5:14'
      const obj1 = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj1, expectedDict)
      posKey = 'dict:34:9'
      const obj2 = ret.fromPosKey(posKey)
      assert.deepStrictEqual(obj2, expectedDict2)
    })
  })

})

