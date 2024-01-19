import { expect } from '@jest/globals';
import { Code } from '../lib/code';
import { OpCode } from '../types';

it('should generate bytecode for a single operand', () => {
  const operand = 65534;
  const instruction = Code.make(OpCode.OpConstant, [operand]);

  const dataView = new Uint8Array(instruction);

  const expected = [OpCode.OpConstant, 255, 254];
  expect([...dataView]).toEqual(expected);
});
