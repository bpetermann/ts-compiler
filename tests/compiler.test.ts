import { Compiler, Symbol, SymbolScope, SymbolTable } from '../lib/compiler';
import { Code, Instruction } from '../lib/code';
import { OpCode, Object } from '../types';
import { expect } from '@jest/globals';
import * as obj from '../lib/object';
import * as helper from './helper';

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

it('should compile global let statements', () => {
  const expected: {
    instruction: Instruction[];
    constants: obj.Integer[];
    expression: string;
  }[] = [
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpSetGlobal, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpSetGlobal, [1]),
      ],
      constants: [new obj.Integer(1), new obj.Integer(2)],
      expression: `
      let one = 1;
      let two = 2;
      `,
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpSetGlobal, [0]),
        Code.make(OpCode.OpGetGlobal, [0]),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1)],
      expression: `
      let one = 1;
      one;
      `,
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpSetGlobal, [0]),
        Code.make(OpCode.OpGetGlobal, [0]),
        Code.make(OpCode.OpSetGlobal, [1]),
        Code.make(OpCode.OpGetGlobal, [1]),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.Integer(1)],
      expression: `
      let one = 1;
      let two = one;
      two;
      `,
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

it('should define symbols', () => {
  const global = new SymbolTable();

  const expected: { name: string; symbol: Symbol }[] = [
    { name: 'a', symbol: new Symbol('a', SymbolScope.GlobalScope, 0) },
    { name: 'b', symbol: new Symbol('b', SymbolScope.GlobalScope, 1) },
  ];

  expected.forEach(({ name, symbol }) => {
    expect(global.define(name)).toEqual(symbol);
  });
});

it('should resolve global defined symbols by name', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const expected: Symbol[] = [
    new Symbol('a', SymbolScope.GlobalScope, 0),
    new Symbol('b', SymbolScope.GlobalScope, 1),
  ];

  expected.forEach((symbol) => {
    expect(global.resolve(symbol.name)).toEqual(symbol);
  });
});

it('should compile strings', () => {
  const expected: {
    instruction: Instruction[];
    constants: obj.String[];
    expression: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpConstant, [0]), Code.make(OpCode.OpPop)],
      constants: [new obj.String('monkey')],
      expression: `"monkey"`,
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpAdd),
        Code.make(OpCode.OpPop),
      ],
      constants: [new obj.String('mon'), new obj.String('key')],
      expression: `"mon" + "key"`,
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

it('should compile array literals', () => {
  const expected: {
    instruction: Instruction[];
    constants: obj.Array[];
    expression: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpArray), Code.make(OpCode.OpPop)],
      constants: [new obj.Array([])],
      expression: '[]',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpArray, [3]),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Array([
          new obj.Integer(1),
          new obj.Integer(2),
          new obj.Integer(3),
        ]),
      ],
      expression: '[1,2,3]',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpAdd),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpConstant, [3]),
        Code.make(OpCode.OpSub),
        Code.make(OpCode.OpConstant, [4]),
        Code.make(OpCode.OpConstant, [5]),
        Code.make(OpCode.OpMul),
        Code.make(OpCode.OpArray, [3]),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Array([
          new obj.Integer(1),
          new obj.Integer(2),
          new obj.Integer(3),
          new obj.Integer(4),
          new obj.Integer(5),
          new obj.Integer(6),
        ]),
      ],
      expression: '[1 + 2, 3 - 4, 5 * 6]',
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

it('should compile hash literals', () => {
  const expected: {
    instruction: Instruction[];
    constants: Object[];
    expression: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpHash), Code.make(OpCode.OpPop)],
      constants: [new obj.Hash(new Map<number, obj.HashPair>())],
      expression: '{}',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpConstant, [3]),
        Code.make(OpCode.OpConstant, [4]),
        Code.make(OpCode.OpConstant, [5]),
        Code.make(OpCode.OpHash, [6]),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Integer(1),
        new obj.Integer(2),
        new obj.Integer(3),
        new obj.Integer(4),
        new obj.Integer(5),
        new obj.Integer(6),
      ],

      expression: '{1: 2, 3: 4, 5: 6}',
    },

    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpAdd),
        Code.make(OpCode.OpConstant, [3]),
        Code.make(OpCode.OpConstant, [4]),
        Code.make(OpCode.OpConstant, [5]),
        Code.make(OpCode.OpMul),
        Code.make(OpCode.OpHash, [4]),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Integer(1),
        new obj.Integer(2),
        new obj.Integer(3),
        new obj.Integer(4),
        new obj.Integer(5),
        new obj.Integer(6),
      ],

      expression: '{1: 2 + 3, 4: 5 * 6}',
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

