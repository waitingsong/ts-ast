import { genDbDict } from './dict.js'
import type { Db2, Db } from './types.js'


export const dict1 = genDbDict<Db>()
export const dict2 = genDbDict<Db2>()

