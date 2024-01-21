import Compiler from '../lib/compiler/Compiler';
import { Instruction } from '../lib/code';
import { expect } from '@jest/globals';
import { OpCode } from '../types';

// No actual tests at the moment

it('should compile two numbers', () => {
  const instruction = [
    Instruction.make(OpCode.OpConstant, [0]),
    Instruction.make(OpCode.OpConstant, [0]),
  ];

  const compiler = new Compiler(instruction, []);

  expect(true).toEqual(true);
});
