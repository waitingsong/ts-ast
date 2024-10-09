export function deepFind(obj: object, paths: string[]): unknown {
  let ret = {
    ...obj,
  }

  for (let i = 0, len = paths.length; i < len; i += 1) {
    const path = paths[i]
    if (! path) {
      throw new Error(`Value of paths[${i}] empty`)
    }
    // @ts-ignore
    if (typeof ret[path] === 'undefined') {
      return void 0
    }
    // @ts-ignore
    ret = ret[path] as unknown
  }

  return ret
}


