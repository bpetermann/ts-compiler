import { Object, ObjectType } from '../types';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';
import { VM } from '../lib/vm';

const getStackTop = (expression: string) => {
  const bytecode = helper.compileExpression(expression);

  const vm = new VM(bytecode);
  vm.run();
  const stackElem = vm.lastPoppedStackElem();

  return stackElem;
};

const testExpectedObject = (expected: Object, actual: Object): boolean => {
  switch (expected.type()) {
    case ObjectType.INTEGER_OBJ:
      return helper.testIntegerObject(expected, actual);
    case ObjectType.BOOLEAN_OBJ:
      return helper.testBooleanObject(expected, actual);
    case ObjectType.NULL_OBJ:
      return expected.type() === actual.type();
    case ObjectType.STRING_OBJ:
      return helper.testStringObject(expected, actual);
    case ObjectType.ARRAY_OBJ:
      if (actual.type() !== ObjectType.ARRAY_OBJ) return false;
      const expectedArray = (expected as obj.Array).elements;
      const actualArray = (actual as obj.Array).elements;
      return expectedArray.every((el, i) =>
        helper.testIntegerObject(el, actualArray[i])
      );
    case ObjectType.HASH_OBJ:
      if (actual.type() !== ObjectType.HASH_OBJ) return false;
      const expectedHash = (expected as obj.Hash).pairs;
      const actualhash = (actual as obj.Hash).pairs;
      expectedHash.forEach((val, key) => {
        const actualValue = actualhash.get(key);
        if (
          actualValue === undefined ||
          !(actualValue instanceof obj.Integer) ||
          !helper.testIntegerObject(val, actualValue)
        ) {
          return false;
        }
      });
      return true;
    case ObjectType.ERROR_OBJ:
      return (
        actual.type() === ObjectType.ERROR_OBJ &&
        (expected as obj.Error).message === (actual as obj.Error).message
      );
    default:
      return false;
  }
};

