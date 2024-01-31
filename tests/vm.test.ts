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
  ];

  tests.forEach((test) => {
    const [actual, expected] = test;

    const stackElement = getStackTop(actual);
    const result = testExpectedObject(new obj.Boolean(expected), stackElement);

    expect(result).toEqual(true);
  });
});
