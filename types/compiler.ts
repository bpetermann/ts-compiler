import { Instruction } from '../lib/code';
import { Object } from './object';
import { OpCode } from './code';

export type ByteCode = {
  instruction: Instruction;
  constants: Object[];
};

export type EmmitedInstruction = {
  opCode: OpCode;
  position: number;
};
