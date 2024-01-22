export default class Instruction {
  private dataView: DataView;

  constructor(length: number) {
    this.dataView = new DataView(new ArrayBuffer(length));
  }

  setUint8(byteOffset: number, value: number) {
    this.dataView.setUint8(byteOffset, value);
  }

  setUint16(byteOffset: number, value: number) {
    this.dataView.setUint16(byteOffset, value);
  }

  getBuffer() {
    return this.dataView.buffer;
  }

  getUint16(byteOffset: number) {
    if (byteOffset < 0 || byteOffset + 2 > this.dataView.byteLength) {
      throw new Error('Invalid byteOffset');
    }
    console.log(this.dataView);
    return this.dataView.getUint16(byteOffset, false);
  }

  slice(value: number): Instruction {
    if (value < 0 || value > this.dataView.byteLength) {
      throw new Error('Invalid slice value');
    }

    const slicedInstruction = new Instruction(this.dataView.byteLength - value);

    const originalValues = new Uint8Array(this.dataView.buffer, value);
    const slicedValues = new Uint8Array(slicedInstruction.dataView.buffer);
    slicedValues.set(originalValues);

    return slicedInstruction;
  }
}
