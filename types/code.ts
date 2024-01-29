export enum OpCode {
  OpConstant,
  OpAdd,
}

export type Definition = { name: string; operandWidths: number[] };
