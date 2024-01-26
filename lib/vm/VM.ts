import { Object, ByteCode } from '../../types';
import { Integer } from '../object';

export default class VM {
  byteCode: ByteCode;
  constructor(byteCode: ByteCode) {
    this.byteCode = byteCode;
  }

  stackTop(): Object {
    return new Integer(0);
  }
}
