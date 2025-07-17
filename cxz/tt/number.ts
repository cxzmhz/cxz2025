import * as common from './common';
import * as array from './array'
import * as string from './string';


// == number
export type NumberLike = number | `${number}`;

// 判断是否为0
export type IsZero<T extends NumberLike> = common.CheckLeftIsExtendsRight<T, 0 | '0'>;

// 判断是否大于0
export type IsOverZero<N extends NumberLike> = IsZero<N> extends true 
  ? false 
  : common.CheckLeftIsExtendsRight<string.Stringify<N> extends `${"-"}${infer Rest}` ? Rest : never, never> extends true
    ? true 
    : false;

// 判断是否小于0
export type IsLessZero<N extends NumberLike> = common.Not<IsOverZero<N>>;

// 比较2个数字的大小，N1 > N2 返回true，N1 < N2 返回false，N1 === N2 返回false
export type CompareHelper<
  N1 extends number, 
  N2 extends number, 
  T1 extends unknown[] = array.GetTuple<N1>, 
  T2 extends unknown[] = array.GetTuple<N2>
> = common.IsNotEqual<T1, T2> extends true ?
  common.Or<IsZero<T1["length"]>, IsZero<T2["length"]>> extends true ? 
    IsZero<T1["length"]> extends true ?
    false :
    true
  : CompareHelper<array.Pop<T1>['length'], array.Pop<T2>['length']>
: false;
export type Compare<N1 extends number, N2 extends number> = CompareHelper<N1, N2>;

// 两数相减（值为绝对数）
export type IntMinusSingleAbsHelper <
  N1 extends number, 
  N2 extends number, 
  T1 extends unknown[] = array.GetTuple<N1>, 
  T2 extends unknown[] = array.GetTuple<N2>
> = common.IsNotEqual<T1, T2> extends true ?
  common.Or<IsZero<T1['length']>, IsZero<T2['length']>> extends true ?
    IsZero<T1['length']> extends true ?
      T2['length'] :
      T1['length']
    : IntMinusSingleAbsHelper<array.Pop<T1>['length'], array.Pop<T2>['length']>
  : 0
export type IntMinusSingleAbs<N1 extends number, N2 extends number>  = IntMinusSingleAbsHelper<N1, N2>

// 正整数（包括0）的加法，A 和 B最大为999
export type IntAddSingleHepler<A extends number, B extends number> = [...array.GetTuple<A>, ...array.GetTuple<B>]["length"];
export type IntAddSingle<A extends number, B extends number> = IntAddSingleHepler<A, B> extends number ? IntAddSingleHepler<A, B> : number;

// 是否为浮点型；注：OnlyCheckPoint表示是否只需要判断有没有小数点就可以了，否则就还需要判断小数点后面的是不是都是0，如果都是0，就不算浮点数
export type IsFloat<
  N extends NumberLike,
  OnlyCheckPoint extends boolean = true
> = string.Stringify<N> extends `${infer Left}${"."}${infer Right}`
  ? OnlyCheckPoint extends true
    ? true
    : common.Not<array.Every<string.Split<Right>, "0">>
  : false;


// number类型是否是整数
export type IsInt<
  N extends NumberLike,
  OnlyCheckPoint extends boolean = true
> = common.Not<IsFloat<N, OnlyCheckPoint>>

export type GetHalfHelper<N extends number, Offset extends number = 0> = common.IsEqual<
  N,
  IntAddSingle<Offset, Offset>
> extends true
  ? Offset
  : common.IsEqual<N, IntAddSingle<IntAddSingle<Offset, Offset>, 1>> extends true
    ? IntAddSingle<Offset, 1>
    : GetHalfHelper<N, IntAddSingle<Offset, 1>>
export type GetHalf<N extends number> = GetHalfHelper<N>;

// 字符串类型转数字类型
type Map = {
  "0": [],
  "1": [1],
  "2": [...Map["1"], 1],
  "3": [...Map["2"], 1],
  "4": [...Map["3"], 1],
  "5": [...Map["4"], 1],
  "6": [...Map["5"], 1],
  "7": [...Map["6"], 1],
  "8": [...Map["7"], 1],
  "9": [...Map["8"], 1],
}
// 将结果乘10
type Make10Array<T extends any[]> = [
  ...T,
  ...T,
  ...T,
  ...T,
  ...T,
  ...T,
  ...T,
  ...T,
  ...T,
  ...T
]
export type ToNumberHelper<
  S extends string,
  L extends any[] = []
> = S extends `${infer F}${infer R}`
  ? ToNumberHelper<
    R,
    [...Make10Array<L>, ...(F extends keyof Map ? Map[F] : never)]
  >
  : L['length']
export type ToNumber<S extends string> = ToNumberHelper<S>



