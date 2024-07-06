import { transPlaceHolder } from './dict.js'
import type { Db, Db2 } from './types.js'


export const dict1 = transPlaceHolder<Db>()
export const dict2 = transPlaceHolder<Db2>()

