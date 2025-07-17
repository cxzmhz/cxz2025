function getValue<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

type Ronly<T> = {
  readonly [P in keyof T]: T[P];
};

interface ObjT {
  a: string;
  b: number;
}

type ReadonlyObject = Ronly<ObjT>;

interface Obj1 {
  a: number;
  fn(aa: string): string;
}

const obj1: Obj1 = {
  a: 1,
  fn(aa: string) {
    return `${aa}test`;
  },
};

function returnItem<T>(item: T): T {
  return item;
}

returnItem<string>('test');

interface ReturnItemFn<T> {
  (item: T): T;
}

const returnItemFn: ReturnItemFn<string> = item => {
  return item;
};

function test1<T extends object, U extends keyof T>(obj: T, key: U) {
  return obj[key];
}

test1({a: 1, b: '2'}, 'b');

namespace NameTest1 {
  export interface Objtype1 {
    a: string;
    b: number;
  }
  export class ObjType2 {}
}

const objType1: NameTest1.Objtype1 = {a: '1', b: 2};

type PParticial<T extends object> = {
  [P in keyof T]?: T[P];
};

type Opp = PParticial<{a: number; b: string}>;
