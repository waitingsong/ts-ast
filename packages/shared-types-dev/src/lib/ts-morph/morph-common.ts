import {
  ts,
  SourceFile,
  Project,
  Node,
  CallExpression,
  SyntaxKind,
  TypeNode,
  ProjectOptions,
  Type,
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

  // func<T>()
  const regx = new RegExp(`\\b${matchName}\\s*<\\s*\\S+\\s*>`, 'u')

  const arr = file.getDescendantsOfKind(SyntaxKind.CallExpression)
  const ret = arr.filter((expression) => {
    const code = expression.getText()
    if (regx.test(code)) {
      return true
    }
    return false
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
  return info ? info.name : ''
}


export interface VariableNameInfo {
  name: string
  line: number
  column: number
  type: Type<ts.Type>
  /** May blank string */
  typeReferenceText: string
}

export function retrieveVarInfoFromCallExpression(
  expression: CallExpression<ts.CallExpression>,
): VariableNameInfo | undefined {

  const parentNode = expression.getParent()
  if (! parentNode) {
    // throw new TypeError('expression has no parent node')
    return
  }
  const ret = retrieveVarInfoFromVariableDeclaration(parentNode)
  return ret
}


export function retrieveVarInfoFromVariableDeclaration(
  input: Node<ts.Node>,
): VariableNameInfo | undefined {

  const kind = input.getKind()
  const sym = input.getSymbol()
  if (kind === SyntaxKind.VariableDeclaration && sym) {
    // eslint-disable-next-line
    // const name = input.getNameNode().getText() as string
    const name = sym.getName()
    const start = input.getStart()
    const { line, column } = input.getSourceFile().getLineAndColumnAtPos(start)
    const type = input.getType() // getText() => "import(..).DbDict<import(...).D>"

    let typeReferenceText = '' // "DbDict<D>"
    try {
      // @ts-expect-error
      if (typeof input.getTypeNode === 'function') {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const typeReference = input.getTypeNode() as ts.TypeReferenceNode
        typeReferenceText = typeReference.getText()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        // if (typeReference.getKind() !== SyntaxKind.TypeReference) {
        //   throw new TypeError(`Variable type must be TypeReference, like "const dict: DbDict<Db> = ..."`)
        // }
      }
    }
    catch (ex) { void 0 }

    const ret = {
      name, line, column, type, typeReferenceText,
    }
    return ret
  }
  return
  // throw new TypeError('input is not VariableDeclaration node')
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

    if (options.line === line && options.column === column) {
      return true
    }
  })
  return ret
}


/**
 * Retrieve variable name from CallExpression CallerInfo
 */
export function retrieveVarnameFromCallExpressionCallerInfo(
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


/**
 * Retrieve variable CallerInfo from CallExpression CallerInfo
 */
export function retrieveVarInfoFromCallExpressionCallerInfo(
  options: CallerInfo,
): VariableNameInfo | undefined {

  const file = createSourceFile(options.path)

  const opts: RetrieveCallExpressionByPosOpts = {
    sourceFile: file,
    line: options.line,
    column: options.column,
  }

  const express = retrieveCallExpressionByPos(opts)
  if (! express) {
    return
  }

  const info = retrieveVarInfoFromCallExpression(express)
  return info
}

