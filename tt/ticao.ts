// 实现一个加法器

import * as string from "./string"
import * as array from "./array"
import * as common from "./common"
import * as number from "./number"
// 每位数
type Numbers = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// 开头不能是多个0
type AdvancedNumericCharacters =
  | `${0}.${number}`
  | `${Exclude<Numbers, 0>}${number | ""}.${number}`
  | `${Exclude<Numbers, 0>}${Numbers | ""}.${number}`
  | `${Exclude<Numbers, 0>}${number}`
  | `${Numbers}`

// 定义加法表
type AddMap = [
  [
    { result: "0"; add: "0" }, // 00
    { result: "1"; add: "0" }, // 01
    { result: "2"; add: "0" }, // 02
    { result: "3"; add: "0" }, // 03
    { result: "4"; add: "0" }, // 04
    { result: "5"; add: "0" }, // 05
    { result: "6"; add: "0" }, // 06
    { result: "7"; add: "0" }, // 07
    { result: "8"; add: "0" }, // 08
    { result: "9"; add: "0" } // 09
  ],
  [
    { result: "1"; add: "0" }, // 10
    { result: "2"; add: "0" }, // 11
    { result: "3"; add: "0" }, // 12
    { result: "4"; add: "0" }, // 13
    { result: "5"; add: "0" }, // 14
    { result: "6"; add: "0" }, // 15
    { result: "7"; add: "0" }, // 16
    { result: "8"; add: "0" }, // 17
    { result: "9"; add: "0" }, // 18
    { result: "0"; add: "1" } // 19
  ],
  [
    { result: "2"; add: "0" }, // 20
    { result: "3"; add: "0" }, // 21
    { result: "4"; add: "0" }, // 22
    { result: "5"; add: "0" }, // 23
    { result: "6"; add: "0" }, // 24
    { result: "7"; add: "0" }, // 25
    { result: "8"; add: "0" }, // 26
    { result: "9"; add: "0" }, // 27
    { result: "0"; add: "1" }, // 28
    { result: "1"; add: "1" } // 29
  ],
  [
    { result: "3"; add: "0" }, // 30
    { result: "4"; add: "0" }, // 31
    { result: "5"; add: "0" }, // 32
    { result: "6"; add: "0" }, // 33
    { result: "7"; add: "0" }, // 34
    { result: "8"; add: "0" }, // 35
    { result: "9"; add: "0" }, // 36
    { result: "0"; add: "1" }, // 37
    { result: "1"; add: "1" }, // 38
    { result: "2"; add: "1" } // 39
  ],
  [
    { result: "4"; add: "0" }, // 40
    { result: "5"; add: "0" }, // 41
    { result: "6"; add: "0" }, // 42
    { result: "7"; add: "0" }, // 43
    { result: "8"; add: "0" }, // 44
    { result: "9"; add: "0" }, // 45
    { result: "0"; add: "1" }, // 46
    { result: "1"; add: "1" }, // 47
    { result: "2"; add: "1" }, // 48
    { result: "3"; add: "1" } // 49
  ],
  [
    { result: "5"; add: "0" }, // 50
    { result: "6"; add: "0" }, // 51
    { result: "7"; add: "0" }, // 52
    { result: "8"; add: "0" }, // 53
    { result: "9"; add: "0" }, // 54
    { result: "0"; add: "1" }, // 55
    { result: "1"; add: "1" }, // 56
    { result: "2"; add: "1" }, // 57
    { result: "3"; add: "1" }, // 58
    { result: "4"; add: "1" } // 59
  ],
  [
    { result: "6"; add: "0" }, // 60
    { result: "7"; add: "0" }, // 61
    { result: "8"; add: "0" }, // 62
    { result: "9"; add: "0" }, // 63
    { result: "0"; add: "1" }, // 64
    { result: "1"; add: "1" }, // 65
    { result: "2"; add: "1" }, // 66
    { result: "3"; add: "1" }, // 67
    { result: "4"; add: "1" }, // 68
    { result: "5"; add: "1" } // 69
  ],
  [
    { result: "7"; add: "0" }, // 70
    { result: "8"; add: "0" }, // 71
    { result: "9"; add: "0" }, // 72
    { result: "0"; add: "1" }, // 73
    { result: "1"; add: "1" }, // 74
    { result: "2"; add: "1" }, // 75
    { result: "3"; add: "1" }, // 76
    { result: "4"; add: "1" }, // 77
    { result: "5"; add: "1" }, // 78
    { result: "6"; add: "1" } // 79
  ],
  [
    { result: "8"; add: "0" }, // 80
    { result: "9"; add: "0" }, // 81
    { result: "0"; add: "1" }, // 82
    { result: "1"; add: "1" }, // 83
    { result: "2"; add: "1" }, // 84
    { result: "3"; add: "1" }, // 85
    { result: "4"; add: "1" }, // 86
    { result: "5"; add: "1" }, // 87
    { result: "6"; add: "1" }, // 88
    { result: "7"; add: "1" } // 89
  ],
  [
    { result: "9"; add: "0" }, // 90
    { result: "0"; add: "1" }, // 91
    { result: "1"; add: "1" }, // 92
    { result: "2"; add: "1" }, // 93
    { result: "3"; add: "1" }, // 94
    { result: "4"; add: "1" }, // 95
    { result: "5"; add: "1" }, // 96
    { result: "6"; add: "1" }, // 97
    { result: "7"; add: "1" }, // 98
    { result: "8"; add: "1" } // 99
  ]
]
  

