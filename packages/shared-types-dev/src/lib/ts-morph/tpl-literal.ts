import assert from 'node:assert'

import type { LiteralObject } from '@waiting/shared-types'
import type {
  Identifier,
  SourceFile,
  Symbol,
  TypeAliasDeclaration,
  TypeChecker,
  ts,
} from 'ts-morph'

import { deepFind } from '../util.js'

import {
  findCallExpressionsByName,
  retrieveFirstTypeArgTextFromCallExpression,
  retrieveVarInfoFromCallExpression,
} from './morph-common.js'
import type {
  CallExpressionPosKey,
  CallExpressionToLiteralTypePosKeyMap,
  ProcessExpressionOptions,
  TransFormOptions,
} from './tpl-literal.types.js'


export class ComputedLiteralType {

  constructor(public retMap: CallExpressionToLiteralTypePosKeyMap) { }

  get size(): number {
    return this.retMap.size
  }

  fromKey(inputKey: string): LiteralObject[] {
    const ret: LiteralObject[] = []
    this.retMap.forEach((value, posKey) => {
      const vname = this.pluckKey(posKey)
      if (vname && vname === inputKey) {
        ret.push(value)
      }
    })
    return ret
  }

  fromPosKey(inputPosKey: CallExpressionPosKey): LiteralObject | undefined {
    const ret = this.retMap.get(inputPosKey)
    return ret
  }

  /**
   * "dict:2:3" => "dict"
   */
  private pluckKey(posKey: CallExpressionPosKey): string {
    const arr = posKey.split(':')
    const ret = arr[0]
    assert(typeof ret === 'string')
    return ret
  }

}

/**
 * Transform variable declaration
 * @returns Map<varname, computer object>
 */
export function transformCallExpressionToLiteralType(options: TransFormOptions): ComputedLiteralType {

  const {
    sourceFile,
    needle,
    leadingString,
    trailingString,
  } = options

  const posKeyMap = new Map<CallExpressionPosKey, LiteralObject>()
  const indexMap = new Map<number, LiteralObject>()
  const assertsTextMap = new Map<number, string>()

  // const insertedNum = importModuleName
  //   ? hasImportNecessaryType(sourceFile, [resultType], importModuleName)
  //   : 0

  const expressions = findCallExpressionsByName(sourceFile, needle)
  expressions.forEach((express, idx) => {
    const info = retrieveVarInfoFromCallExpression(express)
    if (! info) {
      return
    }
    const typeText = info.typeReferenceText ? info.typeReferenceText : info.type.getText()
    assert(typeText, 'typeof variable is invalid')
    const posKey = `${info.name}:${info.line}:${info.column}`
    // @ts-expect-error types
    assert(! posKeyMap.has(posKey), `Duplicate varKey: "${posKey}"`)
    const opts: ProcessExpressionOptions = {
      file: sourceFile,
      express,
      needle,
      typeReferenceText: typeText,
    }
    const obj = genLiteralObjectFromExpression(opts)
    // @ts-expect-error types
    posKeyMap.set(posKey, obj)
    indexMap.set(idx, obj)
    const assertsTxt = info.typeReferenceText ? ` as ${typeText}` : ' as const'
    assertsTextMap.set(idx, assertsTxt)
  })
  // replace after node walk
  indexMap.forEach((obj, idx) => {
    const express = expressions[idx]
    if (! express) {
      return
    }
    const assertsTxt = assertsTextMap.get(idx)
    const jsonCode = `/* ${leadingString} */ `
      + JSON.stringify(obj, null, 2)
      + (assertsTxt ? assertsTxt : '')
      + ` /* ${trailingString} */`
    express.replaceWithText(jsonCode)
  })

  // const len = sourceFile.getStatements().length
  // if (insertedNum > 0 && len >= insertedNum) {
  //   sourceFile.removeStatements([len - insertedNum, len])
  // }

  const ret = new ComputedLiteralType(posKeyMap)
  return ret
}

