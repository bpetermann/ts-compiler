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
    const results = [];

    for (const statement of program.statements) {
      const result = this.compileNode(statement);
      results.push(result);
    }

    return results;
  }

  compileNode(node: NodeType) {
    switch (true) {
      case node instanceof ast.ExpressionStatement:
        return this.compileNode((node as ast.ExpressionStatement).expression);
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
