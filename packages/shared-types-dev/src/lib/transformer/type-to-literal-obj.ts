/* eslint-disable max-len */
// eslint-disable-next-line import/no-extraneous-dependencies
import ts from 'typescript'

import { getCallerStack } from '../callstack/index'
import { createSourceFile, retrieveVarInfoFromCallerInfo } from '../ts-morph/morph-common'
import {
  TransFormOptions,
  transformCallExpressionToLiteralType,
  CallExpressionPosKey,
  ComputedLiteralType,
} from '../ts-morph/tpl-literal'
import {
  createObjectLiteralExpression,
  isKeysCallExpression,
  isKeysImportExpression,
  processImportDeclaration,
} from '../ts/ts-common'

import {
  genTransformerFactor,
  GenTransformerFactorOpts,
  VisitNodeOpts,
} from './common'


export interface TransTypetoLiteralObjOpts {
  needle: string
  leadingString: string
  trailingString: string
  tsConfigFilePath: string
  /** Appending ` as DbDict<D>` at end of the literal object result */
  appendingTypeAssert: boolean
}

interface VOpts extends VisitNodeOpts, TransTypetoLiteralObjOpts {
  literalRet?: ComputedLiteralType
}

export function transTypetoLiteralObj(
  program: ts.Program,
  options: TransTypetoLiteralObjOpts,
): ts.TransformerFactory<ts.SourceFile> {

  const visitNodeOpts: VOpts = {
    program,
    jsPath: '',
    tsPath: '',
    // literalRet,
    ...options,
  }
  const opts: GenTransformerFactorOpts<VOpts> = {
    visitNodeHandler: visitNode,
    visitNodeOpts,
  }
  const transfactory = genTransformerFactor<VOpts>(opts)
  return transfactory
}


function visitNode(node: ts.SourceFile, options: VOpts): ts.SourceFile
function visitNode(node: ts.Node, options: VOpts): ts.Node | undefined
function visitNode(node: ts.Node, options: VOpts): ts.Node | undefined {
  if (ts.isSourceFile(node)) {
    if (! options.literalRet) {
      const path = node.fileName
      const file = createSourceFile(path, { tsConfigFilePath: options.tsConfigFilePath })
      const opts: TransFormOptions = {
        sourceFile: file,
        needle: options.needle,
        leadingString: options.leadingString,
        trailingString: options.trailingString,
        appendingTypeAssert: options.appendingTypeAssert,
      }
      const retObj = transformCallExpressionToLiteralType(opts)
      options.literalRet = retObj
    }
    return node
  }

  const typeChecker = options.program.getTypeChecker()
  /* istanbul ignore else */
  if (isKeysImportExpression(node, options.jsPath, options.tsPath)) {
    const nodeDecl = processImportDeclaration(node, [options.needle])
    return nodeDecl
  }
  if (! isKeysCallExpression(node, typeChecker, options.needle, options.tsPath)) {
    return node
  }
  if (! node.typeArguments || ! node.typeArguments.length) {
    return ts.factory.createArrayLiteralExpression([])
  }

  const pNode = node.parent
  if (pNode.kind === ts.SyntaxKind.VariableDeclaration) {
    const start = pNode.getStart()
    const sym = typeChecker.getSymbolAtLocation(pNode)
    // @ts-expect-error
    const { symbol }: { symbol: ts.Symbol | undefined } = pNode
    const pNodeName = sym
      ? sym.getName()
      : symbol ? symbol.getName() : ''

    const { line, character } = pNode.getSourceFile().getLineAndCharacterOfPosition(start)
    const fullKey = `${pNodeName}:${line + 1}:${character + 1}` as CallExpressionPosKey

    const literalObj = options.literalRet ? options.literalRet.fromPosKey(fullKey) : void 0
    if (! literalObj) { return node }

    const newNode = createObjectLiteralExpression(literalObj)
    /* istanbul ignore else */
    if (options.leadingString) {
      ts.addSyntheticLeadingComment(
        newNode,
        ts.SyntaxKind.MultiLineCommentTrivia,
        ` ${options.leadingString} `,
      )
    }
    /* istanbul ignore else */
    if (options.trailingString) {
      ts.addSyntheticTrailingComment(
        newNode,
        ts.SyntaxKind.MultiLineCommentTrivia,
        ` ${options.trailingString} `,
      )
    }

    return newNode
  }

  return node
}


export function computeCallExpressionToLiteralObj(
  needle: TransFormOptions['needle'],
): unknown {

  if (! needle) {
    throw new TypeError('param needle invalid')
  }

  const callerInfo = getCallerStack(2)
  const vinfo = retrieveVarInfoFromCallerInfo(callerInfo)
  if (! vinfo) {
    throw new Error('Retrieve variable name failed')
  }

  const defaultOpts = {
    needle,
    leadingString: 'eslint-disable',
    trailingString: 'eslint-enable',
    appendingTypeAssert: true,
  }
  const file = createSourceFile(callerInfo.path)
  const opts: TransFormOptions = {
    ...defaultOpts,
    sourceFile: file,
  }

  const postKey = `${vinfo.name}:${vinfo.line}:${vinfo.column}`
  const retType = transformCallExpressionToLiteralType(opts)
  const ret = retType.fromPosKey(postKey)
  if (! ret) {
    throw new Error(`Retrieve variable object failed, with posKey: "${postKey}"`)
  }

  return ret as unknown
}
