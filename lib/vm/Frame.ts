import { Instruction } from '../code';
import * as obj from '../object';

export default class Frame {
  ip: number;

  constructor(public cl: obj.Closure, public basePointer: number) {
    this.ip = -1;
  }

  get instruction(): Instruction {
    return this.cl.fn.instruction;
  }
}
