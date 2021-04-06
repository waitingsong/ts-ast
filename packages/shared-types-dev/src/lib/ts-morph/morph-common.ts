import {
  ts,
  SourceFile,
  Project,
  Node,
  CallExpression,
  SyntaxKind,
  TypeNode,
  ProjectOptions,
} from 'ts-morph'

import { CallerInfo } from '../callstack/index'


export function createSourceFile(
  sourcePath: string,
  options?: ProjectOptions,
): SourceFile {

  const project = new Project(options)
  // const checker = project.getTypeChecker()
  const sourceFile = project.addSourceFileAtPath(sourcePath)
  return sourceFile
}


export function isTypeImported(
  file: SourceFile,
  matchTypeName: string,
  moduleName: string,
): boolean {

  if (! moduleName) {
    throw new Error('Value of param moduleName empty')
  }

  const arr = file.getDescendantsOfKind(SyntaxKind.ImportSpecifier)
  const exists = arr.map(item => item.getText())

  const name = matchTypeName.trim()
  if (exists.includes(name)) {
    return true
  }

  return false
}

export function hasImportNecessaryType(
  file: SourceFile,
  matchTypeNames: string[],
  moduleName: string,
): number {

  if (! moduleName) {
    throw new Error('Value of param moduleName empty')
  }

  let inserted = 0

  let statementsNum = file.getStatements().length

  matchTypeNames.forEach((typeName) => {
    const name = typeName.trim()
    if (isTypeImported(file, name, moduleName)) {
      return
    }

    const code = `import { ${name} } from '${moduleName}'`
    file.insertStatements(statementsNum, code)
    statementsNum += 1
    inserted += 1
  })

  return inserted
}


export function retrieveTypeArgsFromCallExpression(
  input: CallExpression<ts.CallExpression>,
): TypeNode<ts.TypeNode>[] {

  const nodes = input.getTypeArguments()
  return nodes
}

export function retrieveFirstTypeArgTextFromCallExpression(
  input: CallExpression<ts.CallExpression>,
): string {

  const [node] = retrieveTypeArgsFromCallExpression(input)

  if (! node) {
    return ''
  }
  const name = node.getText()
  return name
}


export function findCallExpressionsByName(
  file: SourceFile,
  matchName: string,
): CallExpression<ts.CallExpression>[] {

  const regx = new RegExp(`\\b${matchName}\\s*<\\s*\\S+\\s*>`, 'u')

  const arr = file.getDescendantsOfKind(SyntaxKind.CallExpression)
  const ret = arr.filter((expression) => {
    const code = expression.getText()
    if (! regx.test(code)) {
      return false
    }
    return true
  })

  return ret
}

export function retrieveVarnameFromCallExpression(
  expression: CallExpression<ts.CallExpression>,
): string {

  const parentNode = expression.getParent()
  if (! parentNode) {
    throw new TypeError('expression has no parent node')
  }
  const name = retrieveVarnameFromVariableDeclaration(parentNode)
  return name
}

export function retrieveVarnameFromVariableDeclaration(
  input: Node<ts.Node>,
): string {

  const info = retrieveVarInfoFromVariableDeclaration(input)
  return info.name
}


export interface VariableNameInfo {
  name: string
  line: number
  column: number
}

export function retrieveVarInfoFromCallExpression(
  expression: CallExpression<ts.CallExpression>,
): VariableNameInfo {

  const parentNode = expression.getParent()
  if (! parentNode) {
    throw new TypeError('expression has no parent node')
  }
  const ret = retrieveVarInfoFromVariableDeclaration(parentNode)
  return ret
}


export function retrieveVarInfoFromVariableDeclaration(
  input: Node<ts.Node>,
): VariableNameInfo {

  const kind = input.getKind()
  const sym = input.getSymbol()
  if (kind === SyntaxKind.VariableDeclaration && sym) {
    // eslint-disable-next-line
    // const name = input.getNameNode().getText() as string
    const name = sym.getName()
    const start = input.getStart()
    const { line, column } = input.getSourceFile().getLineAndColumnAtPos(start)
    return { name, line, column }
  }
  throw new TypeError('input is not VariableDeclaration node')
}

export interface RetrieveCallExpressionByPosOpts {
  sourceFile: SourceFile
  line: number
  column: number
}

export function retrieveCallExpressionByPos(
  options: RetrieveCallExpressionByPosOpts,
): CallExpression | undefined {

  const file = options.sourceFile
  const expressions = file.getDescendantsOfKind(ts.SyntaxKind.CallExpression)
  const ret = expressions.find((node) => {
    const start = node.getStart()
    const { line, column } = file.getLineAndColumnAtPos(start)

    if (options.line + 1 === line && options.column + 1 === column) {
      return true
    }
  })
  return ret
}


export function retrieveVarnameFromCallerInfo(
  options: CallerInfo,
): string {

  const file = createSourceFile(options.path)

  const opts: RetrieveCallExpressionByPosOpts = {
    sourceFile: file,
    line: options.line,
    column: options.column,
  }

  const express = retrieveCallExpressionByPos(opts)
  if (! express) {
    return ''
  }

  const pNode = express.getParentIfKind(ts.SyntaxKind.VariableDeclaration)
  if (pNode) {
    const varname = pNode.getName()
    return varname
  }

  return ''
}

