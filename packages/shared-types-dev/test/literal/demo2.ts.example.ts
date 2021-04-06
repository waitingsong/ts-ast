import { genDbDict } from './dict'
import { Db, DbDict } from './types'


export const dict: DbDict<Db> = genDbDict<Db>()

