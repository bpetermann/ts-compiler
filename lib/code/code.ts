import { OpCode, Definition } from '../../types';

const definitions: Record<OpCode, Definition> = {
  [OpCode.OpConstant]: { name: 'OpConstant', operandWidths: [2] },
};

const numberToByte = (num: number): Buffer => {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(num, 0);
  return buffer;
};

const numberToTwoBytes = (num: number): Buffer => {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(num, 0);
  return buffer;
};

export const make = (op: number, operands: number[]): ArrayBuffer => {
  if (!(op in OpCode)) {
    return new ArrayBuffer(0);
  }

  const { operandWidths } = definitions[op as OpCode];

  const instructionLen = 1 + operandWidths.reduce((a, b) => a + b, 0);
  const instruction = new ArrayBuffer(instructionLen);
  instruction[0] = numberToByte(op);
  const dataView = new DataView(instruction);

  dataView.setUint8(0, op);

  let offset = 1;

  for (let i = 0; i < operands.length; i++) {
    const width = operandWidths[i];

    switch (width) {
      case 2:
        dataView.setUint16(offset, operands[i], false);
        break;
    }

    offset += width;
  }

  return instruction;
};
