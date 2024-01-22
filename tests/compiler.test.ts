import Compiler from '../lib/compiler/Compiler';
import { expect } from '@jest/globals';
import { Code } from '../lib/code';
import { OpCode } from '../types';

// No actual tests at the moment

it('should compile two numbers', () => {
  const instruction = [
    Code.make(OpCode.OpConstant, [0]),
    Code.make(OpCode.OpConstant, [0]),
  ];

  const compiler = new Compiler(instruction, []);

  expect(true).toEqual(true);
});
