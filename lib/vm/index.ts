import { Object, ByteCode, OpCode, ObjectType } from '../../types';
import { Instruction } from 'lib/code';
import * as obj from '../object';

const TRUE = new obj.Boolean(true);
const FALSE = new obj.Boolean(false);
const NULL = new obj.Null();
const GlobalsSize = 65536;

export default class VM {
  instruction: Instruction;
  constants: Object[];
  private stackSize: number;
  private stack: Object[];
  private stackPointer: number;
  private globals: Object[];

  constructor(byteCode: ByteCode) {
    const { instruction, constants } = byteCode;
    this.constants = constants;
    this.instruction = instruction;
    this.stackSize = 2048;
    this.stack = [];
    this.stackPointer = 0;
    this.globals = new Array(GlobalsSize);
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
        case OpCode.OpEqual:
        case OpCode.OpNotEqual:
        case OpCode.OpGreaterThan:
          this.executeComparison(op);
          break;
        case OpCode.OpBang:
          this.executeBangOperator();
          break;
        case OpCode.OpMinus:
          this.executeMinusOperator();
          break;
        case OpCode.OpJump:
          {
            const pos = this.instruction.getUint16(ip + 1);
            ip = pos - 1;
          }
          break;
        case OpCode.OpJumpNotTruthy:
          const pos = this.instruction.getUint16(ip + 1);
          ip += 2;
          const condition = this.pop();
          if (!this.isTruthy(condition)) {
            ip = pos - 1;
          }
          break;
        case OpCode.OpSetGlobal:
          const globalIndex = this.instruction.getUint16(ip + 1);
          ip += 2;
          this.globals[globalIndex] = this.pop();
          break;
        case OpCode.OpGetGlobal:
          const index = this.instruction.getUint16(ip + 1);
          ip += 2;
          this.push(this.globals[index]);
          break;
        case OpCode.OpNull:
          this.push(NULL);
          break;
        case OpCode.OpPop:
          this.pop();
          break;
      }
    }
  }

  lastPoppedStackElem(): Object {
    return this.stack[this.stackPointer];
  }

  private stackTop(): Object {
    return !this.stackPointer ? null : this.stack[this.stackPointer - 1];
  }

  private isObjectTypeInteger(
    type: ObjectType
  ): type is ObjectType.INTEGER_OBJ {
    return type === ObjectType.INTEGER_OBJ;
  }

  private booleanToBooleanObject(input: boolean): obj.Boolean {
    return input ? TRUE : FALSE;
  }

  private push(obj: Object): void {
    if (this.stackPointer > this.stackSize) {
      throw new Error('stack overflow');
    }
    this.stack[this.stackPointer] = obj;
    this.stackPointer++;
  }

  private pop(): Object {
    const obj = this.stack[this.stackPointer - 1];
    this.stackPointer--;
    return obj;
  }

  private executeBangOperator() {
    const operand = this.pop();

    switch (operand) {
      case TRUE:
        this.push(FALSE);
        break;
      case FALSE:
        this.push(TRUE);
        break;
      case NULL:
        this.push(TRUE);
        break;
      default:
        this.push(FALSE);
        break;
    }
  }

  private executeMinusOperator() {
    const operand = this.pop();

    if (!this.isObjectTypeInteger(operand.type())) {
      throw new Error(`unsupported type for negation: ${operand.type()}`);
    }
    const value = (operand as obj.Integer).value;
    this.push(new obj.Integer(-value));
  }

  private executeBinaryIntegerOperation(
    op: OpCode,
    left: obj.Integer,
    right: obj.Integer
  ): void {
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

  private executeBinaryOperation(op: OpCode): void {
    const right = this.pop();
    const left = this.pop();

    if (
      !this.isObjectTypeInteger(left.type()) ||
      !this.isObjectTypeInteger(right.type())
    ) {
      throw new Error(
        `unsupported types for binary operation: ${left.type()} ${right.type()}`
      );
    }

    this.executeBinaryIntegerOperation(
      op,
      left as obj.Integer,
      right as obj.Integer
    );
  }

  private executeIntegerComparison(
    op: OpCode,
    left: obj.Integer,
    right: obj.Integer
  ): void {
    const rightValue = right.value;
    const leftValue = left.value;

    switch (op) {
      case OpCode.OpEqual:
        this.push(this.booleanToBooleanObject(rightValue === leftValue));
        break;
      case OpCode.OpNotEqual:
        this.push(this.booleanToBooleanObject(rightValue !== leftValue));
        break;
      case OpCode.OpGreaterThan:
        this.push(this.booleanToBooleanObject(leftValue > rightValue));
        break;
      default:
        throw new Error(`unknown integer operator: ${op}`);
    }
  }

  private executeComparison(op: OpCode): void {
    const right = this.pop();
    const left = this.pop();

    if (
      this.isObjectTypeInteger(left.type()) &&
      this.isObjectTypeInteger(right.type())
    ) {
      this.executeIntegerComparison(
        op,
        left as obj.Integer,
        right as obj.Integer
      );
      return;
    }

    switch (op) {
      case OpCode.OpEqual:
        this.push(this.booleanToBooleanObject(right === left));
        break;
      case OpCode.OpNotEqual:
        this.push(this.booleanToBooleanObject(right !== left));
        break;
      default:
        throw new Error(`unknown operator: ${op}`);
    }
  }

  isTruthy(obj: Object): boolean {
    switch (obj.type()) {
      case ObjectType.BOOLEAN_OBJ:
        return (obj as obj.Boolean).value;
      case ObjectType.NULL_OBJ:
        return false;
      default:
        return true;
    }
  }
}
