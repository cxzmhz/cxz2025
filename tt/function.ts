

// 普通函数类型
export type Noop = (...args: any) => any;

// 获取异步函数返回值
export type GetAsyncFunctionReturnType<F extends Noop> = Awaited<ReturnType<F>>

// 获取参数长度
export type GetFunctionLength<F extends Noop> = F extends (...args: infer P) => any
  ? P['length']
  : never;


// 方案一：函数重载（推荐生产环境使用）
// function add(a: string, b: string): string;
// function add(a: number, b: number): number;
// function add(a: string, b: number): string;
// function add(a: number, b: string): string;
// function add(a: string | number, b: string | number): string | number {
//   return (typeof a === 'string' || typeof b === 'string')
//     ? `${a}${b}`
//     : a + b;
// }

// // 测试用例
// console.log(add("1", "2"));    // "12" (string)
// console.log(add(1, 2));        // 3 (number)
// console.log(add("1", 2));      // "12" (string)
// console.log(add(1, "2"));      // "12" (string)

// 方案二
// 定义条件类型
type AddResult<T extends string | number, U extends string | number> =
  T extends string 
    ? (U extends string ? string : string)  // 任一参数为 string 时返回 string
    : (U extends number ? number : string); // 同为 number 时返回 number

// 泛型函数实现
function add<T extends string | number, U extends string | number>(
  a: T,
  b: U
): AddResult<T, U> {
  return (a as any) + (b as any); // 实际实现需要类型断言
}

// 使用示例
const result1 = add("a", "b");    // 类型为 string
const result2 = add(1, 2);        // 类型为 number
const result3 = add("a", 1);      // 类型为 string