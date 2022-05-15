// import { findSourceMap, SourceMap } from 'module'

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { install } from 'source-map-support'

import assert from 'node:assert/strict'

import { CallerInfo } from './types'


/**
 * If processSourceMap true,
 * the dep "source-map-support" should be installed
 */
export function getCallerStack(
  callerDistance = 0,
): CallerInfo {

  const depth = callerDistance + 1
  const stack = getStack()

  const stacks = getStackCallerSites()
  const site = stacks[depth]
  assert(site, 'stack empty')

  // @ts-expect-error
  const enclosingLineNumber: number | undefined = site.getEnclosingLineNumber
    // @ts-expect-error
    ? site.getEnclosingLineNumber() as number
    : void 0

  // @ts-expect-error
  const enclosingColNumber: number | undefined = site.getEnclosingColumnNumber
    // @ts-expect-error
    ? site.getEnclosingColumnNumber() as number
    : void 0

  const funcName = site.getFunctionName() ?? stacks[depth - 1]?.getFunctionName() ?? null
  const methodName = site.getMethodName() ?? stacks[depth - 1]?.getMethodName() ?? null

  const info = {
    fileName: site.getFileName(),
    lineNumber: site.getLineNumber(),
    columnNumber: site.getColumnNumber(),
    funcName,
    methodName,
    enclosingLineNumber,
    enclosingColNumber,
  }

  const arr = stack.split('\n')
  // const line = arr.pop() // one StackFram, but may all stacks sometime
  const [line] = arr.slice(depth + 1, depth + 2)
  if (! line) {
    throw new Error('Retrieve stack of caller failed, line empty.')
  }
  let path = ''
  if (line.includes('(')) {
    // "    at Object.<anonymous> (...\\30.caller-stack.test.ts:20:20)"
    // "    at Object.test1 (...\\call-config.ts:6:22)"
    path = line.slice(line.indexOf('(') + 1, -1)
  }
  else if (line.includes('at')) {
    // "    at ...\\call-config.ts:24:12"
    path = line.slice(line.indexOf('at') + 3, -1)
  }
  else {
    throw new Error('Retrieve stack of caller failed. ' + line)
  }

  if (! path) {
    throw new Error('Retrieve stack of caller failed')
  }

  const matched = /^(.+):(\d+):(\d+)$/u.exec(path)
  if (! matched || matched.length !== 4) {
    throw new Error('Retrieve stack of caller failed. ' + (matched ? JSON.stringify(matched) : ''))
  }

  const [, m1, m2, m3] = matched
  if (! m1 || ! m2 || ! m3) {
    throw new Error('Retrieved stack of caller empty. ' + JSON.stringify(matched))
  }
  const caller: CallerInfo = {
    // path: m1.replace(/\\/gu, '/'),
    path: m1.trim(),
    line: +m2,
    column: +m3,
    ...info,
  }

  return caller
}

/**
 * Get stack string
 * @see https://stackoverflow.com/a/13227808
 */
export function getStack(): string {
  // Save original Error.prepareStackTrace
  let origPrepareStackTrace = Error.prepareStackTrace

  /* istanbul ignore else */
  if (! origPrepareStackTrace) {
    // MUST installing inner getStack()
    // if (processSourceMap) {
    //   install()
    // }

    /* istanbul ignore else */
    if (! Error.prepareStackTrace) {
      throw new Error('Error.prepareStackTrace not defined')
    }
    origPrepareStackTrace = Error.prepareStackTrace
  }
  // void else in debug hooked by source-map-support already

  Error.prepareStackTrace = function(_err: Error, structuredStackTrace: NodeJS.CallSite[]): string {
    const target = structuredStackTrace.slice(1)
    // @ts-expect-error
    const ret = origPrepareStackTrace(err, target) as string
    return ret
  }

  const limit = Error.stackTraceLimit
  // Error.stackTraceLimit = depth + 2

  const err = new Error()
  const { stack } = err

  // Restore original `Error.prepareStackTrace`
  Error.prepareStackTrace = origPrepareStackTrace
  Error.stackTraceLimit = limit

  if (! stack) {
    throw new Error('stack EMPTY!')
  }

  return stack
}


export function getStackCallerSites(): NodeJS.CallSite[] {
  // Save original Error.prepareStackTrace
  let origPrepareStackTrace = Error.prepareStackTrace

  /* c8 ignore else */
  if (! origPrepareStackTrace) {
    /* c8 ignore else */
    if (! Error.prepareStackTrace) {
      throw new Error('Error.prepareStackTrace not defined')
    }
    origPrepareStackTrace = Error.prepareStackTrace
  }
  // void else in debug hooked by source-map-support already

  Error.prepareStackTrace = function(_: Error, structuredStackTrace: NodeJS.CallSite[]): NodeJS.CallSite[] {
    const target = structuredStackTrace.slice(1)
    return target
  }

  const limit = Error.stackTraceLimit
  // Error.stackTraceLimit = depth + 2

  const err = new Error()
  const stacks = err.stack as NodeJS.CallSite[] | undefined

  // Restore original `Error.prepareStackTrace`
  Error.prepareStackTrace = origPrepareStackTrace
  Error.stackTraceLimit = limit

  if (! stacks) {
    throw new Error('stacks EMPTY!')
  }

  return stacks
}
