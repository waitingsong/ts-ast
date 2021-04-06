import { computeCallExpressionToLiteralObj } from '../../src'
import { Db, DbDict } from '../literal/types'


export function genDbDict<D>(): DbDict<D> {
  const needle = 'genDbDict'
  const ret = computeCallExpressionToLiteralObj(needle)
  return ret as DbDict<D>
}

export {
  Db,
  DbDict,
}

