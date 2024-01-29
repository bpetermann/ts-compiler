import { Object, ByteCode, OpCode } from '../../types';
import { Instruction } from 'lib/code';
import { Integer } from '../object';
import * as obj from '../object';

export default class VM {
  instruction: Instruction;
  constants: Object[];
  private stackSize: number;
  private stack: Object[];
  private stackPointer: number;

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
        case OpCode.OpAdd:
          const right = this.pop();
          const left = this.pop();
          const rightvalue = (right as obj.Integer).value;
          const leftValue = (left as obj.Integer).value;

          const result = leftValue + rightvalue;
          this.push(new obj.Integer(result));
          break;
        case OpCode.OpPop:
          this.pop();
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

  pop(): Object {
    const obj = this.stack[this.stackPointer - 1];
    this.stackPointer--;
    return obj;
  }

  lastPoppedStackElem(): Object {
    return this.stack[this.stackPointer];
  }
}
