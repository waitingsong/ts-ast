
export interface CallerInfo {
  path: string
  line: number
  column: number
  // from StackFram
  fileName?: string
  funcName?: string
  methodName?: string
  className?: string
  lineNumber?: number
  columnNumber?: number
  enclosingLineNumber?: number
  enclosingColNumber?: number
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

