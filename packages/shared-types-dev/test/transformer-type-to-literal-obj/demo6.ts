import { computeCallExpressionToLiteralObj } from '../../src'
import { DbDict } from '../literal/types'


export function genDbDict<D>(): DbDict<D> {
  const needle = 'genDbDict'
  const ret = computeCallExpressionToLiteralObj(needle)
  return ret as DbDict<D>
}

export function alter<D>(): DbDict<D> {
  const ret = computeCallExpressionToLiteralObj()
  return ret as DbDict<D>
}

export function fake<D>(): DbDict<D> {
  const needle = 'genDbDict'
  const ret = computeCallExpressionToLiteralObj(needle)
  return ret as DbDict<D>
}

// Do NOT export types inner this file!
// export {
//   Db,
//   DbDict,
// }

