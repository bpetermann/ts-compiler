import { Environment, Integer, String } from '../lib/object';
import { Object, ObjectType } from '../types';
import { Compiler } from '../lib/compiler';
import { Instruction } from '../lib/code';
import { Parser } from '../lib/parser';
import { Program } from '../lib/ast';
import * as obj from '../lib/object';
import { Eval } from '../lib/eval';
import colors from 'colors';

const cleanInspect = (obj: Object) =>
  obj.inspect().replace(/\x1B\[[0-9;]*m/g, '');

const cleanStmt = (input: string) =>
  input.replace(/\x1B\[[0-9;]*m/g, '').trim();

const cleanString = (input: string) => new RegExp(input.replace(/\n/g, '\\s*'));

const parse = (input: string): Program => {
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
    console.log(colors.red(`wrong instructions length.`));
    return false;
  }

  for (let i = 0; i < concatted.length; i++) {
    if (concatted[i] !== actualArray[i]) {
      console.log(
        colors.red(
          `wrong instruction at index ${i}, want ${concatted[i]} got ${actualArray[i]}`
        )
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

const testStringObject = (expected: Object, actual: Object) =>
  expected.type() === ObjectType.STRING_OBJ &&
  actual.type() === ObjectType.STRING_OBJ &&
  (expected as String).value === (actual as String).value;

const testBooleanObject = (expected: Object, actual: Object) =>
  expected.type() === ObjectType.BOOLEAN_OBJ &&
  actual.type() === ObjectType.BOOLEAN_OBJ &&
  (expected as Integer).value === (actual as Integer).value;

const testConstants = (expected: Object[], actual: Object[]) => {
  for (let i = 0; i < expected.length; i++) {
    switch (expected[i].type()) {
      case ObjectType.INTEGER_OBJ:
        if (!testIntegerObject(expected[i], actual[i])) return false;
        break;
      case ObjectType.STRING_OBJ:
        if (!testStringObject(expected[i], actual[i])) return false;
        break;
      case ObjectType.COMPILED_FUNCTION_OBJ:
        const fn = actual[i] as obj.CompiledFunction;
        if (
          !testInstructions(
            [(expected[i] as obj.CompiledFunction).instruction],
            fn.instruction
          )
        )
          return false;
        break;
    }
  }

  return true;
};

const compileExpression = (expression: string) => {
  const compiler = new Compiler();
  compiler.compile(parse(expression));
  return compiler.byteCode();
};

const instructionComparisonLogger = (
  expected: Instruction[],
  actual: Instruction
) => {
  console.log(
    `${colors.blue('Expected:')}\n${concatInstructions(expected).string()}`
  );
  console.log(`${colors.blue('Actual:')}\n${actual.string()}`);
};

export {
  cleanInspect,
  cleanStmt,
  cleanString,
  parse,
  parseAndEval,
  testInstructions,
  concatInstructions,
  testBooleanObject,
  testIntegerObject,
  testStringObject,
  testConstants,
  compileExpression,
  instructionComparisonLogger,
};
