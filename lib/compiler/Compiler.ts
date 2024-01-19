import { Object, NodeType } from '../../types';

export default class Compiler {
  instructions: ArrayBuffer[];
  constants: Object[];

  constructor(instructions: ArrayBuffer[], constants: Object[]) {
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