it('should compile index expressions', () => {
  const expected: {
    instruction: Instruction[];
    constants: Object[];
    expression: string;
  }[] = [
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpArray, [3]),
        Code.make(OpCode.OpConstant, [3]),
        Code.make(OpCode.OpConstant, [4]),
        Code.make(OpCode.OpAdd),
        Code.make(OpCode.OpIndex),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Integer(1),
        new obj.Integer(2),
        new obj.Integer(3),
        new obj.Integer(1),
        new obj.Integer(1),
      ],
      expression: '[1, 2, 3][1 + 1]',
    },
    {
      instruction: [
        Code.make(OpCode.OpConstant, [0]),
        Code.make(OpCode.OpConstant, [1]),
        Code.make(OpCode.OpHash, [2]),
        Code.make(OpCode.OpConstant, [2]),
        Code.make(OpCode.OpConstant, [3]),
        Code.make(OpCode.OpSub),
        Code.make(OpCode.OpIndex),
        Code.make(OpCode.OpPop),
      ],
      constants: [
        new obj.Integer(1),
        new obj.Integer(2),
        new obj.Integer(2),
        new obj.Integer(1),
      ],
      expression: '{1: 2}[2 - 1]',
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

it('should handle different scopes', () => {
  const throwError = (text: string) => {
    throw new Error(text);
  };

  const compiler = new Compiler();

  if (compiler.scopeIndex !== 0)
    throwError(`scopeIndex wrong. got=${compiler.scopeIndex}, want=0`);

  compiler.emit(OpCode.OpMul);

  compiler.enterScope();
  if (compiler.scopeIndex !== 1)
    throwError(`scopeIndex wrong. got=${compiler.scopeIndex}, want=1`);

  compiler.emit(OpCode.OpSub);

  if (compiler.scopes[compiler.scopeIndex].instructions.length !== 1)
    throwError(
      `instructions length wrong. got=${
        compiler.scopes[compiler.scopeIndex].instructions.length
      }`
    );

  let last = compiler.scopes[compiler.scopeIndex].lastInstruction;
  if (last.opCode !== OpCode.OpSub)
    throwError(
      `lastInstruction.Opcode wrong. got=${last.opCode}, want=${OpCode.OpSub}}`
    );

  compiler.leaveScope();

  if (compiler.scopeIndex !== 0)
    throwError(`scopeIndex wrong. got=${compiler.scopeIndex}, want=0`);

  compiler.emit(OpCode.OpAdd);

  if (compiler.scopes[compiler.scopeIndex].instructions.length !== 2)
    throwError(
      `instructions length wrong. got=${
        compiler.scopes[compiler.scopeIndex].instructions.length
      }`
    );

  last = compiler.scopes[compiler.scopeIndex].lastInstruction;

  if (last.opCode !== OpCode.OpAdd)
    throwError(
      `lastInstruction.Opcode wrong. got=${last.opCode}, want=${OpCode.OpSub}}`
    );

  const previous = compiler.scopes[compiler.scopeIndex].previousInstruction;

  if (previous.opCode !== OpCode.OpMul)
    throwError(
      `previousInstruction.Opcode wrong. got=${previous.opCode}, want=OpMul}`
    );
});

it('should compile functions', () => {
  const expected: {
    instruction: Instruction[];
    constants: Object[];
    input: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpConstant, [2]), Code.make(OpCode.OpPop)],
      constants: [
        new obj.Integer(5),
        new obj.Integer(10),
        new obj.CompiledFunction([
          Code.make(OpCode.OpConstant, [0]),
          Code.make(OpCode.OpConstant, [1]),
          Code.make(OpCode.OpAdd),
          Code.make(OpCode.OpReturnValue),
        ]),
      ],
      input: `fn() { return 5 + 10 }`,
    },
  ];

  expected.forEach(({ instruction, constants, input }) => {
    const actual = compileExpression(input);

    expect(helper.testConstants(constants, actual.constants)).toEqual(true);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});

it('should compile implicit return functions', () => {
  const expected: {
    instruction: Instruction[];
    constants: Object[];
    input: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpConstant, [2]), Code.make(OpCode.OpPop)],
      constants: [
        new obj.Integer(5),
        new obj.Integer(10),
        new obj.CompiledFunction([
          Code.make(OpCode.OpConstant, [0]),
          Code.make(OpCode.OpConstant, [1]),
          Code.make(OpCode.OpAdd),
          Code.make(OpCode.OpReturnValue),
        ]),
      ],
      input: `fn() { 5 + 10 }`,
    },
  ];

  expected.forEach(({ instruction, constants, input }) => {
    const actual = compileExpression(input);

    expect(helper.testConstants(constants, actual.constants)).toEqual(true);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});

it('should compile implicit return functions', () => {
  const expected: {
    instruction: Instruction[];
    constants: Object[];
    input: string;
  }[] = [
    {
      instruction: [Code.make(OpCode.OpConstant, [2]), Code.make(OpCode.OpPop)],
      constants: [
        new obj.Integer(1),
        new obj.Integer(2),
        new obj.CompiledFunction([
          Code.make(OpCode.OpConstant, [0]),
          Code.make(OpCode.OpPop),
          Code.make(OpCode.OpConstant, [1]),
          Code.make(OpCode.OpReturnValue),
        ]),
      ],
      input: `fn() { 1; 2 }`,
    },
  ];

  expected.forEach(({ instruction, constants, input }) => {
    const actual = compileExpression(input);

    expect(helper.testConstants(constants, actual.constants)).toEqual(true);
    expect(helper.testInstructions(instruction, actual.instruction)).toEqual(
      true
    );
  });
});
