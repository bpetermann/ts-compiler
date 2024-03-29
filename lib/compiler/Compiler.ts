import {
  Object,
  NodeType,
  OpCode,
  ByteCode,
  TokenType,
  Expression,
  CompilationScope,
} from '../../types';
import {
  SymbolTable,
  EnclosedSymbolTable,
  SymbolScope,
  Symbol,
} from './Symbol';
import { Instruction } from '../code';
import * as obj from '../object';
import { Code } from '../code';
import * as ast from '../ast';

export default class Compiler {
  constants: Object[];
  symbolTable: SymbolTable | EnclosedSymbolTable;
  scopes: CompilationScope[];
  scopeIndex: number;
  private mainScope: CompilationScope = {
    instructions: [],
    lastInstruction: {},
    previousInstruction: {},
  };

  constructor() {
    this.constants = [];
    this.symbolTable = new SymbolTable();
    this.scopes = [this.mainScope];
    this.scopeIndex = 0;
    this.addBuiltins();
  }

  private addBuiltins(): void {
    obj.builtins.forEach(({ name }, i) =>
      this.symbolTable.defineBuiltin(i, name)
    );
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
        if (this.lastInstructionIs(OpCode.OpPop)) this.removeLastPop();

        // Emit an `OpJump` with a bogus value
        const jumpPos = this.emit(OpCode.OpJump, [9999]);

        const afterConsequencePos = this.instructionLength();
        this.changeOperand(jumpNotTruthyPos, afterConsequencePos);

        if (!alternative) {
          this.emit(OpCode.OpNull);
        } else {
          this.compileNode(alternative);
        }

        if (this.lastInstructionIs(OpCode.OpPop)) this.removeLastPop();
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
        const symbol = this.symbolTable.define(
          (node as ast.LetStatement).name.value
        );
        this.compileNode((node as ast.LetStatement).value);

        if (symbol.scope === SymbolScope.GlobalScope) {
          this.emit(OpCode.OpSetGlobal, [symbol.index]);
        } else {
          this.emit(OpCode.OpSetLocal, [symbol.index]);
        }
        break;
      case node instanceof ast.Identifier:
        {
          const symbol = this.symbolTable.resolve(
            (node as ast.Identifier).value
          );
          if (symbol.index < 0)
            throw new Error(
              `undefined variable ${(node as ast.Identifier).value}`
            );
          this.loadSymbol(symbol);
        }
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
            const value = hashNode.pairs.get(key);
            if (value !== undefined) {
              this.compileNode(value);
            }
          });

        this.emit(OpCode.OpHash, [hashNode.pairs.size * 2]);
        break;
      case node instanceof ast.IndexExpression:
        this.compileNode((node as ast.IndexExpression).left);
        this.compileNode((node as ast.IndexExpression).index);
        this.emit(OpCode.OpIndex);
        break;
      case node instanceof ast.FunctionLiteral:
        const fnNode = node as ast.FunctionLiteral;
        this.enterScope();

        if (fnNode.name) {
          this.symbolTable.defineFunctionName(fnNode.name);
        }

        fnNode.parameters.forEach((p) => this.symbolTable.define(p.value));

        this.compileNode(fnNode.body);

        if (this.lastInstructionIs(OpCode.OpPop))
          this.replaceLastPopWithReturn();

        if (!this.lastInstructionIs(OpCode.OpReturnValue))
          this.emit(OpCode.OpReturn);

        const freeSymbols = this.symbolTable.freeSymbols;
        const numLocals = this.symbolTable.numDefinitions;
        const instruction = this.leaveScope();

        freeSymbols.forEach((s) => this.loadSymbol(s));

        const compiledFn = new obj.CompiledFunction(
          instruction,
          numLocals,
          fnNode.parameters.length
        );
        const fnIndex = this.addConstant(compiledFn);
        this.emit(OpCode.OpClosure, [fnIndex, freeSymbols.length]);
        break;
      case node instanceof ast.CallExpression:
        const callNode = node as ast.CallExpression;
        this.compileNode(callNode.function);

        callNode.arguments.forEach((node) => {
          this.compileNode(node);
        });

        this.emit(OpCode.OpCall, [callNode.arguments.length]);
        break;
      case node instanceof ast.ReturnStatement:
        this.compileNode((node as ast.ReturnStatement).returnValue);
        this.emit(OpCode.OpReturnValue);
        break;
      default:
        return null;
    }
  }

  private replaceLastPopWithReturn() {
    const lastPos = this.scopes[this.scopeIndex].lastInstruction.position;
    if (lastPos) {
      this.replaceInstruction(lastPos, Code.make(OpCode.OpReturnValue));
      this.scopes[this.scopeIndex].lastInstruction.opCode =
        OpCode.OpReturnValue;
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

  private lastInstructionIs(op: OpCode): boolean {
    return (
      this.currentInstructions().length !== 0 &&
      this.scopes[this.scopeIndex].lastInstruction.opCode === op
    );
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
      lastInstruction: {},
      previousInstruction: {},
    };
    this.scopes.push(scope);
    this.scopeIndex++;
    this.symbolTable = new EnclosedSymbolTable(this.symbolTable);
  }

  leaveScope(): Instruction {
    const instructions = Instruction.concatAll(this.currentInstructions());
    this.scopes = this.scopes.slice(0, this.scopes.length - 1);
    this.scopeIndex--;
    if (!(this.symbolTable instanceof EnclosedSymbolTable))
      throw new Error('cannot leave scope: already at the outermost scope');
    this.symbolTable = this.symbolTable.outer;

    return instructions;
  }

  private loadSymbol(s: Symbol): void {
    switch (s.scope) {
      case SymbolScope.GlobalScope:
        this.emit(OpCode.OpGetGlobal, [s.index]);
        break;
      case SymbolScope.LocalScope:
        this.emit(OpCode.OpGetLocal, [s.index]);
        break;
      case SymbolScope.BuiltinScope:
        this.emit(OpCode.OpGetBuiltin, [s.index]);
        break;
      case SymbolScope.FreeScope:
        this.emit(OpCode.OpGetFree, [s.index]);
        break;
      case SymbolScope.FunctionScope:
        this.emit(OpCode.OpCurrentClosure);
        break;
    }
  }
}
