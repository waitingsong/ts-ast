import { genDbDict } from './dict.js'
import { Db, Db2, DbDict } from './types.js'


export const dict = genDbDict<Db>()

export function foo(): DbDict<Db2> {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const dict = genDbDict<Db2>()
  return dict
}

