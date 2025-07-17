
import * as string from "./string";
import * as number from "./number";
import * as common from "./common";

// 获取一定长度的Tuple
export type GetTupleHelper<N extends number = 0, R extends unknown[] = []> = R["length"] extends N ? R : GetTupleHelper<N, [...R, unknown]>;
export type GetTuple<N extends number = 0> = GetTupleHelper<N>;


// 更改元组中指定索引位的类型
export type ArraySetHelper<
  T extends unknown[],
  Index extends number,
  Value,
  Offset extends number = 0,
  Cache extends unknown[] = []
> = Offset extends T["length"]
  ? Cache
  : ArraySetHelper<
      T,
      Index,
      Value,
      number.IntAddSingle<Offset, 1>,
      // @ts-ignore
      Push<Cache, Offset extends Index ? Value : T[Offset]>
    >
export type ArraySet<T extends unknown[], Index extends number, Value,> = ArraySetHelper<T, Index, Value>;

// 去掉数组的最后一位
export type Pop<T extends unknown[]> = T extends [...infer RestT, infer LastItem] ? RestT : never;

// 去除元组类型的第一位
export type Shift<T extends unknown[]> = T extends [infer FirstItem, ...infer RestT] ? RestT : never;

// 在元组前面插入一位
export type UnShift<T extends unknown[], Item> = [Item, ...T];

// 添加到数组的末尾
export type Push<T extends unknown[], S extends string.CanStringified> = [...T, S];

// 合并两个元组类型
export type Concat<T1 extends unknown[], T2 extends unknown[]> = [...T1, ...T2];

// 将元组类型拼接成字符串类型
export type Join<
  T extends string.CanStringified[], 
  SplitStr extends string.CanStringified = ""
> = T['length'] extends 0
    ? ""
    : T extends [infer F, ...infer R]
      ? F extends string.CanStringified
        ? R extends string.CanStringified[]
          ? `${F}${T["length"] extends 1 ? "" : SplitStr}${Join<R, SplitStr>}`
          : never
        : never
      : never

// 从元（数）组类型构造联合类型，原理：元组（数组）类型的索引访问会得到联合类型
export type TupleToUnion<T extends unknown[]> = T[number];

// 校验元组中每个类型是否都符合条件
export type EveryHelper<
  T extends unknown[],
  Check,
  Offset extends number = 0,
  CacheBool extends boolean = true
> = T['length'] extends 0
  ? false
  : T['length'] extends Offset
    ? CacheBool
    : EveryHelper<
      T,
      Check,
      number.IntAddSingle<Offset, 1>,
      common.And<common.CheckLeftIsExtendsRight<T[Offset], Check>, CacheBool>
    >
export type Every<T extends unknown[], Check> = EveryHelper<T, Check>;

// 校验元组中是否有类型符合条件
export type SomeHelper<
  T extends unknown[],
  Check,
  Offset extends number = 0,
  CacheBool extends boolean = false
> = T['length'] extends Offset
  ? CacheBool
  : SomeHelper<
    T,
    Check,
    number.IntAddSingle<Offset, 1>,
    common.Or<common.CheckLeftIsExtendsRight<T[Offset], Check>, CacheBool>
  >
export type Some<T extends unknown[], Check> = SomeHelper<T, Check>;

// 以指定类型填充元组类型
export type FillHelper<
  T extends unknown[],
  F,
  Offset extends number = 0
> = T['length'] extends 0
  ? F[]
  : T['length'] extends Offset
    ? common.IsEqual<T, F[]> extends true
      ? T
      : F[]
      // @ts-ignore
    : FillHelper<Push<Shift<T>, F>, F, number.IntAddSingle<Offset, 1>>;
export type Fill<T extends unknown[], F = undefined> = FillHelper<T, F>;

// 过滤出元组类型中符合条件的类型
export type FilterHelper<
  T extends unknown[],
  C,
  Strict extends boolean,
  Offset extends number = 0,
  Cache extends unknown[] = []
> = Offset extends T["length"]
  ? Cache
  : FilterHelper<
      T,
      C,
      Strict,
      number.IntAddSingle<Offset, 1>,
      common.And<Strict, common.IsEqual<T[Offset], C>> extends true
      // @ts-ignore
        ? Push<Cache, T[Offset]>
        : common.And<
            common.Not<Strict>,
            common.CheckLeftIsExtendsRight<T[Offset], C>
          > extends true
          // @ts-ignore
        ? Push<Cache, T[Offset]>
        : Cache
    >
export type Filter<
  T extends unknown[],
  C,
  Strict extends boolean = false
> = FilterHelper<T, C, Strict>

// 将元组类型映射为带索引的元组类型
interface IndexMappedItem<Item, Index extends number, Tuple extends unknown[]> {
  item: Item
  index: Index
  tuple: Tuple
}
type MapWidthIndexHelper<
  T extends unknown[],
  Offset extends number = 0,
  Cache extends unknown[] = []
> = T["length"] extends Offset
  ? Cache
  : MapWidthIndexHelper<
      T,
      number.IntAddSingle<Offset, 1>,
      // @ts-ignore
      Push<Cache, IndexMappedItem<T[Offset], Offset, T>>
    >
