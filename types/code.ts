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
  OPArray
}

export type Definition = { name: string; operandWidths: number[] };
