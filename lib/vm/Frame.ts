import { Instruction } from '../code';
import * as obj from '../object';

export default class Frame {
  ip: number;
  basePointer: number;

  constructor(private readonly fn: obj.CompiledFunction, basePointer: number) {
    this.fn = fn;
    this.ip = -1;
    this.basePointer = basePointer;
  }

  get instruction(): Instruction {
    return this.fn.instruction;
  }
}
