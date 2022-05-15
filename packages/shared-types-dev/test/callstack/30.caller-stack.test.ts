import assert from 'assert/strict'
import { relative } from 'path'

import { join } from '@waiting/shared-core'

import { getCallerStack } from '../../src/index'

import {
  test1, test2, test3, test4, test5,
  fake1, fake2,
} from './call-config'


const callerInfo = getCallerStack() // line:14, column: 34/20

const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')
const path1 = join(__dirname, 'call-config.ts')

describe(filename, () => {

  describe('Should demo1 work', () => {
    it('test1()', () => {
      const info = test1()
      assert(info.path === path1)
      assert(info.line === 6, info.line.toString())
      assert(info.column === 36, info.column.toString())
    })
    it('test2()', () => {
      const info = test2()
      assert(info.path === path1)
      assert(info.line === 11, info.line.toString())
      assert(info.column === 24, info.column.toString())
    })
    it('test3()', () => {
      const info = test3()
      assert(info.path === path1)
      assert(info.line === 24)
      assert(info.column === 2)
    })
    it('test4()', () => {
      const info = test4()
      assert(info.path === path1)
      assert(info.line === 30)
      assert(info.column === 3)
    })
    it('test5()', () => {
      const info = test5()
      assert(info.path === path1)
      assert(info.line === 37)
      assert(info.column === 32)
    })

    it('fake1()', () => {
      const info = fake1()
      assert(info.path !== path1)
      assert(info.line !== 15)
      assert(info.column !== 10)
    })
    it('fake2()', () => {
      const info = fake2()
      assert(info.path !== path1)
      assert(info.line !== 19)
      assert(info.column !== 10)
    })

    it('self', () => {
      const info = callerInfo
      assert(info.path === __filename)
      assert(info.line === 14)
      assert(info.column === 34)
    })
  })

})

