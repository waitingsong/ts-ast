import { genDbDict } from './dict.js'
import { Db, DbDict } from './types.js'


export const dict: DbDict<Db> = genDbDict<Db>()

