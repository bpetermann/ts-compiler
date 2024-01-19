import { Environment } from '../lib/object';
import { Parser } from '../lib/parser';
import { Program } from '../lib/ast';
import { Object } from '../types';
import { Eval } from '../lib/eval';

const cleanInspect = (obj: Object) => {
  return obj.inspect().replace(/\x1B\[[0-9;]*m/g, '');
};

const cleanStmt = (input: string) => {
  return input.replace(/\x1B\[[0-9;]*m/g, '').trim();
};

const parse = (input: string) => {
  const parser = new Parser(input);
  return parser.parse();
};

const parseAndEval = (input: string, pos?: number) => {
  const parser = new Parser(input);
  const program: Program = parser.parse();
  return new Eval().evaluate(program, new Environment({}))[pos ?? 0];
};

const testInstructions = (expected: ArrayBuffer[], actual: ArrayBuffer) => {
  const expectedArray = concatInstructions(expected);
  const actualArray = [...new Uint8Array(actual)];

  expectedArray.forEach((item, i) => {
    if (!(item === actualArray[i])) {
      throw Error(`wrong instruction at ${i}`);
    }
  });
};

const concatInstructions = (instructions: ArrayBuffer[]) => {
  return instructions
    .map((instruction) => [...new Uint8Array(instruction)])
    .flat();
};

export {
  cleanInspect,
  cleanStmt,
  parse,
  parseAndEval,
  testInstructions,
  concatInstructions,
};