/**
 * 将元组类型映射为带索引的元组类型
 * @example
 * type Result = MapWidthIndex<[1, 2]> // [{ item: 1; index: 0;tuple: [1, 2]; }, { item: 2; index: 1;tuple: [1, 2]; }]
 */
export type MapWidthIndex<T extends unknown[]> = MapWidthIndexHelper<T>

// 找到元组类型中第一个符合条件的类型
export type FindHelper<
  T extends unknown[],
  Check,
  Offset extends number = 0
> = Offset extends T['length']
  ? null
  : common.CheckLeftIsExtendsRight<T[Offset], Check> extends true
    ? T[Offset]
    : FindHelper<T, Check, number.IntAddSingle<Offset, 1>>
export type Find<
  T extends unknown[],
  Check,
  Offset extends number = 0
> = FindHelper<T, Check, Offset>

// 反转元组
export type ReverseHelper<
T extends unknown[],
Offset extends number = 0,
Cache extends unknown[] = []
> = Cache["length"] extends T["length"]
? Cache
: ReverseHelper<T, number.IntAddSingle<Offset, 1>, UnShift<Cache, T[Offset]>>
export type Reverse<T extends unknown[]> = ReverseHelper<T>

// 找到元组类型中第一个符合条件的类型的索引
type FindIndexHelper<
  T extends unknown[],
  C,
  Strict extends boolean = false,
  Offset extends number = 0
> = Offset extends number.IntAddSingle<T["length"], 1>
  ? -1
  : common.And<common.IsEqual<T[Offset], C>, Strict> extends true
  ? Offset
  : common.And<
      common.CheckLeftIsExtendsRight<T[Offset], C>,
      common.Not<Strict>
    > extends true
  ? Offset
  : FindIndexHelper<T, C, Strict, number.IntAddSingle<Offset, 1>>
export type FindIndex<
  T extends unknown[],
  C,
  Strict extends boolean = false
> = FindIndexHelper<T, C, Strict>

// 找到元组类型中最后一个符合条件的类型的索引
type FindLastIndexHelper<
  T extends unknown[],
  C,
  Item = Find<Reverse<MapWidthIndex<T>>, IndexMappedItem<C, number, T>>
> = Item extends IndexMappedItem<C, number, T> ? Item["index"] : -1

export type FindLastIndex<T extends unknown[], C> = FindLastIndexHelper<T, C>

// 扁平化元组
type FlatHelper<
  T extends unknown[],
  Offset extends number = 0,
  Cache extends unknown[] = []
> = Offset extends T["length"]
  ? Cache
  : FlatHelper<
      T,
      number.IntAddSingle<Offset, 1>,
      T[Offset] extends unknown[]
        ? Concat<Cache, T[Offset]>
        // @ts-ignore
        : Push<Cache, T[Offset]>
    >

export type Flat<T extends unknown[]> = FlatHelper<T>

//  元组类型中是否存在一个符合条件的类型
export type Includes<
  T extends unknown[],
  C
> = common.CheckLeftIsExtendsRight<C, TupleToUnion<T>>

// 提取元组类型中指定起始位置到指定结束位置的类型构造新元组类型
type SliceHelper<
  T extends unknown[],
  Start extends number,
  End extends number,
  Offset extends number = 0,
  Cache extends unknown[] = []
> = common.IsEqual<Offset, End> extends true
  ? Cache
  : SliceHelper<
      T,
      Start,
      End,
      number.IntAddSingle<Offset, 1>,
      common.And3<
        common.Or<number.Compare<Offset, Start>, common.IsEqual<Offset, Start>>,
        common.Or<number.Compare<End, Offset>, common.IsEqual<Offset, End>>,
        common.Or<
          number.Compare<T["length"], Offset>,
          common.IsEqual<T["length"], End>
        >
      > extends true
      // @ts-ignore
        ? Push<Cache, T[Offset]>
        : Cache
    >
export type Slice<
  T extends unknown[],
  Start extends number,
  End extends number
> = SliceHelper<T, Start, End>

// 排序，原理：最简单的冒泡排序，每次排序时，将大的与小的置换，注：受到嵌套实例深度的限制，只能排两个类型的元组
type SortHepler2<
  T extends number[],
  Offset extends number = 0,
  Offset1 extends number = 0,
  Offset1Added extends number = number.IntAddSingle<Offset1, 1>,
  Seted1 extends unknown[] = ArraySet<T, Offset1Added, T[Offset1]>,
  Seted2 extends unknown[] = ArraySet<Seted1, Offset1, T[Offset1Added]>
> = number.IntAddSingle<
  number.IntAddSingle<Offset, Offset1>,
  1
> extends T["length"]
  ? SortHepler1<T, number.IntAddSingle<Offset, 1>>
  : SortHepler2<
      number.Compare<T[Offset1], T[Offset1Added]> extends true
        ? Seted2 extends number[]
          ? Seted2
          : never
        : T,
      Offset,
      number.IntAddSingle<Offset1, 1>
    >

type SortHepler1<
  T extends number[],
  Offset extends number = 0
> = Offset extends T["length"] ? T : SortHepler2<T, Offset>

export type Sort<T extends number[]> = SortHepler1<T>

