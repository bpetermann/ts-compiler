import {
  Object,
  NodeType,
  OpCode,
  ByteCode,
  TokenType,
  Expression,
  CompilationScope,
} from '../../types';
import { SymbolTable } from './Symbol';
import { Instruction } from '../code';
import * as obj from '../object';
import { Code } from '../code';
import * as ast from '../ast';

export default class Compiler {
  constants: Object[];
  symbolTable: SymbolTable;
  scopes: CompilationScope[];
  scopeIndex: number;

  constructor() {
    const mainScope: CompilationScope = {
      instructions: [],
      lastInstruction: { opCode: null, position: null },
      previousInstruction: { opCode: null, position: null },
    };

    this.constants = [];
    this.symbolTable = new SymbolTable();
    this.scopes = [mainScope];
    this.scopeIndex = 0;
  }

  newWithState(s: SymbolTable, constants: Object[]) {
    const compiler = new Compiler();
    compiler.symbolTable = s;
    compiler.constants = constants;
    return compiler;
  }

  byteCode(): ByteCode {
    return {
      instruction: Instruction.concatAll(this.currentInstructions()),
      constants: this.constants,
    };
  }

  emit(op: number, operands: number[] = []): number {
    const instruction = Code.make(op, operands);
    const position = this.addInstruction(instruction);
    this.setLastInstruction(op, position);
    return position;
  }

  compile(program: ast.Program) {
    for (const statement of program.statements) {
      this.compileNode(statement);
    }
  }

  private compileNode(node: NodeType) {
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
      case node instanceof ast.HashLiteral:
        const hashNode = node as ast.HashLiteral;
        const keys: Expression[] = [];
        hashNode.pairs.forEach((_, key) => keys.push(key));
        keys
          .sort((a, b) => a.getString().localeCompare(b.getString()))
          .forEach((key) => {
            this.compileNode(key);
            this.compileNode(hashNode.pairs.get(key));
          });

        this.emit(OpCode.OpHash, [hashNode.pairs.size * 2]);
        break;
      case node instanceof ast.IndexExpression:
        this.compileNode((node as ast.IndexExpression).left);
        this.compileNode((node as ast.IndexExpression).index);
        this.emit(OpCode.OpIndex);
        break;
      case node instanceof ast.FunctionLiteral:
        const FnNode = node as ast.FunctionLiteral;
        this.enterScope();

        this.compileNode(FnNode.body);

        const instructions = this.leaveScope();

        const compiledFn = new obj.CompiledFunction(instructions);
        this.emit(OpCode.OpConstant, [this.addConstant(compiledFn)]);
        break;
      case node instanceof ast.ReturnStatement:
        this.compileNode((node as ast.ReturnStatement).returnValue);
        this.emit(OpCode.OpReturnValue);
        break;
      default:
        return null;
    }
  }

  private addConstant(obj: Object): number {
    this.constants.push(obj);
    return this.constants.length - 1;
  }

  private setLastInstruction(op: OpCode, position: number): void {
    const previous = this.scopes[this.scopeIndex].lastInstruction;
    const last = { opCode: op, position };

    this.scopes[this.scopeIndex].previousInstruction = previous;
    this.scopes[this.scopeIndex].lastInstruction = last;
  }

  private lastInstructionIsPop(): boolean {
    return this.scopes[this.scopeIndex].lastInstruction.opCode === OpCode.OpPop;
  }

  private instructionLength(): number {
    return Instruction.concatAll(this.currentInstructions()).length();
  }

  private removeLastPop() {
    const last = this.scopes[this.scopeIndex].lastInstruction;
    const previous = this.scopes[this.scopeIndex].previousInstruction;

    const oldIns = this.currentInstructions();
    const newIns = oldIns.slice(0, last.position);

    this.scopes[this.scopeIndex].instructions = newIns;
    this.scopes[this.scopeIndex].lastInstruction = previous;
  }

  private replaceInstruction(position: number, instruction: Instruction) {
    const before = this.currentInstructions().slice(0, position);
    const after = this.currentInstructions().slice(position + 1);
    this.scopes[this.scopeIndex].instructions = before.concat(
      instruction,
      after
    );
  }

  private changeOperand(position: number, operand: number): void {
    const op = this.currentInstructions()[position].getUint8(0);
    const newInstruction = Code.make(op, [operand]);
    this.replaceInstruction(position, newInstruction);
  }

  private addInstruction(instruction: Instruction): number {
    const posNewInstruction = this.currentInstructions().length;

    this.scopes[this.scopeIndex].instructions = [
      ...this.currentInstructions(),
      instruction,
    ];
    return posNewInstruction;
  }

  private currentInstructions(): Instruction[] {
    return this.scopes[this.scopeIndex].instructions;
  }

  enterScope(): void {
    const scope: CompilationScope = {
      instructions: [],
      lastInstruction: { opCode: null, position: null },
      previousInstruction: { opCode: null, position: null },
    };
    this.scopes.push(scope);
    this.scopeIndex++;
  }

  leaveScope(): Instruction[] {
    const instructions = this.currentInstructions();
    this.scopes = this.scopes.slice(0, this.scopes.length - 1);
    this.scopeIndex--;

    return instructions;
  }
}
