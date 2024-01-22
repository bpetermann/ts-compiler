import { Environment, Integer } from '../lib/object';
import { Object, ObjectType } from '../types';
import { Parser } from '../lib/parser';
import { Program } from '../lib/ast';
import { Eval } from '../lib/eval';
import { Instruction } from '../lib/code';

const cleanInspect = (obj: Object) =>
  obj.inspect().replace(/\x1B\[[0-9;]*m/g, '');

const cleanStmt = (input: string) =>
  input.replace(/\x1B\[[0-9;]*m/g, '').trim();

const cleanString = (input: string) => new RegExp(input.replace(/\n/g, '\\s*'));

const parse = (input: string) => {
  const parser = new Parser(input);
  return parser.parse();
};

const parseAndEval = (input: string, pos?: number) => {
  const parser = new Parser(input);
  const program: Program = parser.parse();
  return new Eval().evaluate(program, new Environment({}))[pos ?? 0];
};

const testInstructions = (expected: Instruction[], actual: Instruction) => {
  const concatted = concatInstructions(expected).getUint8Array();
  const actualArray = actual.getUint8Array();

  if (concatted.length !== actualArray.length) {
    console.log(`wrong instructions length.`);
    return false;
  }

  for (let i = 0; i < concatted.length; i++) {
    if (concatted[i] !== actualArray[i]) {
      console.log(
        `wrong instruction at index ${i}, want ${concatted[i]} got ${actualArray[i]}`
      );
      return false;
    }
  }
  return true;
};

const concatInstructions = (instructions: Instruction[]): Instruction =>
  Instruction.concatAll(instructions);

const testIntegerObject = (expected: Object, actual: Object) =>
  expected.type() === ObjectType.INTEGER_OBJ &&
  actual.type() === ObjectType.INTEGER_OBJ &&
  (expected as Integer).value === (actual as Integer).value;

const testConstants = (expected: Object[], actual: Object[]) => {
  for (let i = 0; i < expected.length; i++) {
    switch (expected[i].type()) {
      case ObjectType.INTEGER_OBJ:
        if (!testIntegerObject(expected[i], actual[i])) {
          return false;
        }
        break;
    }
  }

  return true;
};

export {
  cleanInspect,
  cleanStmt,
  cleanString,
  parse,
  parseAndEval,
  testInstructions,
  concatInstructions,
  testConstants,
};
