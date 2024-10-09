import type { LiteralObject } from '@waiting/shared-types'
import type {
  CallExpression,
  SourceFile,
  ts,
} from 'ts-morph'


export interface TransFormOptions {
  sourceFile: SourceFile
  needle: string
  leadingString: string
  trailingString: string
}

export interface ProcessExpressionOptions {
  file: SourceFile
  express: CallExpression<ts.CallExpression>
  needle: TransFormOptions['needle']
  /**  type: Type<ts.Type> */
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


