/* eslint-disable max-len */
import assert from 'node:assert'

import { getCallerStack } from '@waiting/shared-core'
import { SourceFile, SyntaxKind } from 'ts-morph'
// eslint-disable-next-line import/no-extraneous-dependencies
import ts from 'typescript'

import {
  createObjectLiteralExpression,
  isKeysCallExpression,
  isKeysImportExpression,
  processImportDeclaration,
} from '../ts/ts-common.js'
import {
  RetrieveCallExpressionByPosOpts,
  createSourceFile,
  retrieveCallExpressionByPos,
  retrieveVarInfoFromCallExpressionCallerInfo,
} from '../ts-morph/morph-common.js'
import {
  ComputedLiteralType,
  transformCallExpressionToLiteralType,
} from '../ts-morph/tpl-literal.js'
import {
  TransFormOptions,
  CallExpressionPosKey,
} from '../ts-morph/tpl-literal.types.js'

import {
  genTransformerFactor,
  GenTransformerFactorOpts,
  VisitNodeOpts,
} from './common.js'


export interface TransTypetoLiteralObjOpts {
  needle: string
  leadingString: string
  trailingString: string
  tsConfigFilePath: string
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
  if (! node.typeArguments?.length) {
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
    const fullKey = `${pNodeName}:${line + 1}:${character + 1}`

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


export function computeCallExpressionToLiteralObj(funcName?: TransFormOptions['needle'] | undefined): unknown {

  const callerInfo = getCallerStack(2, true)
  let file: SourceFile
  try {
    file = createSourceFile(callerInfo.path)
  }
  catch (ex) {
    console.error('computeCallExpressionToLiteralObj() failed: ', {
      funcName,
      callerInfo,
    })
    throw ex
  }
  assert(file, 'createSourceFile() failed, with callerInfo: ' + JSON.stringify(callerInfo))

  const vinfo = retrieveVarInfoFromCallExpressionCallerInfo(callerInfo, funcName, file)
  if (! vinfo) {
    throw new Error(`Retrieve variable name failed: ${JSON.stringify(callerInfo)}`)
  }

  let needle = funcName
  if (! needle) {
    const opts2: RetrieveCallExpressionByPosOpts = {
      sourceFile: file,
      ...callerInfo,
    }
    const express = retrieveCallExpressionByPos(opts2)
    if (! express) {
      throw new Error('Result of retrieveCallExpressionByPos() is undefined')
    }
    const [funcId] = express.getDescendantsOfKind(SyntaxKind.Identifier)
    if (! funcId) {
      throw new Error('Retrieve function identifier failed. You should pass parameter needle')
    }
    needle = funcId.getText()
  }

  const opts: TransFormOptions = {
    needle,
    leadingString: 'eslint-disable',
    trailingString: 'eslint-enable',
    sourceFile: file,
  }
  const postKey: CallExpressionPosKey = `${vinfo.name}:${vinfo.line}:${vinfo.column}`
  const retType = transformCallExpressionToLiteralType(opts)
  const ret = retType.fromPosKey(postKey)
  if (! ret) {
    throw new Error(`Retrieve variable object failed, with posKey: "${postKey}"`)
  }

  return ret as unknown
}
