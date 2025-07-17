
export type And<B1 extends boolean, B2 extends boolean> = B1 extends true ? B2 extends true ? true : false : false;

export type And3<B1 extends boolean, B2 extends boolean, B3 extends boolean> = And<And<B1, B2>, B3>

export type Or<B1 extends boolean, B2 extends boolean> = B1 extends true ? true : B2 extends true ? true : false;

export type Not<B1 extends boolean> = B1 extends true ? false : true;

// 判断左边的类型是否可以分配给右侧类型，即 ==
export type CheckLeftIsExtendsRight<T extends any, R extends any> = T extends R
  ? true
  : false


// 判断左侧的类型是否是右侧的类型一致，即 ===。解释：如果这两个函数类型是相同的（即它们的返回值在所有情况下都相同），那么说明对于任意输入，A 和 B 的分配关系是一致的
// TypeScript 在比较函数类型的兼容性时，会检查 泛型参数的约束关系。TypeScript 会检查这两个函数类型是否在所有可能的泛型参数下行为一致。
export type IsEqual<A, B> = (<T>()=>T extends A ? 1 : 2) extends (<R>()=>R extends B ? 1 : 2) ? true : false;

// 判断是否不相等
export type IsNotEqual<A, B> = Not<IsEqual<A, B>>;

// 可为空
export type Nullable<T> = T | null | undefined;

// 类型是否为any
export type IsAny<T> = 0 extends (1 & T) ? true : false;

// 差异
export type Diff<T, C> = Exclude<T, C> | Exclude<C, T>;

// 并集
export type SumAggregate<T, C> = T | C;





