/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { relative } from 'path'

import ts from 'typescript'

import { createObjectLiteralExpression } from '../../src/index'

import { literalObj1, literalObj2 } from './config'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {

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
        const text = prop.name && prop.name.text ? prop.name.text : ''
        assert(text === 'tb_user' || text === 'tb_user_ext')

        // @ts-expect-error
        const chilrenProps = prop.initializer.properties as ts.PropertyAssignment[]
        assert(chilrenProps && chilrenProps.length === 3)
        chilrenProps.forEach((childProp) => {
          assert(childProp.kind === ts.SyntaxKind.PropertyAssignment)
          assert(childProp.name)
          assert(childProp.name.kind === ts.SyntaxKind.Identifier)

          // @ts-ignore
          const text2 = childProp.name && childProp.name.text ? childProp.name.text : ''
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

