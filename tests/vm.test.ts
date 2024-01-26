import Compiler from '../lib/compiler/Compiler';
import { Object, ObjectType } from '../types';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';
import VM from '../lib/vm/VM';

const getStackElement = (expression: string) => {
  const bytecode = compileExpression(expression);

  const vm = new VM(bytecode);
  const stackElem = vm.stackTop();

  return stackElem;
};

const compileExpression = (expression: string) => {
  const compiler = new Compiler();
  compiler.compile(helper.parse(expression));
  return compiler.byteCode();
};

const testExpectedObject = (expected: Object, actual: Object): boolean => {
  switch (expected.type()) {
    case ObjectType.INTEGER_OBJ:
      return helper.testIntegerObject(expected, actual);
  }
  return false;
};

it('should compile two numbers', () => {
  const tests: [string, number][] = [
    ['1', 1],
    ['2', 2],
  ];

  tests.forEach((test) => {
    const stackElement = getStackElement(test[0]);
    const result = testExpectedObject(new obj.Integer(test[1]), stackElement);
    expect(result).toEqual(true);
  });
});
