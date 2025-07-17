import * as array from './array'
import * as common from './common'
import * as number from './number'


// string
// 将类型转为字符串有一定的限制，仅支持下面的类型
export type CanStringified = string | number | bigint | boolean | null | undefined

// string
// 将支持的类型转化为字符串
export type Stringify<T extends CanStringified> = `${T}`

// 获取模板字符串类型中的字符 'abc' -> 'a' | 'b' | 'c', 'hello' -> 'h'|'e'|'l'|'o'
export type GetCharsHelper<S, Acc> = S extends `${infer Char}${infer Rest}` ? GetCharsHelper<Rest, Char | Acc> : Acc;
export type GetChars<S> = GetCharsHelper<S, never>;

// 获取字符串的分隔数组
export type SplitHelper<
  S extends string,
  Splitter extends string = '',
  T extends string[] = []
> = S extends `${infer FirstStr}${Splitter}${infer Rest}`
  ? SplitHelper<Rest, Splitter, array.Push<T, FirstStr>>
  : S extends string
    ? S extends ''
      ? T
      : array.Push<T, S>
    : never;  
export type Split<S extends string, Splitter extends string = ''> = SplitHelper<S, Splitter>

// 获取字符串的长度
export type GetStringLength<S extends string> = Split<S>['length'];

// 获取字符串在索引I下的字符
export type CharAt<S extends string, I extends number = 0> = Split<S>[I]

// 判断字符串是否包含子串
export type Includes<S extends string, S1 extends string> = S extends `${infer FirstStr}${S1}${infer Rest}` ? true : false;

// 判断字符串是否以子串为起始
export type StartsWith<
  S1 extends string,
  S2 extends string
> = S1 extends `${S2}${infer Right}` ? true : false

// 判断字符串是否以子串为结束
export type EndsWith<
  S1 extends string,
  S2 extends string
> = S1 extends `${infer Left}${S2}` ? true : false

// 在字符串中查找并替换一处子串
export type Replace<
  S1 extends string, 
  MatchStr extends string, 
  ReplaceStr extends string
> = S1 extends `${infer Left}${MatchStr}${infer Right}`
    ? `${Left}${ReplaceStr}${Right}`
    : S1;

// 在字符串中查找并替换所有子串
export type ReplaceAll<
  S extends string, 
  MatchStr extends string, 
  ReplaceStr extends string
> = Includes<S, MatchStr> extends true
  ? ReplaceAll<Replace<S, MatchStr, ReplaceStr>, MatchStr, ReplaceStr>
  : S;

// 生成重复 Times 次数的字符串
export type RepeatHelper<
  S extends string,
  Times extends number,
  Offset extends number = 1
> = Times extends 0
  ? ""
  : common.IsEqual<Times, Offset> extends true
  ? S
  // @ts-ignore
  : `${S}${RepeatHelper<
      S,
      Times,
      number.IntAddSingle<Offset, 1>
    >}`
export type Repeat<S extends string, Times extends number = 1> = RepeatHelper<S, Times>

// 当字符串不满足给定的长度时，在字符串前面或后面填充使其满足长度
export type PadLetters<
  S extends string,
  N extends number = 0,
  Fill extends string = " ",
  IsStart extends boolean = true, // 是否填充在字符串的前面
  Len extends number = GetStringLength<S>,
  Offset extends number = Len
> = number.Compare<N, Len> extends true 
    ? common.IsEqual<N, Offset> extends true
      ? S
      : PadLetters<
        `${IsStart extends true ? Fill : ''}${S}${IsStart extends false ? Fill : ''}`,
        N, 
        Fill, 
        IsStart, 
        Len, 
        number.IntAddSingle<Offset, 1>
      >
    : S


// 当字符串不满足给定的长度时，在字符串后面填充使其满足长度
export type PadStart<
  S extends string,
  N extends number = 0,
  Fill extends string = " "
> = PadLetters<S, N, Fill, true>;

