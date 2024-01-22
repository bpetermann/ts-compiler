import { precedences } from '../lib/parser/helper';
import { Instruction } from '../lib/code';
import { expect } from '@jest/globals';
import { TokenType } from '../types';
import * as helper from './helper';

it('should map token types to numbers', () => {
  const eq = precedences(TokenType.EQ);
  const lg = precedences(TokenType.LT);
  const sum = precedences(TokenType.PLUS);

  const expected = [1, 2, 4];

  expect([eq, lg, sum]).toEqual(expected);
});

it('should concat two array Buffer', () => {
  const buffer1 = new Instruction(3, [1, 2, 3]);
  const buffer2 = new Instruction(3, [4, 5, 6]);

  const actual = helper.concatInstructions([buffer1, buffer2]);
  const expected = [1, 2, 3, 4, 5, 6];

  expect(actual.getUint8Array()).toEqual(expected);
});

it('should check the equality of two instructions', () => {
  const instructions = new Instruction(3, [1, 2, 3]);
  const instructionsArray = [instructions];

  expect(helper.testInstructions(instructionsArray, instructions)).toBe(true);
});

it('should return false if the instuctions arent equal', () => {
  const instructions = new Instruction(3, [1, 2, 3]);
  const differentInstructions = new Instruction(3, [4, 5, 6]);
  const instructionsArray = [differentInstructions];

  expect(helper.testInstructions(instructionsArray, instructions)).toBe(false);
});

it('should compare two integer object arrays', () => {
  const arr1 = [helper.parseAndEval(`3`), helper.parseAndEval(`8`)];
  const arr2 = [helper.parseAndEval(`3`), helper.parseAndEval(`8`)];

  expect(helper.testConstants(arr1, arr2)).toEqual(true);
});
