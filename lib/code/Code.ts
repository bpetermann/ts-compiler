import { OpCode, Definition } from '../../types';
import Instruction from './Instruction';

export default class Code {
  private constructor() {
    throw new Error('This class is non-instantiable.');
  }

  private static definitions: Record<OpCode, Definition> = {
    [OpCode.OpConstant]: { name: 'OpConstant', operandWidths: [2] },
    [OpCode.OpAdd]: { name: 'OpAdd', operandWidths: [] },
    [OpCode.OpPop]: { name: 'OpPop', operandWidths: [] },
    [OpCode.OpSub]: { name: 'OpSub', operandWidths: [] },
    [OpCode.OpMul]: { name: 'OpMul', operandWidths: [] },
    [OpCode.OpDiv]: { name: 'OpDiv', operandWidths: [] },
    [OpCode.OpTrue]: { name: 'OpTrue', operandWidths: [] },
    [OpCode.OpFalse]: { name: 'OpFalse', operandWidths: [] },
    [OpCode.OpEqual]: { name: 'OpEqual', operandWidths: [] },
    [OpCode.OpNotEqual]: { name: 'OpNotEqual', operandWidths: [] },
    [OpCode.OpGreaterThan]: { name: 'OpGreaterThan', operandWidths: [] },
    [OpCode.OpMinus]: { name: 'OpMinus', operandWidths: [] },
    [OpCode.OpBang]: { name: 'OpBang', operandWidths: [] },
    [OpCode.OpJumpNotTruthy]: { name: 'OpJumpNotTruthy', operandWidths: [2] },
    [OpCode.OpJump]: { name: 'OpJump', operandWidths: [2] },
    [OpCode.OpNull]: { name: 'OpNull', operandWidths: [] },
    [OpCode.OpGetGlobal]: { name: 'OpGetGlobal', operandWidths: [2] },
    [OpCode.OpSetGlobal]: { name: 'OpSetGlobal', operandWidths: [2] },
    [OpCode.OPArray]: { name: 'OPArray', operandWidths: [2] },
  };

  static lookUp(op: number): undefined | Definition {
    return !(op in OpCode) ? undefined : Code.definitions[op as OpCode];
  }

  static make(op: number, operands: number[] = []): Instruction {
    if (!(op in OpCode)) {
      return new Instruction(0);
    }

    const { operandWidths } = Code.definitions[op as OpCode];

    const instructionLen =
      1 + operandWidths.reduce((prev, cur) => prev + cur, 0);
    const instruction = new Instruction(instructionLen);

    instruction.setUint8(0, op);

    let offset = 1;

    for (let i = 0; i < operands.length; i++) {
      const width = operandWidths[i];

      switch (width) {
        case 2:
          instruction.setUint16(offset, operands[i]);
          break;
      }

      offset += width;
    }

    return instruction;
  }

  static readOperands(
    def: Definition,
    ins: Instruction
  ): { operands: number[]; offset: number } {
    const operands: number[] = new Array(def.operandWidths.length);
    let offset = 0;

    for (let i = 0; i < def.operandWidths.length; i++) {
      const width = def.operandWidths[i];

      switch (width) {
        case 2:
          operands[i] = ins.getUint16(offset);
      }

      offset += width;
    }

    return { operands, offset };
  }
}
