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

it('should make a instruction of one byte operands', () => {
  const operands = [255];
  const ins = Code.make(OpCode.OpGetLocal, operands);

  const dataView = new Uint8Array(ins.getArrayBuffer());

  const expected = [OpCode.OpGetLocal, 255];
  expect([...dataView]).toEqual(expected);
});

it('should decode ony byte operands', () => {
  const instruction = [
    Code.make(OpCode.OpAdd, []),
    Code.make(OpCode.OpGetLocal, [1]),
    Code.make(OpCode.OpConstant, [2]),
    Code.make(OpCode.OpConstant, [65535]),
  ];

  const expected = `
  0 OpAdd
  1 OpGetLocal 1
  3 OpConstant 2 
  6 OpConstant 65535
  `;

  const concatted = concatInstructions(instruction);

  expect(expect.stringMatching(cleanString(concatted.string()))).toEqual(
    expected
  );
});

it('should decode one byte operands', () => {
  const operands = [255];
  const bytesRead = 1;

  const def = Code.lookUp(OpCode.OpGetLocal);
  const ins = Code.make(OpCode.OpGetLocal, operands);

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

it('should work with an operand width size of two', () => {
  const instruction = [
    Code.make(OpCode.OpAdd, []),
    Code.make(OpCode.OpGetLocal, [1]),
    Code.make(OpCode.OpConstant, [2]),
    Code.make(OpCode.OpConstant, [65535]),
    Code.make(OpCode.OpClosure, [65535, 255]),
  ];

  const expected = `
  0 OpAdd
  1 OpGetLocal 1
  3 OpConstant 2 
  6 OpConstant 65535
  9 OpClosure 65535 255
  `;

  const concatted = concatInstructions(instruction);

  expect(expect.stringMatching(cleanString(concatted.string()))).toEqual(
    expected
  );
});

it('should decode the operands of a closure instruction', () => {
  const operands = [65534, 255];
  const bytesRead = 3;

  const def = Code.lookUp(OpCode.OpClosure);
  const ins = Code.make(OpCode.OpClosure, operands);

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
