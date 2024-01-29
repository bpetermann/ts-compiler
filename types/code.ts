export enum OpCode {
  OpConstant,
  OpAdd,
  OpPop,
}

export type Definition = { name: string; operandWidths: number[] };
