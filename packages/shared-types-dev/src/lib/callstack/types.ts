
export interface CallerInfo {
  path: string
  line: number
  column: number

  // from StackFram
  fileName?: string | null
  lineNumber?: number | null
  columnNumber?: number | null
  funcName?: string | null
  methodName?: string | null
  enclosingLineNumber?: number | undefined
  enclosingColNumber?: number | undefined
}

// export interface StackFrame {
//   getTypeName: () => string
//   getFunctionName: () => string
//   getMethodName: () => string
//   getFileName: () => string
//   getLineNumber: () => number
//   getColumnNumber: () => number
//   isNative: () => boolean
// }

