import { Environment, Integer } from '../lib/object';
import { Object, ObjectType } from '../types';
import { Parser } from '../lib/parser';
import { Program } from '../lib/ast';
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
  const concatted = concatInstructions(expected);
  const actualArray = [...new Uint8Array(actual)];

  if (concatted.length !== actualArray.length) {
    throw Error(`wrong instructions length.`);
  }

  concatted.forEach((item, i) => {
    if (!(item === actualArray[i])) {
      throw Error(
        `wrong instruction at ${i}. Want${item} got ${actualArray[i]}`
      );
    }
  });
};

const concatInstructions = (instructions: ArrayBuffer[]) => {
  return instructions
    .map((instruction) => [...new Uint8Array(instruction)])
    .flat();
};

const testIntegerObject = (expected: Object, actual: Object) =>
  expected.type() === ObjectType.INTEGER_OBJ &&
  actual.type() === ObjectType.INTEGER_OBJ &&
  (expected as Integer).value === (actual as Integer).value;

const testConstants = (expected: Object[], actual: Object[]) => {
  expected.forEach((constant, i) => {
    switch (constant.type()) {
      case ObjectType.INTEGER_OBJ:
        if (!testIntegerObject(constant, actual[i])) {
          return false;
        }
        break;
    }
  });

  return true;
};

export {
  cleanInspect,
  cleanStmt,
  parse,
  parseAndEval,
  testInstructions,
  concatInstructions,
  testConstants,
};