it('should handle int arithmetic', () => {
  const tests: [string, number][] = [
    ['1', 1],
    ['2', 2],
    ['1 + 2', 3],
  ];

  tests.forEach((test) => {
    const stackElement = getStackTop(test[0]);
    const result = testExpectedObject(new obj.Integer(test[1]), stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle advanced int arithmetic', () => {
  const tests: [string, number][] = [
    ['1 - 2', -1],
    ['1 * 2', 2],
    ['4 / 2', 2],
    ['50 / 2 * 2 + 10 - 5', 55],
    ['5 + 5 + 5 + 5 - 10', 10],
    ['2 * 2 * 2 * 2 * 2', 32],
    ['5 * 2 + 10', 20],
    ['5 + 2 * 10', 25],
    ['5 * (2 + 10)', 60],
    ['-5', -5],
    ['-10', -10],
    ['-50 + 100 + -50', 0],
    ['(5 + 10 * 2 + 15 / 3) * 2 + -10', 50],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(new obj.Integer(expected), stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle boolean expressions', () => {
  const tests: [string, boolean][] = [
    ['true', true],
    ['false', false],
    ['1 < 2', true],
    ['1 > 2', false],
    ['1 < 1', false],
    ['1 > 1', false],
    ['1 == 1', true],
    ['1 != 1', false],
    ['1 == 2', false],
    ['1 != 2', true],
    ['true == true', true],
    ['false == false', true],
    ['true == false', false],
    ['true != false', true],
    ['false != true', true],
    ['(1 < 2) == true', true],
    ['(1 < 2) == false', false],
    ['(1 > 2) == true', false],
    ['(1 > 2) == false', true],
    ['!true', false],
    ['!false', true],
    ['!5', false],
    ['!!true', true],
    ['!!false', false],
    ['!!5', true],
    ['!(if (false) { 5; })', true],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(new obj.Boolean(expected), stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle if expressions', () => {
  const tests: [string, number][] = [
    ['if (true) { 10 }', 10],
    ['if (true) { 10 } else { 20 }', 10],
    ['if (false) { 10 } else { 20 } ', 20],
    ['if (1) { 10 }', 10],
    ['if (1 < 2) { 10 }', 10],
    ['if (1 < 2) { 10 } else { 20 }', 10],
    ['if ((if (false) { 10 })) { 10 } else { 20 }', 20],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(new obj.Integer(expected), stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle if expressions without else', () => {
  const tests: [string, Object][] = [
    ['if (1 > 2) { 10 }', new obj.Null()],
    ['if (false) { 10 }', new obj.Null()],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle global let statements', () => {
  const tests: [string, number][] = [
    ['let one = 1; one', 1],
    ['let one = 1; let two = 2; one + two', 3],
    ['let one = 1; let two = one + one; one + two', 3],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(new obj.Integer(expected), stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle string expressions', () => {
  const tests: [string, string][] = [
    ['"monkey"', 'monkey'],
    [`"mon" + "key"`, 'monkey'],
    [`"mon" + "key" + "banana"`, 'monkeybanana'],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(new obj.String(expected), stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle array literals', () => {
  const tests: [string, number[]][] = [
    ['[]', []],
    ['[1, 2, 3]', [1, 2, 3]],
    ['[1 + 2, 3 * 4, 5 + 6]', [3, 12, 11]],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const result = testExpectedObject(
      new obj.Array(expected.map((el) => new obj.Integer(el))),
      getStackTop(actual)
    );

    expect(result).toEqual(true);
  });
});

it('should handle hash literals', () => {
  const HASHKEY = new obj.HashKey();

  const tests: [string, any][] = [
    ['{}', new obj.Hash(new Map())],
    [
      '{1: 2, 2: 3}',
      new obj.Hash(
        new Map()
          .set(
            HASHKEY.hash(new obj.Integer(1)),
            new obj.HashPair(new obj.Integer(1), new obj.Integer(2))
          )
          .set(
            HASHKEY.hash(new obj.Integer(2)),
            new obj.HashPair(new obj.Integer(2), new obj.Integer(3))
          )
      ),
    ],
    [
      '{1 + 1: 2 * 2, 3 + 3: 4 * 4}',
      new obj.Hash(
        new Map()
          .set(
            HASHKEY.hash(new obj.Integer(2)),
            new obj.HashPair(new obj.Integer(2), new obj.Integer(4))
          )
          .set(
            HASHKEY.hash(new obj.Integer(6)),
            new obj.HashPair(new obj.Integer(6), new obj.Integer(16))
          )
      ),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle index expressions', () => {
  const tests: [string, Object][] = [
    ['[1, 2, 3][1]', new obj.Integer(2)],
    ['[1, 2, 3][0 + 2]', new obj.Integer(3)],
    ['[[1, 1, 1]][0][0]', new obj.Integer(1)],
    ['[][0]', new obj.Null()],
    ['[1, 2, 3][99]', new obj.Null()],
    ['[1][-1]', new obj.Null()],
    ['{1: 1, 2: 2}[1]', new obj.Integer(1)],
    ['{1: 1, 2: 2}[2]', new obj.Integer(2)],
    ['{1: 1}[0]', new obj.Null()],
    ['{}[0]', new obj.Null()],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle function calls wihtout args', () => {
  const tests: [string, Object][] = [
    ['let fivePlusTen = fn() { 5 + 10; };fivePlusTen();', new obj.Integer(15)],
    [
      'let one = fn() { 1; };let two = fn() { 2; };one() + two()',
      new obj.Integer(3),
    ],
    [
      'let a = fn() { 1 };let b = fn() { a() + 1 };let c = fn() { b() + 1 };c();',
      new obj.Integer(3),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle function calls wihtout return values', () => {
  const tests: [string, Object][] = [
    [' let noReturn = fn() { };noReturn();', new obj.Null()],
    [
      'let noReturn = fn() { };let noReturnTwo = fn() { noReturn(); };noReturn();noReturnTwo();',
      new obj.Null(),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle first class functions', () => {
  const tests: [string, Object][] = [
    [
      'let returnsOne = fn() { 1; };let returnsOneReturner = fn() { returnsOne; };returnsOneReturner()();',
      new obj.Integer(1),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle calling functions with bindings', () => {
  const tests: [string, Object][] = [
    [
      `
      let one = fn() { let one = 1; one };
      one();
      `,
      new obj.Integer(1),
    ],
    [
      `
      let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
      oneAndTwo();
      `,
      new obj.Integer(3),
    ],
    [
      `
        let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
        let threeAndFour = fn() { let three = 3; let four = 4; three + four; };
        oneAndTwo() + threeAndFour();
        `,
      new obj.Integer(10),
    ],
    [
      `
      let firstFoobar = fn() { let foobar = 50; foobar; };
      let secondFoobar = fn() { let foobar = 100; foobar; };
      firstFoobar() + secondFoobar();
      `,
      new obj.Integer(150),
    ],
    [
      `
      let globalSeed = 50;
      let minusOne = fn() {
          let num = 1;
          globalSeed - num;
      }
      let minusTwo = fn() {
          let num = 2;
          globalSeed - num;
      }
      minusOne() + minusTwo()`,
      new obj.Integer(97),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(expected, stackElement);

    expect(result).toEqual(true);
  });
});

it('should handle calling functions with arguments', () => {
  const tests: [string, Object][] = [
    [
      `
      let identity = fn(a) { a; };
      identity(4);
      `,
      new obj.Integer(4),
    ],
    [
      `
        let sum = fn(a, b) { a + b; };
        sum(1, 2);
        `,
      new obj.Integer(3),
    ],
    [
      `
        let sum = fn(a, b) {
            let c = a + b;
            c;
        };
        sum(1, 2);
        `,
      new obj.Integer(3),
    ],
    [
      `
        let sum = fn(a, b) {
            let c = a + b;
            c;
        };
        sum(1, 2) + sum(3, 4);`,
      new obj.Integer(10),
    ],
    [
      `
        let sum = fn(a, b) {
            let c = a + b;
            c;
        };
        let outer = fn() {
            sum(1, 2) + sum(3, 4);
        };
        outer();
        `,
      new obj.Integer(10),
    ],
    [
      `
        let globalNum = 10;

        let sum = fn(a, b) {
            let c = a + b;
            c + globalNum;
        };

        let outer = fn() {
            sum(1, 2) + sum(3, 4) + globalNum;
        };

        outer() + globalNum;
        `,
      new obj.Integer(50),
    ],
  ];
});

it('should throw when function called with wrong args', () => {
  const tests: [string, number, number][] = [
    [`fn() { 1; }(1);`, 0, 1],
    [`fn(a) { a; }();`, 1, 0],
    [`fn(a, b) { a + b; }(1);`, 2, 1],
  ];

  tests.forEach(([fn, want, got]) => {
    expect(() => {
      getStackTop(fn);
    }).toThrow(`wrong number of arguments: want=${want}, got=${got}`);
  });
});

it('should handle builtin functions', () => {
  const tests: [string, Object][] = [
    [`len("")`, new obj.Integer(0)],
    [`len("four")`, new obj.Integer(4)],
    [`len("hello world")`, new obj.Integer(11)],
    [`len("one", "two")`, new obj.Error({ type: 'args', msg: '2' })],
    [`len([1, 2, 3])`, new obj.Integer(3)],
    [`len([])`, new obj.Integer(0)],
    [`last([1, 2, 3])`, new obj.Integer(3)],
    [`first([1, 2, 3])`, new obj.Integer(1)],
    [`last([1, 2, 3])`, new obj.Integer(3)],
    [
      `last(1)`,
      new obj.Error({ type: 'support', msg: 'last', got: 'INTEGER' }),
    ],
    [`last([])`, new obj.Null()],

    [
      `rest([1, 2, 3])`,
      new obj.Array([new obj.Integer(2), new obj.Integer(3)]),
    ],
    [`rest([])`, new obj.Null()],
    [`push([], 1)`, new obj.Array([new obj.Integer(1)])],
    [
      `push(1, 1)`,
      new obj.Error({
        type: 'support',
        msg: 'push',
        got: 'INTEGER',
      }),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);

    const result = testExpectedObject(expected, stackElement);
    expect(result).toEqual(true);
  });
});

it('should handle closures', () => {
  const tests: [string, Object][] = [
    [
      `
    let newClosure = fn(a) {
        fn() { a; };
    };
    let closure = newClosure(99);
    closure();
    `,
      new obj.Integer(99),
    ],
    [
      `
    let newAdderOuter = fn(a, b) {
        let c = a + b;
        fn(d) {
            let e = d + c;
            fn(f) { e + f; };
        };
    };
    let newAdderInner = newAdderOuter(1, 2)
    let adder = newAdderInner(3);
    adder(8);
    `,
      new obj.Integer(14),
    ],
    [
      `
    let a = 1;
    let newAdderOuter = fn(b) {
        fn(c) {
            fn(d) { a + b + c + d };
        };
    };
    let newAdderInner = newAdderOuter(2)
    let adder = newAdderInner(3);
    adder(8);
    `,
      new obj.Integer(14),
    ],
    [
      `
        let newClosure = fn(a, b) {
            let one = fn() { a; };
            let two = fn() { b; };
            fn() { one() + two(); };
        };
        let closure = newClosure(9, 90);
        closure();
        `,
      new obj.Integer(99),
    ],
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);

    const result = testExpectedObject(expected, stackElement);
    expect(result).toEqual(true);
  });
});
