/* eslint-disable @typescript-eslint/ban-types */
import { LiteralObject } from '@waiting/shared-types'
import {
  ts,
  Identifier,
  SourceFile,
  TypeAliasDeclaration,
  CallExpression,
  Symbol,
  TypeChecker,
} from 'ts-morph'

import { deepFind } from '../util'

import {
  findCallExpressionsByName,
  retrieveVarInfoFromCallExpression,
} from './morph-common'


const props = {
  configurable: false,
  enumerable: true,
  writable: true,
}

export interface TransFormOptions {
  sourceFile: SourceFile
  needle: string
  leadingString: string
  trailingString: string
  /** Default: true */
  appendingTypeAssert: boolean
}

export interface ProcessExpressionOptions {
  file: SourceFile
  express: CallExpression<ts.CallExpression>
  needle: TransFormOptions['needle']
  // type: Type<ts.Type>
  typeReferenceText: string
}
export type CallExpressionToLiteralTypeVarKeyMap = Map<string, LiteralObject>
export type CallExpressionToLiteralTypePosKeyMap = Map<CallExpressionPosKey, LiteralObject>
/**
 * format "varname:lineNumber:columnNumber"
 */
export type CallExpressionPosKey = `${string}:${LineNumber}:${ColumnNumber}`
type LineNumber = number
type ColumnNumber = number

export class ComputedLiteralType {
  constructor(
    public retMap: CallExpressionToLiteralTypePosKeyMap,
  ) { }

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

  fromPosKey(inputPosKey: CallExpressionPosKey | string): LiteralObject | undefined {
    const ret = this.retMap.get(inputPosKey as CallExpressionPosKey)
    return ret
  }

  /**
   * "dict:2:3" => "dict"
   */
  private pluckKey(posKey: CallExpressionPosKey | string): string {
    const arr = posKey.split(':')
    return arr[0] as string
  }
}

/**
 * Tansform varialbe declaraion
 * @returns Map<varname, computer object>
 */
export function transformCallExpressionToLiteralType(
  options: TransFormOptions,
): ComputedLiteralType {

  const {
    sourceFile,
    needle,
    leadingString,
    trailingString,
    appendingTypeAssert,
  } = options

  const posKeyMap = new Map<CallExpressionPosKey, LiteralObject>()

  // const insertedNum = importModuleName
  //   ? hasImportNecessaryType(sourceFile, [resultType], importModuleName)
  //   : 0

  const expressions = findCallExpressionsByName(sourceFile, needle)
  expressions.forEach((express) => {
    const info = retrieveVarInfoFromCallExpression(express)
    if (! info) {
      return
    }
    if (! info.type.getText() && ! info.typeReferenceText) {
      throw new Error('typeof variable is invalid')
    }
    const typeText = info.typeReferenceText ? info.typeReferenceText : info.type.getText()
    const posKey = `${info.name}:${info.line}:${info.column}` as CallExpressionPosKey
    if (posKeyMap.has(posKey)) {
      throw new Error(`Duplicate varKey: "${posKey}"`)
    }
    const opts: ProcessExpressionOptions = {
      file: sourceFile,
      express,
      needle,
      typeReferenceText: typeText,
    }
    const obj = genLiteralObjectFromExpression(opts)
    posKeyMap.set(posKey, obj)

    const jsonCode = `/* ${leadingString} */ `
      + JSON.stringify(obj, null, 2)
      + (appendingTypeAssert ? ` as ${typeText}` : '')
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

export function genLiteralObjectFromExpression(
  options: ProcessExpressionOptions,
): LiteralObject {

  const {
    file,
    express,
    typeReferenceText,
  } = options

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
  const typeText = typeReferenceText
  // const typeText = type.getText()
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

export function genTypeAliasDeclarationFaster(
  checker: TypeChecker,
  id: Identifier,
): LiteralObject {

  const resultObj: LiteralObject = {}
  const tt = id.getType()
  const typeProps = tt.getProperties()
  if (! typeProps.length) {
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

  const curObj = pidPath.length ? deepFind(resultObj, pidPath) : resultObj
  if (typeof curObj !== 'object') {
    throw new TypeError(`Value of resultObje "${pidPath.join('.')} is not object"`)
  }

  for (const prop of typeProps) {
    const propKey = prop.getName()
    if (! propKey) {
      continue
    }

    const tt = checker.getTypeOfSymbolAtLocation(prop, id)
    const literalValue = tt.getLiteralValue()
    if (literalValue) {
      Object.defineProperty(curObj, propKey, {
        ...props,
        value: literalValue,
      })
      continue
    }

    const pps = tt.getProperties()

    if (! pps.length) {
      const text2 = tt.getText() // 'ScopedTableFields<"tb_user", "uid" | "name">'
      throw new TypeError(`type "${text2}" has no properties,
        propKey: "${propKey}",
        pidPath: "${pidPath.join('.')}".
        try pass parameter tsConfigFilePath (path of tsconfig.json) during calling morph-common.createSourceFile()
      `)
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
  }
}

function retrieveLiteralValueFromTypeAliasDeclaraion(
  typeAliasDecla: TypeAliasDeclaration,
): string | number | ts.PseudoBigInt | undefined {

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

  const literalValue = retrieveLiteralValueFromTypeAliasDeclaraion(typeAliasDecla)

  const parentIdentifier: Identifier = typeAliasDecla.getNameNode()
  const pidName = parentIdentifier.getText()
  const arr = pidName.split(delimiter)
  const pidPath = arr.length > 1 ? arr.slice(1) : []

  if (literalValue) {
    const tmpObj = pidPath.length ? deepFind(resultObj, pidPath.slice(0, -1)) : resultObj
    if (typeof tmpObj !== 'object') {
      throw new TypeError(`Value of resultObje "${pidPath.join('.')} is not object"`)
    }
    const propKey = pidPath.length > 1 ? pidPath.slice(-1)[0] : ''
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
    file.addStatements(code)
    const decla = file.getTypeAlias(typeKey)
    if (! decla) {
      throw new TypeError(`Declaraion ${typeKey} not exists`)
    }
    // const id = decla.getNameNode()
    // const text = id.getText()
    const tmpObj = pidPath.length ? deepFind(resultObj, pidPath) : resultObj
    if (typeof tmpObj !== 'object') {
      throw new TypeError(`Value of resultObje "${pidPath.join('.')} is not object"`)
    }
    Object.defineProperty(tmpObj, propKey, {
      ...props,
      value: {},
    })
    genTypeAliasDeclaration(resultObj, file, decla, aliasName, delimiter)
  }

  if (arr.length > 1) {
    typeAliasDecla.remove()
  }
  return
}

