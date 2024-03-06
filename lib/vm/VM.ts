import { Object, ByteCode, OpCode, ObjectType } from '../../types';
import { Instruction } from '../code';
import * as obj from '../object';
import { Code } from '../code';
import Frame from './Frame';

const GLOBALS_SIZE = 65536;
const STACK_SIZE = 2048;
const MAX_FRAMES = 1024;

const TRUE = new obj.Boolean(true);
const FALSE = new obj.Boolean(false);
const NULL = new obj.Null();
const HASHKEY = new obj.HashKey();

export default class VM {
  constants: Object[];
  private stackSize: number;
  globalSize: number;
  private stack: Object[];
  private stackPointer: number;
  private globals: Object[];
  private frames: Frame[];
  private framesIndex: number;

  constructor(
    byteCode: ByteCode = { instruction: new Instruction(0), constants: [] }
  ) {
    const { instruction, constants } = byteCode;

    this.constants = constants;
    this.stackSize = STACK_SIZE;
    this.globalSize = GLOBALS_SIZE;
    this.stack = [];
    this.stackPointer = 0;
    this.globals = new Array(GLOBALS_SIZE);
    this.frames = new Array(MAX_FRAMES);
    this.frames[0] = new Frame(new obj.CompiledFunction(instruction));
    this.framesIndex = 1;
  }

  public newWithGlobalStore(bytecode: ByteCode, s: Object[]): VM {
    const vm = new VM(bytecode);
    vm.globals = s;
    return vm;
  }

  run() {
    let ip: number;
    let ins: Instruction;
    let op: OpCode;

    while (
      this.currentFrame().ip <
      this.currentFrame().instruction.length() - 1
    ) {
      this.currentFrame().ip++;

      ip = this.currentFrame().ip;
      ins = this.currentFrame().instruction;
      op = ins.getUint8(ip) as OpCode;

      switch (op) {
        case OpCode.OpConstant:
          const constIndex = ins.getUint16(ip + 1);
          this.currentFrame().ip += 2;
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
            const pos = ins.getUint16(ip + 1);
            this.currentFrame().ip = pos - 1;
          }
          break;
        case OpCode.OpJumpNotTruthy:
          const pos = ins.getUint16(ip + 1);
          this.currentFrame().ip += 2;
          const condition = this.pop();
          if (!this.isTruthy(condition)) {
            this.currentFrame().ip = pos - 1;
          }
          break;
        case OpCode.OpSetGlobal:
          const globalIndex = ins.getUint16(ip + 1);
          this.currentFrame().ip += 2;
          this.globals[globalIndex] = this.pop();
          break;
        case OpCode.OpGetGlobal:
          const index = ins.getUint16(ip + 1);
          this.currentFrame().ip += 2;
          this.push(this.globals[index]);
          break;
        case OpCode.OpNull:
          this.push(NULL);
          break;
        case OpCode.OpArray:
          const numElements = ins.getUint16(ip + 1);
          this.currentFrame().ip += 2;

          const array = this.buildArray(
            this.stackPointer - numElements,
            this.stackPointer
          );
          this.push(array);
          break;
        case OpCode.OpHash:
          const elements = ins.getUint16(ip + 1);
          this.currentFrame().ip += 2;

          const hash = this.buildHash(
            this.stackPointer - elements,
            this.stackPointer
          );
          this.stackPointer = this.stackPointer - elements;

          this.push(hash);
          break;
        case OpCode.OpIndex:
          {
            const index = this.pop();
            const left = this.pop();
            this.executeIndexExpression(left, index);
          }
          break;
        case OpCode.OpPop:
          this.pop();
          break;
      }
    }
  }
  executeIndexExpression(left: Object, index: Object) {
    switch (true) {
      case left.type() === ObjectType.ARRAY_OBJ &&
        index.type() === ObjectType.INTEGER_OBJ:
        this.executeArrayIndex(left, index);
        break;
      case left.type() === ObjectType.HASH_OBJ:
        this.executeHashIndex(left, index);
        break;
      default:
        throw new Error(`index operator not supported ${left.type()}`);
    }
  }
  executeHashIndex(left: Object, index: Object) {
    const hashObject = left as obj.Hash;

    if (!HASHKEY.hashable(index))
      throw new Error(`unusable as hash key: ${index.type()}`);

    const pair = hashObject.pairs.get(HASHKEY.hash(index));

    !pair ? this.push(NULL) : this.push(pair.value);
  }

  executeArrayIndex(left: Object, index: Object) {
    const arrayObject = left as obj.Array;
    const i = (index as obj.Integer).value;
    const max = arrayObject.elements.length - 1;

    i < 0 || i > max ? this.push(NULL) : this.push(arrayObject.elements[i]);
  }

  buildHash(startIndex: number, endIndex: number): obj.Hash {
    const pairs = new Map();

    for (let i = startIndex; i < endIndex; i += 2) {
      const key = this.stack[i];
      const value = this.stack[i + 1];

      if (!HASHKEY.hashable(key))
        throw new Error(`unusable as hash key: ${key}`);

      const hash = HASHKEY.hash(key);
      const pair = new obj.HashPair(key, value);
      pairs.set(hash, pair);
    }

    return new obj.Hash(pairs);
  }

  buildArray(startIndex: number, endIndex: number): Object {
    const elements: Object[] = new Array(endIndex - startIndex);

    for (let i = startIndex; i < endIndex; i++) {
      elements[i - startIndex] = this.stack[i];
    }
    return new obj.Array(elements);
  }

  lastPoppedStackElem(): Object {
    return this.stack[this.stackPointer];
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

  executeBinaryStringOperation(
    op: OpCode,
    left: obj.String,
    right: obj.String
  ): void {
    if (op !== OpCode.OpAdd) throw new Error(`unknown string operator ${op}`);

    this.push(new obj.String(left.value + right.value));
  }

  private executeBinaryOperation(op: OpCode): void {
    const right = this.pop();
    const left = this.pop();

    const leftType = left.type();
    const rightType = right.type();

    switch (true) {
      case this.isObjectTypeInteger(left.type()) &&
        this.isObjectTypeInteger(right.type()):
        this.executeBinaryIntegerOperation(
          op,
          left as obj.Integer,
          right as obj.Integer
        );
        break;
      case leftType === ObjectType.STRING_OBJ &&
        rightType === ObjectType.STRING_OBJ:
        this.executeBinaryStringOperation(
          op,
          left as obj.String,
          right as obj.String
        );
        break;
      default:
        throw new Error(
          `unsupported types for binary operation: ${left.type()} ${right.type()}`
        );
    }
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

  private currentFrame(): Frame {
    return this.frames[this.framesIndex - 1];
  }

  private pushFrame(f: Frame) {
    this.frames[this.framesIndex] = f;
    this.framesIndex++;
  }

  private popFrame(): Frame {
    this.framesIndex--;
    return this.frames[this.framesIndex];
  }
}
