import { Instruction } from '../lib/code';
import { Object } from './object';

export type ByteCode = {
  instruction: Instruction;
  constants: Object[];
};
