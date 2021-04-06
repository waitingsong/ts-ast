import { genDbDict } from './dict'
import { Db, Db2, DbDict } from './types'


export const dict1: DbDict<Db> = genDbDict<Db>()
export const dict2: DbDict<Db2> = genDbDict<Db2>()

