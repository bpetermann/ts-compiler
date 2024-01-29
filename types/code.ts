export enum OpCode {
  OpConstant,
  OpAdd,
  OpPop,
  OpSub,
  OpMul,
  OpDiv,
}

export type Definition = { name: string; operandWidths: number[] };
