import { Instruction } from '../code';
import * as obj from '../object';

export default class Frame {
  ip: number;
  basePointer: number;

  constructor(private readonly cl: obj.Closure, basePointer: number) {
    this.cl = cl;
    this.ip = -1;
    this.basePointer = basePointer;
  }

  get instruction(): Instruction {
    return this.cl.fn.instruction;
  }
}
