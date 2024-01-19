import { Object, NodeType } from '../../types';

export default class Compiler {
  instructions: any;
  constants: Object[];

  constructor(instructions: any, constants: Object[]) {
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
