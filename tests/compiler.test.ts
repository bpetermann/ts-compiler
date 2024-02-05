import { Code, Instruction } from '../lib/code';
import Compiler from '../lib/compiler';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';
import { OpCode } from '../types';

const compileExpression = (expression: string) => {
  const compiler = new Compiler();
  compiler.compile(helper.parse(expression));
  return compiler.byteCode();
};

it('should compile integer arithmetics', () => {
  const expected: {
    instruction: Instruction[];
    constants: obj.Integer[];
    expression: string;
  }[] = [
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpAdd),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: '1 + 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpSub),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: '1 - 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpMul),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: '1 * 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpDiv),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(2), new obj.Integer(1)],
      expression: '2 / 1',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpMinus),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1)],
      expression: '-1',
    },
  ];

  expected.forEach(({ instruction, constants, expression }) => {
    const actual = compileExpression(expression);

    expect(helper.testConstants(constants, actual.constants)).toEqual(true);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});

it('should compile boolean expressions', () => {
  const expected: {
    instruction: Instruction[];
    expression: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpTrue), Code.make(OpCode.OpPop)],
      expression: 'true',
    },
    {
      instruction: [Code.make(OpCode.OpFalse), Code.make(OpCode.OpPop)],
      expression: 'false',
    },
  ];

  expected.forEach(({ instruction, expression }) => {
    const actual = compileExpression(expression);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});

it('should compile comparsion operators', () => {
  const expected: {
    instruction: Instruction[];
    constants: obj.Integer[];
    expression: string;
  }[] = [
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpGreaterThan),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: '1 > 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpGreaterThan),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(2), new obj.Integer(1)],
      expression: '1 < 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpEqual),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: '1 == 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpNotEqual),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: '1 != 2',
    },
    {
      instruction: [
        Code.make(OpCode.OpTrue),
        Code.make(OpCode.OpFalse),
        Code.make(OpCode.OpEqual),
        Code.make(OpCode.OpPop),
      ],
      constants: [],
      expression: 'true == false',
    },
    {
      instruction: [
        Code.make(OpCode.OpTrue),
        Code.make(OpCode.OpFalse),
        Code.make(OpCode.OpNotEqual),
        Code.make(OpCode.OpPop),
      ],
      constants: [],
      expression: 'true != false',
    },
    {
      instruction: [
        Code.make(OpCode.OpTrue),
        Code.make(OpCode.OpBang),
        Code.make(OpCode.OpPop),
      ],
      constants: [],
      expression: '!true',
    },
  ];

  expected.forEach(({ instruction, constants, expression }, i) => {
    const actual = compileExpression(expression);

    expect(helper.testConstants(constants, actual.constants)).toEqual(true);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});

it('should compile conditionals', () => {
  const expected: {
    instruction: Instruction[];
    constants: obj.Integer[];
    expression: string;
  }[] = [
    {
      instruction: [
        Code.make(OpCode.OpTrue),
        Code.make(OpCode.OpJumpNotTruthy, [10]),
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpJump, [11]),
        Code.make(OpCode.OpNull),
        Code.make(OpCode.OpPop),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(10), new obj.Integer(3333)],
      expression: 'if (true) { 10 }; 3333;',
    },
    {
      instruction: [
        Code.make(OpCode.OpTrue),
        Code.make(OpCode.OpJumpNotTruthy, [10]),
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpJump, [13]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpPop),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Integer(10),
        new obj.Integer(20),
        new obj.Integer(3333),
      ],
      expression: 'if (true) { 10 } else { 20 }; 3333;',
    },
  ];

  expected.forEach(({ instruction, constants, expression }, i) => {
    const actual = compileExpression(expression);

    expect(helper.testConstants(constants, actual.constants)).toEqual(true);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});
