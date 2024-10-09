/* eslint-disable unicorn/prefer-module */
import { createRequire } from 'node:module'
import { dirname } from 'node:path'

import { pathResolve } from '@waiting/shared-core'
import type { LiteralObject } from '@waiting/shared-types'
import {
  type CallExpression,
  type ImportClause,
  type ImportDeclaration,
  type ImportSpecifier,
  type NamedImports,
  type Node,
  type ObjectLiteralElementLike,
  type ObjectLiteralExpression,
  type PropertyAssignment,
  type StringLiteral,
  type TypeChecker,
  SyntaxKind,
  factory,
  isCallExpression,
  isImportDeclaration,
  isJSDocSignature,
} from 'typescript'


export function createObjectLiteralExpression(input: LiteralObject): ObjectLiteralExpression {

  const arr: ObjectLiteralElementLike[] = Object.entries(input).map(([key, value]) => {
    if (Array.isArray(value)) {
      throw new TypeError('property value not literal object, but array. key: ' + key)
    }
    else if (typeof value === 'string') {
      const node = createPropertyAssignmentOfString(key, value)
      return node
    }
    else if (typeof value === 'object' && Object.keys(value).length) {
      const node = createPropertyAssignmentOfObject(key, value)
      return node
    }
    throw new TypeError('property value not literal object. key: ' + key)
  })
  const ret = factory.createObjectLiteralExpression(arr, true)
  return ret
}

function createPropertyAssignmentOfString(
  key: string,
  value: string,
): PropertyAssignment {

  const ret = factory.createPropertyAssignment(
    factory.createIdentifier(key),
    factory.createStringLiteral(value),
  )
  return ret
}


function createPropertyAssignmentOfObject(
  key: string,
  value: LiteralObject,
): PropertyAssignment {

  const id = factory.createIdentifier(key)
  const expression = createObjectLiteralExpression(value)

  const arr = factory.createPropertyAssignment(
    id,
    expression,
  )
  return arr
}


/**
 * Generate ImportDeclaration from existing node of ImportDeclaration,
 * return undefined if none importSpecifier according to param skipSpecifiers
 */
export function processImportDeclaration(
  node: ImportDeclaration,
  skipSpecifiers: string[],
): ImportDeclaration | undefined {

  const module = (node.moduleSpecifier as StringLiteral).text // not getText()
  // console.info({ module })
  if (! module) {
    return
  }

  const st = new Set<string>()

  // const binds = node.importClause?.namedBindings
  const binds = node.importClause ? node.importClause.namedBindings : void 0
  if (binds && binds.kind === SyntaxKind.NamedImports) {
    binds.elements.forEach((elm: ImportSpecifier) => {
      const elmText = elm.getText()
      if (elmText && ! skipSpecifiers.includes(elmText)) {
        st.add(elmText)
      }
    })
  }

  if (! st.size) {
    return
  }

  const arr: ImportSpecifier[] = []
  st.forEach((name) => {
    const sp = factory.createImportSpecifier(
      true,
      factory.createIdentifier(name),
      factory.createIdentifier(name),
    )
    arr.push(sp)
  })
  if (! arr.length) {
    return
  }
  const nameImports: NamedImports = factory.createNamedImports(arr)
  const importClause: ImportClause = factory.createImportClause(
    false,
    void 0,
    nameImports,
  )
  const importDecl: ImportDeclaration = factory.createImportDeclaration(
    void 0,
    importClause,
    factory.createStringLiteral(module),
  )
  return importDecl
}


/**
 * Note: do NOT compare tsPath if both jsPath and tsPath are blank string and is ts.isImportDeclaration
 */
export function isKeysImportExpression(
  node: Node,
  jsPath: string,
  tsPath: string,
): node is ImportDeclaration {

  if (! isImportDeclaration(node)) {
    return false
  }

  if (jsPath === '' && tsPath === '') {
    return true // !
  }

  const module = (node.moduleSpecifier as StringLiteral).text // not getText()
  try {
    if (module.startsWith('.')) {
      const resolvedPath = pathResolve(dirname(node.getSourceFile().fileName), module)
      const path = require.resolve(resolvedPath).toLocaleLowerCase()
      // console.info({
      //   module, fupath: path, jsPath, tsPath,
      // })
      return (path === jsPath.toLocaleLowerCase() || path === tsPath.toLocaleLowerCase()) && !! path
    }
    else {
      const path = require.resolve(module)
      // console.info({
      //   module, fupath: path, jsPath, tsPath,
      // })
      return path === jsPath.toLocaleLowerCase() && !! path
    }
  }
  catch {
    // console.info({ module })
    return false
  }
}


/**
 * Note: do NOT compare tsPath if tsPath is blank string and is ts.isCallExpression
 */
export function isKeysCallExpression(
  node: Node,
  typeChecker: TypeChecker,
  needleName: string,
  tsPath: string, // if blank string, return true
): node is CallExpression {

  if (! isCallExpression(node)) {
    return false
  }
  const sign = typeChecker.getResolvedSignature(node)
  if (! sign) {
    return false
  }
  const { declaration } = sign
  if (! declaration || isJSDocSignature(declaration)) {
    return false
  }
  else {
    const txt = declaration.name ? declaration.name.getText() : ''
    if (txt) {
      return txt === needleName
    }
  }

  if (tsPath === '') {
    return true // !
  }

  const filename = declaration.getSourceFile().fileName
  try {
    const requireFix = typeof require === 'function'
      ? require
      : createRequire(import.meta.url)
    // require.resolve is required to resolve symlink.
    // https://github.com/kimamula/ts-transformer-keys/issues/4#issuecomment-643734716
    const path = requireFix.resolve(filename).toLocaleLowerCase()
    // console.log({ path, tsPath })
    return path === tsPath.toLocaleLowerCase() && !! path
  }
  catch (ex) {
    console.info({ ex })
    // declaration.getSourceFile().fileName may not be in Node.js require stack and require.resolve may result in an error.
    // https://github.com/kimamula/ts-transformer-keys/issues/47
    return false
  }
}
