import { expect } from '@jest/globals';
import { make } from '../lib/code';
import { OpCode } from '../types';

it('should generate bytecode for a single operand', () => {
  const opCode = OpCode.OpConstant;
  const operand = 65534;
  const actual = make(opCode, [operand]);

  const dataView = new DataView(actual);

  const expected = [opCode, 255, 254];
  expect([
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
  ]).toEqual(expected);
});
