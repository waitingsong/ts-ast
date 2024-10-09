import { genDbDict } from './dict.js'
import type { Db2, Db, DbDict } from './types.js'


export const dict = genDbDict<Db>()

export function foo(): DbDict<Db2> {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const dict = genDbDict<Db2>()
  return dict
}

