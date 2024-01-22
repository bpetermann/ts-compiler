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
  const operand = 65534;

  const def = Code.lookUp(OpCode.OpConstant);
  const ins = Code.make(OpCode.OpConstant, [operand]);

  if (def) {
    const { operands } = Code.readOperands(def, ins.slice(1));

    expect(operands[0]).toEqual(operand);
  }
});