// type Result = SplitByPoint<"1.02"> // ["1", "02"]
// 如果没有小数点，则小数位补 0 
type SplitByPoint<S extends AdvancedNumericCharacters> = string.Includes<
  S,
  "."
> extends true
  ? string.Split<S, ".">
  : [S, "0"]

// type Result = AddHelperSplitToArr<"1.02", "0.123"> // [["1", "02"], ["10", "123"]]
// 这里需要一起分割两个数字嘛
type AddHelperSplitToArr<
  S1 extends AdvancedNumericCharacters,
  S2 extends AdvancedNumericCharacters,
Result = [SplitByPoint<S1>, SplitByPoint<S2>]
> = Result extends [[`${number}`, `${number}`], [`${number}`, `${number}`]]
  ? Result
  : never


// type Result = AddFillZeroHelper<[["1", "02"], ["10", "123"]]> // [["01", "020"], ["10", "123"]]
// 对上面的结果用 PadStart 和 PadEnd 补 0
type AddFillZeroHelper<
  Data extends [[`${number}`, `${number}`], [`${number}`, `${number}`]],
  Result = [
    [
      string.PadStart<Data[0][0], string.GetStringLength<Data[1][0]>, "0">,
      string.PadEnd<Data[0][1], string.GetStringLength<Data[1][1]>, "0">
    ],
    [
      string.PadStart<Data[1][0], string.GetStringLength<Data[0][0]>, "0">,
      string.PadEnd<Data[1][1], string.GetStringLength<Data[0][1]>, "0">
    ]
  ]
> = Result extends [[`${number}`, `${number}`], [`${number}`, `${number}`]]
  ? Result
  : never

// type Result = AddFillZeroHelper<[["1", "02"], ["10", "123"]]> 
// [[["1", "0"], ["0", "2", "0"]], [["0", "1"], ["3", "2", "1"]]]
type AddReverseData<
  Data extends [[`${number}`, `${number}`], [`${number}`, `${number}`]],
  Result = [
    [
      array.Reverse<string.Split<Data[0][0]>>,
      array.Reverse<string.Split<Data[0][1]>>
    ],
    [
      array.Reverse<string.Split<Data[1][0]>>,
      array.Reverse<string.Split<Data[1][1]>>
    ]
  ]