export function genLiteralObjectFromExpression(options: ProcessExpressionOptions): LiteralObject {

  const {
    file,
    express,
    typeReferenceText,
  } = options

  if (typeReferenceText === 'any') {
    const gt = retrieveFirstTypeArgTextFromCallExpression(express)
    const path = file.getFilePath()
    const msg = `Generic type "${gt}" is resolved "any" in file "${path}"
    You can append variable type definition like: "const dict: DbDict<foo> = ...." to fix it
    `
    throw new TypeError(msg)
  }

  // let typeText = ''
  // if (type) {
  //   typeText = type.getText()
  // }
  // else {
  //   const doName = retrieveFirstTypeArgTextFromCallExpression(express)
  //   if (! doName) {
  //     // throw new Error(`Parameter D of ${AstKey.genDbDict}<D>() missing`)
  //     throw new Error(`Parameter D of ${needle}<D>() missing`)
  //   }
  //   typeText = `${resultType}<${doName}>`
  // }

  const typeText = patchJsExtForImportModulePath(typeReferenceText)
  const aliasName = 'T' + Math.random().toString().slice(-5)

  file.addStatements(`type ${aliasName} = ${typeText}`)
  const aliasDec = file.getTypeAlias(aliasName)
  let ret: LiteralObject = {}
  if (aliasDec) {
    // genTypeAliasDeclaration(ret, file, aliasDec, aliasName)
    const identifier: Identifier = aliasDec.getNameNode()
    const pp = file.getProject()
    const checker = pp.getTypeChecker()
    ret = genTypeAliasDeclarationFaster(checker, identifier)
    aliasDec.remove()
  }

  const node = express.getParent()
  return node ? ret : {}
}

/**
 * From 'import("F:/.../test/literal/types").DbDict<import("F:/.../test/literal/types").Db>' to
 * 'import("F:/.../test/literal/types.js").DbDict<import("F:/.../test/literal/types.js").Db>'
 */
function patchJsExtForImportModulePath(path: string): string {
  const ret = path.replaceAll(/import\("([^")]+?)"\)/gu, (substring: string) => {
    if (substring.endsWith('.js")')) {
      return substring
    }
    if (substring.endsWith('.ts")')) {
      return substring.replace('.ts"', '.js"')
    }
    return substring.replace('")', '.js")')
  })

  return ret
}

export function genTypeAliasDeclarationFaster(
  checker: TypeChecker,
  id: Identifier,
): LiteralObject {

  const resultObj: LiteralObject = {}
  const tt = id.getType()
  const typeProps = tt.getProperties()
  if (! typeProps.length) {
    // import("...test/literal/types").DbDict<import("...../test/literal/types").Db>
    const text2 = tt.getText() // 'ScopedTableFields<"tb_user", "uid" | "name">'
    throw new TypeError(`type "${text2}" has no properties`)
  }

  _genTypeAliasDeclarationFaster(
    resultObj,
    checker,
    id,
    typeProps,
    [],
  )

  return resultObj
}

function _genTypeAliasDeclarationFaster(
  resultObj: LiteralObject,
  checker: TypeChecker,
  id: Identifier,
  typeProps: Symbol[],
  pidPath: string[],
): void {

  const props = {
    configurable: false,
    enumerable: true,
    writable: true,
  }

  const curObj = pidPath.length ? deepFind(resultObj, pidPath) : resultObj
  if (typeof curObj !== 'object') {
    throw new TypeError(`Value of resultObject "${pidPath.join('.')} is not object"`)
  }

  typeProps.forEach((prop) => {
    const propKey = prop.getName()
    if (! propKey) {
      return
    }

    const tt = checker.getTypeOfSymbolAtLocation(prop, id)
    // const ttTextDebug = tt.getText() // 'ScopedTableFields<"tb_user", "uid" | "name">'
    // console.info(`ttTextDebug: ${ttTextDebug}`)
    const literalValue = tt.getLiteralValue()
    if (literalValue) {
      Object.defineProperty(curObj, propKey, {
        ...props,
        value: literalValue,
      })
      return
    }

    const pps = tt.getProperties()

    if (! pps.length) {
      const text2 = tt.getText() // 'ScopedTableFields<"tb_user", "uid" | "name">'
      const msg = `type "${text2}" has no properties,
        propKey: "${propKey}",
        pidPath: "${pidPath.join('.')}".
        try pass parameter tsConfigFilePath (path of tsconfig.json) during calling morph-common.createSourceFile()
        or --project <path-of-tsconfig.json> for cli
      `
      throw new TypeError(msg)
      // console.warn(msg)
      // return
    }

    const targetObj = pidPath.length === 0 ? resultObj : curObj
    Object.defineProperty(targetObj, propKey, {
      ...props,
      value: {},
    })

    pidPath.push(propKey)
    _genTypeAliasDeclarationFaster(
      resultObj,
      checker,
      id,
      pps,
      pidPath,
    )
    pidPath.pop()
  })

}

