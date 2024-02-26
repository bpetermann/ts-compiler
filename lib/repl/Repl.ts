import { TokenType, Object, ByteCode } from '../../types';
import { Compiler, SymbolTable } from '../compiler';
import { Instruction } from '../code';
import { Parser } from '../parser';
import readline from 'readline';
import * as ast from '../ast';
import colors from 'colors';
import VM from '../vm';

export default class Repl {
  rl: readline.Interface;
  compiler: Compiler;
  vm: VM;
  constants: Object[];
  symbolTable: SymbolTable;
  globals: Object[];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.compiler = new Compiler();
    this.vm = new VM();
    this.constants = [];
    this.symbolTable = new SymbolTable();
    this.globals = new Array(this.vm.globalSize);
  }

  start() {
    this.rl.question('>> ', (input) => {
      this.processInput(input);
    });
  }

  private processInput(input: string) {
    if (input.trim().toUpperCase() === TokenType.EOF) {
      this.rl.close();
      process.exit(0);
    }

    this.print(input);

    this.start();
  }

  private print(line: string) {
    const program = this.parse(line);
    const code = this.compile(program);

    const machine = this.vm.newWithGlobalStore(code, this.globals);
    machine.run();
    const lastPoppedStackElem = machine.lastPoppedStackElem();

    console.log(lastPoppedStackElem.inspect());
  }

  private parse(line: string): ast.Program {
    const parser = new Parser(line);
    const program = parser.parse();

    if (parser.errors.length) {
      parser.errors.forEach((err) => {
        console.log(colors.red(err));
      });
      return;
    }

    return program;
  }

  private compile(program: ast.Program): ByteCode {
    const compiler = this.compiler.newWithState(
      this.symbolTable,
      this.constants
    );

    compiler.compile(program);
    const code = compiler.byteCode();
    this.constants = code.constants;

    return code;
  }
}
