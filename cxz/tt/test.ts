
type CanAddType = string | number | bigint | boolean | null | undefined;
type NumberLike = number | `${number}`;


type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

type GetTuple<
  N extends number,
  Cache extends unknown[] = []
> = IsEqual<N, Cache['length']> extends true
  ? Cache
  : GetTuple<N, [...Cache, unknown]>;


type IntAdd<
  A extends number, 
  B extends number,
  T1 extends unknown[] = GetTuple<A>,
  T2 extends unknown[] = GetTuple<B>
> = [...T1, ...T2]['length'];



type aaa = IntAdd<1, 2>
