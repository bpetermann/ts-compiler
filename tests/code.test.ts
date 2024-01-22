import { Code } from '../lib/code';
import { expect } from '@jest/globals';
import { OpCode } from '../types';

it('should generate bytecode for a single operand', () => {
  const operand = 65534;
  const instruction = Code.make(OpCode.OpConstant, [operand]);

  const dataView = new Uint8Array(instruction.getBuffer());

  const expected = [OpCode.OpConstant, 255, 254];
  expect([...dataView]).toEqual(expected);
});

it('should decode the operands of a bytecode instruction', () => {
  const operands = [65534];
  const bytesRead = 2;

  const def = Code.lookUp(OpCode.OpConstant);
  const ins = Code.make(OpCode.OpConstant, operands);

  if (!def) {
    throw new Error('OpCode not found');
  }

  const { operands: operandsRead, offset } = Code.readOperands(
    def,
    ins.slice(1)
  );

  expect(offset).toEqual(bytesRead);

  for (let i = 0; i < operands.length; i++) {
    expect(operandsRead[i]).toEqual(operands[i]);
  }
});
