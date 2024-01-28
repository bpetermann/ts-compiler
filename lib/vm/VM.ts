import { Object, ByteCode, OpCode } from '../../types';
import { Instruction } from 'lib/code';
import { Integer } from '../object';

export default class VM {
  instruction: Instruction;
  constants: Object[];
  stackSize: number;
  stack: Object[];
  stackPointer: number;

  constructor(byteCode: ByteCode) {
    const { instruction, constants } = byteCode;
    this.constants = constants;
    this.instruction = instruction;
    this.stackSize = 2048;
    this.stack = [];
    this.stackPointer = 0;
  }

  stackTop(): Object {
    return !this.stackPointer ? null : this.stack[this.stackPointer - 1];
  }

  run() {
    for (let ip = 0; ip < this.instruction.length(); ip++) {
      const op = this.instruction.getUint8(ip) as OpCode;
      switch (op) {
        case OpCode.OpConstant:
          const constIndex = this.instruction.getUint16(ip + 1);
          ip += 2;
          this.push(this.constants[constIndex]);
          break;
      }
    }
  }

  push(obj: Object): void {
    if (this.stackPointer > this.stackSize) {
      throw new Error('stack overflow');
    }
    this.stack[this.stackPointer] = obj;
    this.stackPointer++;
  }
}
