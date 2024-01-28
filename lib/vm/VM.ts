import { Object, ByteCode } from '../../types';
import { Instruction } from 'lib/code';
import { Integer } from '../object';

export default class VM {
  instruction: Instruction;
  constants: Object[];
  stack: Object[];
  stackPointer: number;

  constructor(byteCode: ByteCode) {
    const { instruction, constants } = byteCode;
    this.constants = constants;
    this.instruction = instruction;
    this.stack = [];
    this.stackPointer = 0;
  }

  stackTop(): Object {
    return new Integer(0);
  }
}
