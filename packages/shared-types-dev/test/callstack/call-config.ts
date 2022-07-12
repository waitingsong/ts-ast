import { CallerInfo, getCallerStack } from '../../src/index.js'
// Should not change code existing or insert, append it!


export function test1(): CallerInfo {
  const callerInfo = getCallerStack()
  return callerInfo
}

export const test2 = (): CallerInfo => {
  return getCallerStack()
}

export function fake1(): CallerInfo {
  return getCallerStack(-1)
}

export function fake2(): CallerInfo {
  return getCallerStack(2)
}

export function test3(): CallerInfo {
  return (() => {
    return getCallerStack()
  })()
}

export function test4(): CallerInfo {
  return (() => {
    const info = getCallerStack()
    return info
  })()
}

export function test5(): CallerInfo {
  const cb = () => {
    const info = getCallerStack()
    return info
  }
  return cb()
}

