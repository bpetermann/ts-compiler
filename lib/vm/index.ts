import { Object, ByteCode, OpCode, ObjectType } from '../../types';
import { Instruction } from 'lib/code';
import * as obj from '../object';

const TRUE = new obj.Boolean(true);
const FALSE = new obj.Boolean(false);

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
        case OpCode.OpSub:
        case OpCode.OpMul:
        case OpCode.OpDiv:
          this.executeBinaryOperation(op);
          break;
        case OpCode.OpTrue:
          this.push(TRUE);
          break;
        case OpCode.OpFalse:
          this.push(FALSE);
          break;
        case OpCode.OpPop:
          this.pop();
          break;
      }
    }
  }

  executeBinaryIntegerOperation(
    op: OpCode,
    left: obj.Integer,
    right: obj.Integer
  ) {
    const leftValue = left.value;
    const rightValue = right.value;

    let result: number;

    switch (op) {
      case OpCode.OpAdd:
        result = leftValue + rightValue;
        break;
      case OpCode.OpSub:
        result = leftValue - rightValue;
        break;
      case OpCode.OpMul:
        result = leftValue * rightValue;
        break;
      case OpCode.OpDiv:
        result = leftValue / rightValue;
        break;
      default:
        throw new Error(`unknown integer operator: ${op}`);
    }

    this.push(new obj.Integer(result));
  }

  executeBinaryOperation(op: OpCode) {
    const right = this.pop();
    const left = this.pop();

    const leftType = left.type();
    const rightType = right.type();

    if (
      leftType !== ObjectType.INTEGER_OBJ &&
      rightType !== ObjectType.INTEGER_OBJ
    ) {
      throw new Error(
        `unsupported types for binary operation: ${leftType} ${rightType}`
      );
    }

    this.executeBinaryIntegerOperation(
      op,
      left as obj.Integer,
      right as obj.Integer
    );
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
