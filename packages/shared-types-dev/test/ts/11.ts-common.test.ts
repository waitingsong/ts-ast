import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import ts from 'typescript'

import { createObjectLiteralExpression } from '../../src/index.js'

import { literalObj1, literalObj2 } from './config.js'


describe(fileShortPath(import.meta.url), () => {

  describe('Should createObjectLiteralExpression work', () => {
    it('normal 1', () => {
      const expression = createObjectLiteralExpression(literalObj1)

      assert(expression.properties.length === 3)
      expression.properties.forEach((prop) => {
        assert(prop.kind === ts.SyntaxKind.PropertyAssignment)
      })
    })

    it('normal 2', () => {
      const expression = createObjectLiteralExpression(literalObj2)

      assert(expression.properties.length === 2)
      expression.properties.forEach((prop) => {
        assert(prop.kind === ts.SyntaxKind.PropertyAssignment)
        // @ts-expect-error
        const text = (prop.name?.text ? prop.name?.text : '') as string
        assert(text === 'tb_user' || text === 'tb_user_ext')

        // @ts-expect-error
        const childrenProps = prop.initializer.properties as ts.PropertyAssignment[]
        assert(childrenProps && childrenProps.length === 3)
        childrenProps.forEach((childProp) => {
          assert(childProp.kind === ts.SyntaxKind.PropertyAssignment)
          assert(childProp.name)
          assert(childProp.name.kind === ts.SyntaxKind.Identifier)

          // @ts-ignore
          const text2 = childProp.name?.text ? childProp.name.text : ''
          if (text === 'tb_user') {
            assert(text2 === 'uid' || text2 === 'name' || text2 === 'ctime')
          }
          else if (text === 'tb_user_ext') {
            assert(text2 === 'uid' || text2 === 'age' || text2 === 'address')
          }
          else {
            assert(false)
          }
        })
      })
    })

  })

})

