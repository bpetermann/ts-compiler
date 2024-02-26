import { Object, ObjectType } from '../types';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';
import VM from '../lib/vm';

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
  }
  return false;
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
