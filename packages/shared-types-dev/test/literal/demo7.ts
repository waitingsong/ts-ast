import { transPlaceHolder } from './dict'
import { Db, DbDict } from './types'


export const dict: DbDict<Db> = transPlaceHolder<Db>()

