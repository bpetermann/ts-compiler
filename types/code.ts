export enum OpCode {
  OpConstant,
}

export type Definition = { name: string; operandWidths: number[] };

export type Instructions = ArrayBuffer;
