import { Object, ObjectType } from '../types';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';
import VM from '../lib/vm/VM';

const getStackTop = (expression: string) => {
  const bytecode = helper.compileExpression(expression);

  const vm = new VM(bytecode);
  vm.run();
  const stackElem = vm.stackTop();

  return stackElem;
};

const testExpectedObject = (expected: Object, actual: Object): boolean => {
  switch (expected.type()) {
    case ObjectType.INTEGER_OBJ:
      return helper.testIntegerObject(expected, actual);
  }
  return false;
};

it('should return integer stack elements', () => {
  const tests: [string, number][] = [
    ['1', 1],
    ['2', 2],
  ];

  tests.forEach((test) => {
    const stackElement = getStackTop(test[0]);
    const result = testExpectedObject(new obj.Integer(test[1]), stackElement);
    expect(result).toEqual(true);
  });
});
