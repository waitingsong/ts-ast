import {
  SnakeToCamel,
  SnakeToPascal,
} from '@waiting/shared-types'


export class Db {

  tb_user: UserDo
  tb_user_ext: UserExtDo

}

export class Db2 {

  tb_user: UserDo
  tb_user_ext: UserExtDo
  tb_order: OrderDo

}

export class UserDo {

  uid: number
  name: string
  ctime: Date | string

}

export class UserExtDo {

  uid: number
  age: number
  address: string

}


export class OrderDo {

  order_id: number
  order_name: string

}


export interface DbDict<D> {
  aliasColumns: DbTablesAliasCols<D>
  scopedColumns: DbScopedTablesCols<D>
}

export type DbScopedTablesCols<D> = {
  [TbName in keyof D]: ScopedTableFields<TbName & string, keyof D[TbName] & string>
}
export type ScopedTableFields<T extends string, K extends string> = {
  [FldName in K]: `${T}.${FldName}`
}

export type DbTablesAliasCols<D> = {
  [tbName in keyof D]: TableAliasCols<D[tbName], tbName & string>
}
export type TableAliasCols<T, TbName extends string> = {
  [K in keyof T as `${SnakeToCamel<TbName>}${SnakeToPascal<K & string>}`]: `${TbName}.${K & string}`
}

