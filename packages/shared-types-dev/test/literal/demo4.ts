import { genDbDict } from './dict'
import { Db, Db2, DbDict } from './types'


export const dict = genDbDict<Db>()

export function foo(): DbDict<Db2> {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const dict = genDbDict<Db2>()
  return dict
}

