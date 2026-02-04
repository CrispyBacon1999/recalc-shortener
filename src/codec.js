/**
 * Binary encoding/decoding utilities.
 * 
 * These classes handle efficient binary serialization using:
 * - Variable-length integers (small numbers use fewer bytes)
 * - Float encoding with automatic integer optimization
 * - UTF-8 string encoding with length prefix
 */

/**
 * Writes binary data to a buffer.
 */
export class BinaryWriter {
  constructor() {
    this.buffer = [];
  }

  writeByte(b) {
    this.buffer.push(b & 0xFF);
  }

  /**
   * Write a variable-length integer.
   * - 0-127: 1 byte
   * - 128-16383: 2 bytes
   * - 16384+: 3 bytes
   * - Negative: 0xFF prefix + absolute value
   */
  writeVarInt(n) {
    if (n < 0) {
      this.writeByte(0xFF);
      this.writeVarInt(-n);
    } else if (n < 128) {
      this.writeByte(n);
    } else if (n < 16384) {
      this.writeByte(0x80 | (n & 0x7F));
      this.writeByte(n >> 7);
    } else {
      this.writeByte(0x80 | (n & 0x7F));
      this.writeByte(0x80 | ((n >> 7) & 0x7F));
      this.writeByte(n >> 14);
    }
  }

  /**
   * Write a number, automatically choosing integer or float encoding.
   */
  writeFloat(f) {
    if (Number.isInteger(f) && f >= -32768 && f <= 32767) {
      this.writeByte(0x01); // integer marker
      this.writeVarInt(f);
    } else {
      this.writeByte(0x02); // float string marker
      this.writeString(String(f));
    }
  }

  /**
   * Write a UTF-8 string with length prefix.
   */
  writeString(s) {
    const encoded = new TextEncoder().encode(s);
    this.writeVarInt(encoded.length);
    for (const b of encoded) this.writeByte(b);
  }

  toUint8Array() {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Reads binary data from a buffer.
 */
export class BinaryReader {
  constructor(bytes) {
    this.bytes = bytes;
    this.pos = 0;
  }

  readByte() {
    return this.bytes[this.pos++];
  }

  readVarInt() {
    let b = this.readByte();
    if (b === 0xFF) return -this.readVarInt();
    if ((b & 0x80) === 0) return b;
    let result = b & 0x7F;
    b = this.readByte();
    if ((b & 0x80) === 0) return result | (b << 7);
    result |= (b & 0x7F) << 7;
    b = this.readByte();
    return result | (b << 14);
  }

  readFloat() {
    const marker = this.readByte();
    return marker === 0x01 ? this.readVarInt() : parseFloat(this.readString());
  }

  readString() {
    const len = this.readVarInt();
    const bytes = this.bytes.slice(this.pos, this.pos + len);
    this.pos += len;
    return new TextDecoder().decode(bytes);
  }

  hasMore() {
    return this.pos < this.bytes.length;
  }
}

