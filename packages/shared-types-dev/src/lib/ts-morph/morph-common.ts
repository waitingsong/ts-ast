import assert from 'node:assert'

import { genAbsolutePath } from '@waiting/shared-core'
import {
  SourceFile,
  Project,
  Node,
  CallExpression,
  SyntaxKind,
  TypeNode,
  ProjectOptions,
  Type,
  ts,
} from 'ts-morph'

import { CallerInfo } from '../callstack/index.js'


export function createSourceFile(
  sourcePath: string,
  options?: ProjectOptions,
): SourceFile {

  assert(sourcePath, 'sourcePath is required')

  const defaultCompilerOptions = {
    declaration: false,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    // inlineSourceMap: false,
    // incremental: true,
    // module: ts.ModuleKind.CommonJS, // 1
    // module: ts.ModuleKind.NodeNext, // 199
    module: ts.ModuleKind.ESNext, // 99
    // moduleResolution: ts.ModuleResolutionKind.NodeJs, // 2
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    newLine: 1,
    noUnusedLocals: false,
    noUnusedParameters: false,
    pretty: true,
    skipLibCheck: true,
    strictPropertyInitialization: false,
    sourceMap: false,
    strict: true,
    target: 99,
    lib: ['lib.esnext.full.d.ts'],
  }

  const opts = options
    ? {
      // compilerOptions: {
      //   ...defaultCompilerOptions,
      // },
        ...options,
      }
    : {
        compilerOptions: {
          ...defaultCompilerOptions,
        },
      }

  // console.warn({
  //   opts,
  //   options,
  //   sourcePath,
  //  })

  const project = new Project(opts)
  // const checker = project.getTypeChecker()
  try {
    const pathFix = genAbsolutePath(sourcePath)
    const sourceFile = project.addSourceFileAtPath(pathFix)
    return sourceFile
  }
  catch (ex) {
    throw new Error(`createSourceFile() failed with sourcePath: "${sourcePath}"`, {
      cause: ex,
    })
  }
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


export function retrieveTypeArgsFromCallExpression(input: CallExpression<ts.CallExpression>): TypeNode<ts.TypeNode>[] {

  const nodes = input.getTypeArguments()
  return nodes
}

export function retrieveFirstTypeArgTextFromCallExpression(input: CallExpression<ts.CallExpression>): string {

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

export function retrieveVarnameFromCallExpression(expression: CallExpression<ts.CallExpression>): string {

  // console.log('expression: ', expression.getText())
  const parentNode = expression.getParent()
  if (! parentNode) {
    throw new TypeError('expression has no parent node')
  }
  const name = retrieveVarnameFromVariableDeclaration(parentNode)
  return name
}

export function retrieveVarnameFromVariableDeclaration(input: Node<ts.Node>): string {

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

export function retrieveVarInfoFromCallExpression(expression: CallExpression<ts.CallExpression>): VariableNameInfo | undefined {

  const parentNode = expression.getParent()
  if (! parentNode) {
    // throw new TypeError('expression has no parent node')
    return
  }
  const ret = retrieveVarInfoFromVariableDeclaration(parentNode)
  return ret
}


export function retrieveVarInfoFromVariableDeclaration(input: Node<ts.Node>): VariableNameInfo | undefined {

  const kind = input.getKind()
  const sym = input.getSymbol()
  if (kind === SyntaxKind.VariableDeclaration && sym) {
    // eslint-disable-next-line
    // const name = input.getNameNode().getText() as string
    const name = sym.getName() // variable name: dbDict
    const start = input.getStart()
    // postions of variable, not of declaration
    const { line, column } = input.getSourceFile().getLineAndColumnAtPos(start)
    const type = input.getType()
    // "import(url).DbDict<import(url).Db>"
    // import(".../packages/kmore-types/dist/index").DbDict<import(".../packages/kmore/test/test.model").Db>'
    // const txtRef = type.getText()
    // void txtRef
    let typeReferenceText = '' // "DbDict<D>"

    try {
      // @ts-expect-error
      if (typeof input.getTypeNodeOrThrow === 'function') {
        // input.getText() => 'dbDict = genDbDict<Db>()'

        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const typeReference = input.getTypeNodeOrThrow() as ts.TypeReferenceNode
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

export interface RetrieveCallExpressionByPosOpts extends CallerInfo {
  sourceFile: SourceFile
  line: number
  column: number
}

export function retrieveCallExpressionByPos(
  options: RetrieveCallExpressionByPosOpts,
  needle?: string | undefined,
): CallExpression | undefined {

  const file = options.sourceFile
  let expressions = file.getDescendantsOfKind(SyntaxKind.CallExpression)
  if (expressions.length === 0) {
    // ts.SyntaxKind.CallExpression may 203 or 204....
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    expressions = file.getDescendantsOfKind(203)
  }

  const key = needle
    ? needle
    : options.funcName
      ? options.funcName
      : options.methodName ? options.methodName : ''


  // genDbDict<DbModel>()
  const regex: RegExp | null = key
    ? new RegExp(`^${key}<\\S+>()`, 'u')
    : null

  const ret = expressions.find((node) => {
    const start = node.getStart()
    const { line, column } = file.getLineAndColumnAtPos(start)
    const txt = node.print()

    if (! txt) { return }

    if (options.line === line) {
      if (options.column === column) {
        const flag = needle && regex ? regex.test(txt) : true
        return flag
      }
      else if (options.enclosingColNumber === column) {
        const flag = needle && regex ? regex.test(txt) : true
        return flag
      }
      else if (regex) { // @TODO 精确匹配
        const flag = regex.test(txt)
        return flag
      }

    }
    // void else
  })
  return ret
}


/**
 * Retrieve variable name from CallExpression CallerInfo
 */
export function retrieveVarnameFromCallExpressionCallerInfo(options: CallerInfo): string {

  const file = createSourceFile(options.path)

  const opts: RetrieveCallExpressionByPosOpts = {
    sourceFile: file,
    ...options,
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
  needle?: string | undefined,
  sourceFile?: SourceFile | undefined,
): VariableNameInfo | undefined {

  const file = sourceFile ?? createSourceFile(options.path)

  const opts: RetrieveCallExpressionByPosOpts = {
    sourceFile: file,
    ...options,
  }

  const express = retrieveCallExpressionByPos(opts, needle)
  if (! express) {
    return
  }

  const info = retrieveVarInfoFromCallExpression(express)
  return info
}

