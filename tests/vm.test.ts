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
    default:
      return false;
  }
};

it('should apply int arithmetic', () => {
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

it('should apply advanced int arithmetic', () => {
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

it('should apply boolean expressions', () => {
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

it('should apply if expressions', () => {
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

it('should apply if expressions without else', () => {
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

it('should apply global let statements', () => {
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

it('should apply string expressions', () => {
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

it('should apply array literals', () => {
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

it('should apply hash literals', () => {
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

it('should apply index expressions', () => {
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
