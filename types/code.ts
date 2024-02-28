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
  OpMinus,
  OpBang,
  OpJumpNotTruthy,
  OpJump,
  OpNull,
  OpGetGlobal,
  OpSetGlobal,
  OpArray,
  OpHash,
}

export type Definition = { name: string; operandWidths: number[] };
