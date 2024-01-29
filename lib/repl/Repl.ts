import Compiler from '../compiler/Compiler';
import { TokenType } from '../../types';
import { Parser } from '../parser';
import readline from 'readline';
import colors from 'colors';
import VM from '../vm/VM';

export default class Repl {
  rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private print(line: string) {
    const parser = new Parser(line);
    const program = parser.parse();

    if (parser.errors.length) {
      parser.errors.forEach((err) => {
        console.log(colors.red(err));
      });
      return;
    }

    const compiler = new Compiler();
    compiler.compile(program);

    const machine = new VM(compiler.byteCode());
    machine.run();

    const stackTop = machine.stackTop();
    console.log(stackTop);
  }

  private processInput(input: string) {
    if (input.trim().toUpperCase() === TokenType.EOF) {
      this.rl.close();
      process.exit(0);
    }

    this.print(input);

    this.start();
  }

  start() {
    this.rl.question('>> ', (input) => {
      this.processInput(input);
    });
  }
}
