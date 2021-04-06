import { transPlaceHolder } from './dict'
import { Db, Db2, DbDict } from './types'


export const dict1: DbDict<Db> = transPlaceHolder<Db>()
export const dict2: DbDict<Db2> = transPlaceHolder<Db2>()

