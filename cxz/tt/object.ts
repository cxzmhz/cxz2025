import * as common from './common'


//  对象类型的所有键转联合类型
export type KeysToUnion<T> = keyof T;

// 获取对象类型的值构成的联合类型
export type Values<T> = T[KeysToUnion<T>]

// 获取对象类型键够成的元组类型
export type KeysToTuple<T> = KeysToUnion<T>[]

// 过滤出符合类型 V 的属性
export type ExtractValues<T, V> = {
  [Key in keyof T as T[Key] extends V ? Key : never]: T[Key]
}

// 过滤出不符合类型 V 的属性
export type ExcludeValues<T, V> = {
  [Key in keyof T as T[Key] extends V ? never : Key]: T[Key]
}

// 向对象类型中添加 get 和 set 前缀
export type GetterSetterPrefix<T> = {
  [Key in keyof T as Key extends string ? `get${Capitalize<Key>}` : never]: {(): T[Key]}
} & {
  [Key in keyof T as Key extends string ? `set${Capitalize<Key>}` : never]: {(val: T[Key]): void}
} & T

// 将对象类型的每个属性值转为 get 和 set 形式
export type Proxify<T> = {
  [Key in keyof T]: {
    get(): T[Key],
    set(val: T[Key]): void
  }
}

// 将对象类型的每个属性值转为可为空的，类似内置方法Partial
export type NullableValue<T> = {
  [Key in keyof T]?: common.Nullable<T>
}

// 提取出符合类型 U 的键名构造新的对象类型
export type Include<T extends object, U extends keyof any> = {
  [Key in keyof T as Key extends U ? Key : never]: T[Key]
}

// 将对象类型的属性值填充为类型T
export type ChangeRecordType<K, T = undefined> = {
  [Key in keyof K]?: T
}

// 变为可写的对象类型
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

// 变为只读且可选的
export type ReadonlyPartial<T> = {
  readonly [P in keyof T]?: T[P]
}

// 将对象类型的所有属性转为可选
export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key]
}

// 查找对象类型的所有路径，以联合类型返回
export type ChainedAccessUnion<T extends object> = ChainedAccessUnionHelper<T>
type ChainedAccessUnionHelper<
  T,
  A = {
    [Key in keyof T]: T[Key] extends string ? never : T[Key]
  },
  B = {
    [Key in keyof A]: A[Key] extends never
      ? never
      : A[Key] extends object
      ?
          | `${Extract<Key, string>}.${Extract<keyof A[Key], string>}`
          | (ChainedAccessUnionHelper<A[Key]> extends infer U
              ? `${Extract<Key, string>}.${Extract<U, string>}`
              : never)
      : never
  }
> = T extends object
  ? Exclude<keyof A | Exclude<Values<B>, never>, never>
  : never




























