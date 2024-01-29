import { Object, NodeType, OpCode, ByteCode, TokenType } from '../../types';
import { Instruction } from '../code';
import * as obj from '../object';
import { Code } from '../code';
import * as ast from '../ast';

export default class Compiler {
  instructions: Instruction[];
  constants: Object[];

  constructor() {
    this.instructions = [];
    this.constants = [];
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
      case node instanceof ast.InfixExpression:
        const {
          left: infixLeft,
          right: infixRight,
          operator,
        } = node as ast.InfixExpression;
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
          default:
            throw new Error(`unknown operator ${operator}`);
        }
        break;
      case node instanceof ast.IntegerLiteral:
        const { value } = node as ast.IntegerLiteral;
        const integer = new obj.Integer(value);
        this.emit(OpCode.OpConstant, [this.addConstant(integer)]);
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
    return position;
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
