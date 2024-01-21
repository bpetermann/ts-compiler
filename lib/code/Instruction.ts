import { OpCode, Definition, Instructions } from '../../types';

export default class Instruction {
  private constructor() {
    throw new Error('This class is non-instantiable.');
  }

  private static definitions: Record<OpCode, Definition> = {
    [OpCode.OpConstant]: { name: 'OpConstant', operandWidths: [2] },
  };

  static lookUp(op: number): null | Definition {
    if (!(op in OpCode)) {
      return null;
    }

    return Instruction.definitions[op as OpCode];
  }

  string() {
    return '';
  }

  static make(op: number, operands: number[]): Instructions {
    if (!(op in OpCode)) {
      return new ArrayBuffer(0);
    }

    const { operandWidths } = Instruction.definitions[op as OpCode];

    const instructionLen =
      1 + operandWidths.reduce((prev, cur) => prev + cur, 0);
    const instruction = new ArrayBuffer(instructionLen);
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
  }

  static readOperands(
    def: Definition,
    ins: Instructions
  ): { operands: number[]; offset: number } {
    let dataView = new DataView(ins);
    const operands: number[] = new Array(def.operandWidths.length);
    let offset = 0;

    for (let i = 0; i < def.operandWidths.length; i++) {
      const width = def.operandWidths[i];

      switch (width) {
        case 2:
          operands[i] = dataView.getUint16(offset, false);
      }

      offset += width;
    }

    return { operands, offset };
  }
}
