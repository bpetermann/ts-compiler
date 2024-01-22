import { Object, NodeType } from '../../types';
import { Instruction } from '../code';

export default class Compiler {
  instructions: Instruction[];
  constants: Object[];

  constructor(instructions: Instruction[], constants: Object[]) {
    this.instructions = instructions;
    this.constants = constants;
  }

  compile(node: NodeType) {
    return null;
  }

  byteCode() {
    return {
      instructions: this.instructions,
      constants: this.constants,
    };
  }
}
