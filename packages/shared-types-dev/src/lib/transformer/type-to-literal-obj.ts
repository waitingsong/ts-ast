/* eslint-disable max-len */
// eslint-disable-next-line import/no-extraneous-dependencies
import ts from 'typescript'

import { createSourceFile } from '../ts-morph/morph-common'
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
  resultType: string
  // importModuleName?: string
  leadingString: string
  trailingString: string
  tsConfigFilePath: string
  jsPath: string
  tsPath: string
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
        // importModuleName: options.importModuleName,
        needle: options.needle,
        resultType: options.resultType,
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

    const literalObj = options.literalRet?.fromPosKey(fullKey)
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

