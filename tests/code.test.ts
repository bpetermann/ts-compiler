import { cleanString, concatInstructions } from './helper';
import { expect } from '@jest/globals';
import { Code } from '../lib/code';
import { OpCode } from '../types';

it('should generate bytecode for a single operand', () => {
  const operand = 65534;
  const instruction = Code.make(OpCode.OpConstant, [operand]);

  const dataView = new Uint8Array(instruction.getArrayBuffer());

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

it('should print instruction in string format', () => {
  const instruction = [
    Code.make(OpCode.OpAdd, []),
    Code.make(OpCode.OpConstant, [2]),
    Code.make(OpCode.OpConstant, [65535]),
  ];

  const expected = `
  0 OpAdd
  1 OpConstant 2 
  4 OpConstant 65535
  `;

  const concatted = concatInstructions(instruction);
  console.log(concatted.string());
  expect(expect.stringMatching(cleanString(concatted.string()))).toEqual(
    expected
  );
});

it('should make a instruction of op add', () => {
  const operands = [];
  const ins = Code.make(OpCode.OpAdd, operands);

  const def = Code.lookUp(OpCode.OpAdd);

  if (!def) {
    throw new Error('OpCode not found');
  }

  const { operands: operandsRead } = Code.readOperands(def, ins.slice(1));

  expect(operandsRead).toEqual(operands);
});
