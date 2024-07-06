import { genDbDict } from './dict.js'
import type { Db, DbDict } from './types.js'


export const dict: DbDict<Db> = genDbDict<Db>()

