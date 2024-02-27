import {
  Object,
  NodeType,
  OpCode,
  ByteCode,
  TokenType,
  EmmitedInstruction,
} from '../../types';
import { SymbolTable } from './Symbol';
import { Instruction } from '../code';
import * as obj from '../object';
import { Code } from '../code';
import * as ast from '../ast';

export default class Compiler {
  instructions: Instruction[];
  constants: Object[];
  lastInstruction: EmmitedInstruction;
  previousInstruction: EmmitedInstruction;
  symbolTable: SymbolTable;

  constructor() {
    this.instructions = [];
    this.constants = [];
    this.lastInstruction = { opCode: null, position: null };
    this.previousInstruction = { opCode: null, position: null };
    this.symbolTable = new SymbolTable();
  }

  newWithState(s: SymbolTable, constants: Object[]) {
    const compiler = new Compiler();
    compiler.symbolTable = s;
    compiler.constants = constants;
    return compiler;
  }

  compile(program: ast.Program) {
    for (const statement of program.statements) {
      this.compileNode(statement);
    }
  }

  compileNode(node: NodeType) {
    switch (true) {
      case node instanceof ast.ExpressionStatement:
        this.compileNode((node as ast.ExpressionStatement).expression);
        this.emit(OpCode.OpPop);
        break;
      case node instanceof ast.IfExpression:
        const { condition, consequence, alternative } =
          node as ast.IfExpression;
        this.compileNode(condition);

        // Emit an `OpJumpNotTruthy` with a bogus value
        const jumpNotTruthyPos = this.emit(OpCode.OpJumpNotTruthy, [9999]);
        this.compileNode(consequence);
        if (this.lastInstructionIsPop()) this.removeLastPop();

        // Emit an `OpJump` with a bogus value
        const jumpPos = this.emit(OpCode.OpJump, [9999]);

        const afterConsequencePos = this.instructionLength();
        this.changeOperand(jumpNotTruthyPos, afterConsequencePos);

        if (!alternative) {
          this.emit(OpCode.OpNull);
        } else {
          this.compileNode(alternative);
        }

        if (this.lastInstructionIsPop()) this.removeLastPop();
        const afterAlternativePos = this.instructionLength();
        this.changeOperand(jumpPos, afterAlternativePos);
        break;
      case node instanceof ast.BlockStatement:
        (node as ast.BlockStatement).statements.forEach((stmt) =>
          this.compileNode(stmt)
        );
        break;
      case node instanceof ast.PrefixExpression:
        const prefixNode = node as ast.PrefixExpression;
        this.compileNode(prefixNode.right);
        switch (prefixNode.operator) {
          case TokenType.BANG:
            this.emit(OpCode.OpBang);
            break;
          case TokenType.MINUS:
            this.emit(OpCode.OpMinus);
            break;
          default:
            throw new Error(`unknown operator ${prefixNode.operator}`);
        }
        break;
      case node instanceof ast.InfixExpression:
        const {
          left: infixLeft,
          right: infixRight,
          operator,
        } = node as ast.InfixExpression;
        if (operator === TokenType.LT) {
          this.compileNode(infixRight);
          this.compileNode(infixLeft);
          this.emit(OpCode.OpGreaterThan);
          return;
        }
        this.compileNode(infixLeft);
        this.compileNode(infixRight);
        switch (operator) {
          case TokenType.PLUS:
            this.emit(OpCode.OpAdd);
            break;
          case TokenType.MINUS:
            this.emit(OpCode.OpSub);
            break;
          case TokenType.ASTERISK:
            this.emit(OpCode.OpMul);
            break;
          case TokenType.SLASH:
            this.emit(OpCode.OpDiv);
            break;
          case TokenType.GT:
            this.emit(OpCode.OpGreaterThan);
            break;
          case TokenType.EQ:
            this.emit(OpCode.OpEqual);
            break;
          case TokenType.NOT_EQ:
            this.emit(OpCode.OpNotEqual);
            break;
          default:
            throw new Error(`unknown operator ${operator}`);
        }
        break;
      case node instanceof ast.LetStatement:
        this.compileNode((node as ast.LetStatement).value);
        const symbol = this.symbolTable.define(
          (node as ast.LetStatement).name.value
        );
        this.emit(OpCode.OpSetGlobal, [symbol.index]);
        break;
      case node instanceof ast.Identifier:
        const { index } = this.symbolTable.resolve(
          (node as ast.Identifier).value
        );
        if (index < 0)
          throw new Error(
            `undefined variable ${(node as ast.Identifier).value}`
          );
        this.emit(OpCode.OpGetGlobal, [index]);
        break;
      case node instanceof ast.IntegerLiteral:
        const { value } = node as ast.IntegerLiteral;
        const integer = new obj.Integer(value);
        this.emit(OpCode.OpConstant, [this.addConstant(integer)]);
        break;
      case node instanceof ast.StringLiteral:
        const string = new obj.String((node as ast.StringLiteral).value);
        this.emit(OpCode.OpConstant, [this.addConstant(string)]);
        break;
      case node instanceof ast.BooleanLiteral:
        const { value: booleanValue } = node as ast.BooleanLiteral;
        this.emit(booleanValue ? OpCode.OpTrue : OpCode.OpFalse);
        break;
      case node instanceof ast.ArrayLiteral:
        const arrayNode = node as ast.ArrayLiteral;
        arrayNode.elements.forEach((el) => this.compileNode(el));
        this.emit(OpCode.OpArray, [arrayNode.elements.length]);
        break;
      default:
        return null;
    }
  }

  addConstant(obj: Object): number {
    this.constants.push(obj);
    return this.constants.length - 1;
  }

  emit(op: number, operands: number[] = []): number {
    const instruction = Code.make(op, operands);
    const position = this.addInstruction(instruction);
    this.setLastInstruction(op, position);
    return position;
  }

  setLastInstruction(op: OpCode, position: number): void {
    const previous = this.lastInstruction;
    const last = { opCode: op, position };

    this.previousInstruction = previous;
    this.lastInstruction = last;
  }

  lastInstructionIsPop(): boolean {
    return this.lastInstruction.opCode === OpCode.OpPop;
  }

  instructionLength(): number {
    return Instruction.concatAll(this.instructions).length();
  }

  removeLastPop() {
    this.instructions = this.instructions.slice(
      0,
      this.lastInstruction.position
    );
    this.lastInstruction = this.previousInstruction;
  }

  replaceInstruction(position: number, instruction: Instruction) {
    const before = this.instructions.slice(0, position);
    const after = this.instructions.slice(position + 1);
    this.instructions = before.concat(instruction, after);
  }

  changeOperand(position: number, operand: number): void {
    const op = this.instructions[position].getUint8(0);
    const newInstruction = Code.make(op, [operand]);
    this.replaceInstruction(position, newInstruction);
  }

  addInstruction(instruction: Instruction): number {
    const posNewInstruction = this.instructions.length;
    this.instructions.push(instruction);
    return posNewInstruction;
  }

  byteCode(): ByteCode {
    return {
      instruction: Instruction.concatAll(this.instructions),
      constants: this.constants,
    };
  }
}
