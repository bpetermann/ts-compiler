import Compiler from '../lib/compiler';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';
import { Code } from '../lib/code';
import { OpCode } from '../types';

const compileExpression = (expression: string) => {
  const compiler = new Compiler();
  compiler.compile(helper.parse(expression));
  return compiler.byteCode();
};

it('should compile adding two numbers', () => {
  const expectedInstruction = [
    Code.make(OpCode.OpConstant, [0]),
    Code.make(OpCode.OpConstant, [1]),
    Code.make(OpCode.OpAdd),
    Code.make(OpCode.OpPop),
  ];
  const expectedConstants = [new obj.Integer(1), new obj.Integer(2)];
  const inputExpression = '1 + 2';

  const { constants, instruction } = compileExpression(inputExpression);

  expect(helper.testConstants(expectedConstants, constants)).toEqual(true);
  expect(helper.testInstructions(expectedInstruction, instruction)).toEqual(
    true
  );
});

it('should compile subtracting two numbers', () => {
  const expectedInstruction = [
    Code.make(OpCode.OpConstant, [0]),
    Code.make(OpCode.OpConstant, [1]),
    Code.make(OpCode.OpSub),
    Code.make(OpCode.OpPop),
  ];
  const expectedConstants = [new obj.Integer(1), new obj.Integer(2)];
  const inputExpression = '1 - 2';

  const { constants, instruction } = compileExpression(inputExpression);

  expect(helper.testConstants(expectedConstants, constants)).toEqual(true);
  expect(helper.testInstructions(expectedInstruction, instruction)).toEqual(
    true
  );
});

it('should compile multiplying two numbers', () => {
  const expectedInstruction = [
    Code.make(OpCode.OpConstant, [0]),
    Code.make(OpCode.OpConstant, [1]),
    Code.make(OpCode.OpMul),
    Code.make(OpCode.OpPop),
  ];
  const expectedConstants = [new obj.Integer(1), new obj.Integer(2)];
  const inputExpression = '1 * 2';

  const { constants, instruction } = compileExpression(inputExpression);

  expect(helper.testConstants(expectedConstants, constants)).toEqual(true);
  expect(helper.testInstructions(expectedInstruction, instruction)).toEqual(
    true
  );
});

it('should compile dividing two numbers', () => {
  const expectedInstruction = [
    Code.make(OpCode.OpConstant, [0]),
    Code.make(OpCode.OpConstant, [1]),
    Code.make(OpCode.OpDiv),
    Code.make(OpCode.OpPop),
  ];
  const expectedConstants = [new obj.Integer(2), new obj.Integer(1)];
  const inputExpression = '2 / 1';

  const { constants, instruction } = compileExpression(inputExpression);

  expect(helper.testConstants(expectedConstants, constants)).toEqual(true);
  expect(helper.testInstructions(expectedInstruction, instruction)).toEqual(
    true
  );
});
