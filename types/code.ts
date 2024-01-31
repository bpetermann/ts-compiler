export enum OpCode {
  OpConstant,
  OpAdd,
  OpPop,
  OpSub,
  OpMul,
  OpDiv,
  OpTrue,
  OpFalse,
  OpEqual,
  OpNotEqual,
  OpGreaterThan,
}

export type Definition = { name: string; operandWidths: number[] };
