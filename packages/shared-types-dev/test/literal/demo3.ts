import { genDbDict } from './dict.js'
import type { Db, Db2 } from './types.js'


export const dict1 = genDbDict<Db>()
export const dict2 = genDbDict<Db2>()