// 当字符串不满足给定的长度时，在字符串后面填充使其满足长度
export type PadEnd<
  S extends string,
  N extends number = 0,
  Fill extends string = " "
> = PadLetters<S, N, Fill, false>

// 去掉字符串前面的空白符
export type TrimLeft<S extends string> = S extends `${
  | " "
  | "\t"
  | "\n"}${infer RightRest}`
  ? TrimLeft<RightRest>
  : S

// 去掉字符串后面的空白符
export type TrimRight<S extends string> = S extends `${infer LeftRest}${
  | " "
  | "\t"
  | "\n"}`
  ? TrimRight<LeftRest>
  : S

// 去掉字符串的开头和结尾的空白符
export type Trim<S extends string> = TrimRight<TrimLeft<S>>

// 从左往右查找子串的位置
export type IndexOfHelper<
  S1 extends string,
  S2 extends string,
  Len1 extends number = GetStringLength<S1>,
  Len2 extends number = GetStringLength<S2>
> = common.Or<
  number.Compare<Len1, Len2>,
  common.IsEqual<Len1, Len2>
> extends true
  ? S1 extends `${infer Left}${S2}${infer Right}`
    ? GetStringLength<Left>
    : -1
  : -1
export type IndexOf<S1 extends string, S2 extends string> = IndexOfHelper<S1, S2>

/**
 * 从右往左查找子串的位置（虽然是从右往左找子串，但是返回的位置还是找到的子串从左往右的第一个字符）
 * @example
 * export type Result = LastIndexOf<"23123", "23"> // 3
 */
export type LastIndexOfHelper<
  S1 extends string,
  S2 extends string,
  Index extends number = -1,
  AddOffset extends number = 0
> = S1 extends `${infer Left}${S2}${infer Right}`
  ? LastIndexOfHelper<
    Replace<S1, S2, ''>,
    S2,
    number.IntAddSingle<GetStringLength<Left>, AddOffset>,
    number.IntAddSingle<GetStringLength<S2>, AddOffset>
  >
  : Index;

export type LastIndexOf<S1 extends string, S2 extends string> = LastIndexOfHelper<S1, S2>;

// 拼接两个字符串
export type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`

// 截取start（包括）到end（不包括）之间的字符串(自行实现)
export type SubStringFn<
  S extends string,
  Start extends number = 0,
  End extends number = GetStringLength<S>,
  Astr extends string = '',
  Arr extends string[] = Split<S>,
  Acc extends number = 0
> = number.Compare<Start, Acc> extends false
  ? number.Compare<End, Acc> extends true
    ? SubStringFn<S, Start, End,  `${Astr}${Arr[Acc]}`, Arr, number.IntAddSingle<Acc, 1>>
    : Astr
  : SubStringFn<S, Start, End, Astr, Arr, number.IntAddSingle<Acc, 1>>

// 截取start（包括）到end（不包括）之间的字符串（论坛实现）
export type SubStringHelper<
  S extends string,
  Start extends number,
  End extends number,
  Offset extends number = 0,
  Cache extends string[] = []
> = common.IsEqual<Offset, End> extends true
  ? array.Join<Cache, ''>
  : SubStringHelper<
      S,
      Start,
      End,
      number.IntAddSingle<Offset, 1>,
      common.And3<
        common.Or<number.Compare<Offset, Start>, common.IsEqual<Offset, Start>>,
        common.Or<number.Compare<End, Offset>, common.IsEqual<Offset, End>>,
        CharAt<S, Offset> extends string ? true : false
      > extends true
        ? array.Push<Cache, CharAt<S, Offset>>
        : Cache
    >
export type SubString<
    S extends string,
    Start extends number,
    End extends number
  > = SubStringHelper<S, Start, End>;

// 在字符串中抽取从 开始 下标开始的指定数目的字符
export type SubStr<
  S extends string,
  Start extends number,
  Len extends number
  // @ts-ignore
> = SubStringHelper<S, Start, number.IntAddSingle<Start, Len>>