function retrieveLiteralValueFromTypeAliasDeclaration(typeAliasDecla: TypeAliasDeclaration): string | number | ts.PseudoBigInt | undefined {

  const parentIdentifier: Identifier = typeAliasDecla.getNameNode()
  const tt = parentIdentifier.getType()
  const literalValue = tt.getLiteralValue()
  return literalValue
}

export function genTypeAliasDeclaration(
  resultObj: object,
  file: SourceFile,
  typeAliasDecla: TypeAliasDeclaration,
  aliasName: string,
  delimiter = '_oo_',
): void {

  const props = {
    configurable: false,
    enumerable: true,
    writable: true,
  }

  const literalValue = retrieveLiteralValueFromTypeAliasDeclaration(typeAliasDecla)

  const parentIdentifier: Identifier = typeAliasDecla.getNameNode()
  const pidName = parentIdentifier.getText()
  const arr = pidName.split(delimiter)
  const pidPath = arr.length > 1 ? arr.slice(1) : []

  if (literalValue) {
    const tmpObj = pidPath.length ? deepFind(resultObj, pidPath.slice(0, -1)) : resultObj
    if (typeof tmpObj !== 'object') {
      throw new TypeError(`Value of resultObject "${pidPath.join('.')} is not object"`)
    }
    const propKey = pidPath.length > 1 ? pidPath.at(-1) : ''
    if (! propKey) {
      throw new TypeError('propKey empty')
    }
    Object.defineProperty(tmpObj, propKey, {
      ...props,
      value: literalValue,
    })
    typeAliasDecla.remove()
    return
  }

  const tt = parentIdentifier.getType()
  const typeProps = tt.getProperties()

  if (! typeProps.length) {
    const text2 = tt.getText() // 'ScopedTableFields<"tb_user", "uid" | "name">'
    throw new TypeError(`type "${text2}" has no properties,
      pidName: "${pidName}",
      pidPath: "${pidPath.join('.')}".
      `)
  }

  for (const prop of typeProps) {
    const propKey = prop.getName()
    if (! propKey) {
      continue
    }

    const typeKey = `${pidName}${delimiter}${propKey}`
    // const code = `type ${typeKey} = ${pidName}['${propKey}']`
    let code = `type ${typeKey} = ${aliasName}`
    pidPath.forEach((dir) => {
      code += `['${dir}']`
    })
    code += `['${propKey}']`
    // console.log({ typeKey, code })
    // const start = new Date()
    file.addStatements(code)
    const decla = file.getTypeAlias(typeKey)
    if (! decla) {
      throw new TypeError(`Declaration ${typeKey} not exists`)
    }
    // const id = decla.getNameNode()
    // const text = id.getText()
    const tmpObj = pidPath.length ? deepFind(resultObj, pidPath) : resultObj
    if (typeof tmpObj !== 'object') {
      throw new TypeError(`Value of resultObject "${pidPath.join('.')} is not object"`)
    }
    Object.defineProperty(tmpObj, propKey, {
      ...props,
      value: {},
    })
    genTypeAliasDeclaration(resultObj, file, decla, aliasName, delimiter)
    // const dd = new Date().getTime() - start.getTime()
    // console.log({ typeKey, code, dd })
  }

  if (arr.length > 1) {
    typeAliasDecla.remove()
  }
  return
}