> = Result extends [
  [`${Numbers}`[], `${Numbers}`[]],
  [`${Numbers}`[], `${Numbers}`[]]
]
  ? Result
  : never

type StepAdderHelper<
  DataLeft extends `${Numbers}`[], // 第一个待相加的数字数组
  DataRight extends `${Numbers}`[], // 第二个待相加的数字数组
  Curry extends `${Numbers}` = `${0}`, // 表示当前的进位值，默认为“0”
  Offset extends number = 0, // 表示当前处理的数组索引，默认为0
  ResultCache extends `${number}`[] = [], // 存储相加结果的数组
  NextOffset extends number = number.IntAddSingle<Offset, 1>, // 表示下一个数组索引
  Current extends AddMap[Numbers][Numbers] = AddMap[DataLeft[Offset]][DataRight[Offset]], // 表示当前位相加的结果和仅为信息
  CurrentWidthPreCurry extends `${Numbers}` = AddMap[Current["result"]][Curry]["result"] // 表示当前位相加并加上进位后的结果
> = DataLeft["length"] extends DataRight["length"]
  ? `${Offset}` extends `${DataLeft["length"]}`
    ? ResultCache
    : StepAdderHelper<
        DataLeft,
        DataRight,
        Current["add"],
        NextOffset,
        common.And<
          common.IsEqual<Current["add"], "1">,
          common.IsEqual<`${NextOffset}`, `${DataLeft["length"]}`>
        > extends true
          ? array.Push<["10", ...ResultCache], CurrentWidthPreCurry> // 最后添加“10”是为了处理进位的情况，后续可以通过判断数组的第一个元素是不是“10”，来确认是不是有额外的进位需要单独处理
          : array.Push<ResultCache, CurrentWidthPreCurry>
      >
  : never

type NumbersWidthCurry = Numbers | 10

type MergeResultHelper<
  Data extends [
    [`${Numbers}`[], `${Numbers}`[]],
    [`${Numbers}`[], `${Numbers}`[]]
  ],
  LeftInt extends `${Numbers}`[] = Data[0][0],
  LeftFloat extends `${Numbers}`[] = Data[0][1],
  RightInt extends `${Numbers}`[] = Data[1][0],
  RightFloat extends `${Numbers}`[] = Data[1][1],
  FloatAdded extends `${NumbersWidthCurry}`[] = StepAdderHelper<
    LeftFloat,
    RightFloat
  >,
  FloatHasCurry extends boolean = FloatAdded[0] extends "10" ? true : false,
  DeleteCurryFloatResult extends unknown[] = FloatHasCurry extends true
    ? array.Shift<FloatAdded>
    : FloatAdded,
  IntAdded extends `${NumbersWidthCurry}`[] = StepAdderHelper<
    LeftInt,
    RightInt,
    FloatHasCurry extends true ? `1` : "0"
  >,
  IntHasCurry extends boolean = IntAdded[0] extends "10" ? true : false,
  DeleteCurryIntResult extends unknown[] = IntHasCurry extends true
    ? array.Shift<IntAdded>
    : IntAdded,
  ResultReversed = array.Reverse<
    LeftFloat["length"] extends 0
      ? DeleteCurryIntResult
      : array.Concat<
          [...DeleteCurryFloatResult, "."],
          [...DeleteCurryIntResult]
        >
  >,
  FloatResult = array.Join<
    ResultReversed extends string[]
      ? IntHasCurry extends true
        ? ["1", ...ResultReversed]
        : ResultReversed
      : never,
    ""
  >
> = FloatResult

type Add<
  S1 extends AdvancedNumericCharacters,
  S2 extends AdvancedNumericCharacters
  // @ts-ignore
> = MergeResultHelper<
  // @ts-ignore
  AddReverseData<AddFillZeroHelper<AddHelperSplitToArr<S1, S2>>>
>

// type add = Add<"9007199254740991", "9007199254740991">
