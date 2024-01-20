import { precedences } from '../lib/parser/helper';
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
  const buffer1 = new Uint8Array([1, 2, 3]).buffer;
  const buffer2 = new Uint8Array([4, 5, 6]).buffer;

  const actual = helper.concatInstructions([buffer1, buffer2]);
  const expected = [1, 2, 3, 4, 5, 6];

  expect([...new Uint8Array(actual)]).toEqual(expected);
});

it('should check the equality of two instructions', () => {
  const buffer = new Uint8Array([10, 20, 30]).buffer;
  const bufferArray = [buffer];

  expect(helper.testInstructions(bufferArray, buffer)).toBe(true);
});

it('should return false if the instuctions arent equal', () => {
  const buffer = new Uint8Array([10, 20, 30]).buffer;
  const differentBuffer = new Uint8Array([20, 30, 40]).buffer;
  const bufferArray = [differentBuffer];

  expect(helper.testInstructions(bufferArray, buffer)).toBe(false);
});

it('should compare two integer object arrays', () => {
  const arr1 = [helper.parseAndEval(`3`), helper.parseAndEval(`8`)];
  const arr2 = [helper.parseAndEval(`3`), helper.parseAndEval(`8`)];

  expect(helper.testConstants(arr1, arr2)).toEqual(true);
});
