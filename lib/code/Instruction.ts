import { Definition } from 'types';
import Code from './Code';
export default class Instruction {
  private dataView: DataView;

  constructor(length: number) {
    this.dataView = new DataView(new ArrayBuffer(length));
  }

  setUint8(byteOffset: number, value: number): void {
    this.dataView.setUint8(byteOffset, value);
  }

  setUint16(byteOffset: number, value: number): void {
    this.dataView.setUint16(byteOffset, value);
  }

  getArrayBuffer(): ArrayBuffer {
    return this.dataView.buffer;
  }

  getUint8Array(): number[] {
    return [...new Uint8Array(this.dataView.buffer)];
  }

  length(): number {
    return [...new Uint8Array(this.dataView.buffer)].length;
  }

  getInstruction(): Instruction {
    return this;
  }

  getUint8(byteOffset: number): number {
    if (byteOffset < 0 || byteOffset + 2 > this.dataView.byteLength) {
      throw new Error('Invalid byteOffset');
    }
    return this.dataView.getUint8(byteOffset);
  }

  getUint16(byteOffset: number): number {
    if (byteOffset < 0 || byteOffset + 2 > this.dataView.byteLength) {
      throw new Error('Invalid byteOffset');
    }
    return this.dataView.getUint16(byteOffset, false);
  }

  slice(value: number): Instruction {
    if (value < 0 || value > this.dataView.byteLength) {
      throw new Error('Invalid slice value');
    }

    const slicedInstruction = new Instruction(this.dataView.byteLength - value);

    const originalValues = new Uint8Array(this.dataView.buffer, value);
    const slicedValues = new Uint8Array(slicedInstruction.dataView.buffer);
    slicedValues.set(originalValues);

    return slicedInstruction;
  }

  static concatAll(instructions: Instruction[]): Instruction {
    const totalLength = instructions.reduce(
      (length, instr) => length + instr.dataView.byteLength,
      0
    );

    const combinedInstruction = new Instruction(totalLength);

    const combinedDataView = new Uint8Array(
      combinedInstruction.dataView.buffer
    );
    let offset = 0;

    instructions.forEach((instr) => {
      const instrValues = new Uint8Array(instr.dataView.buffer);
      combinedDataView.set(instrValues, offset);
      offset += instr.dataView.byteLength;
    });

    return combinedInstruction;
  }

  private fmtInstruction(def: Definition, operands: number[]): string {
    const operandCount = def.operandWidths.length;

    if (operands.length !== operandCount) {
      throw new Error(
        `ERROR: operand len ${operands.length} does not match defined ${operandCount}`
      );
    }

    switch (operandCount) {
      case 0:
        return `${def.name}`;
      case 1:
        return `${def.name} ${operands[0]}`;

      default:
        throw new Error(
          `ERROR: operand len ${operands.length} does not match defined ${operandCount}`
        );
    }
  }

  string(): string {
    let out = '';
    for (let i = 0; i < this.dataView.byteLength; i++) {
      const definition = Code.lookUp(this.getUint8Array()[i]);

      if (!definition) {
        throw new Error('OpCode not found');
      }

      const { operands, offset } = Code.readOperands(
        definition,
        this.slice(i + 1)
      );

      out += `${i} ${this.fmtInstruction(definition, operands)}\n`;

      i += offset;
    }
    return out;
  }
}
