import { precedences } from '../lib/parser/helper';
import { concatInstructions } from './helper';
import { expect } from '@jest/globals';
import { TokenType } from '../types';

it('should map token types to numbers', () => {
  const eq = precedences(TokenType.EQ);
  const lg = precedences(TokenType.LT);
  const sum = precedences(TokenType.PLUS);

  const expected = [1, 2, 4];

  expect([eq, lg, sum]).toEqual(expected);
});

it('should concat two array Buffer', () => {
  const buffer1 = new ArrayBuffer(5);
  const buffer2 = new ArrayBuffer(5);

  expect(concatInstructions([buffer1, buffer2]).length).toEqual(10);
});
