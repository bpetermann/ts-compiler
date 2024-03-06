import { Instruction } from '../code';
import * as obj from '../object';

export default class Frame {
  fn: obj.CompiledFunction;
  ip: number;

  constructor(fn: obj.CompiledFunction) {
    this.fn = fn;
    this.ip = -1;
  }

  get instruction(): Instruction {
    return this.fn.instruction;
  }
}
