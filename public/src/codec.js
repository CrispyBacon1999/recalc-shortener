/**
 * Binary encoding/decoding utilities.
 * 
 * Optimized for minimal byte usage:
 * - Variable-length integers
 * - Compact float encoding
 * - Fixed-size integers for common ranges
 */

export class BinaryWriter {
    constructor() {
        this.buffer = [];
    }

    writeByte(b) {
        this.buffer.push(b & 0xFF);
    }

    writeUint16(n) {
        this.buffer.push(n & 0xFF);
        this.buffer.push((n >> 8) & 0xFF);
    }

    /**
     * Variable-length unsigned integer.
     * 0-127: 1 byte, 128-16383: 2 bytes, etc.
     */
    writeVarUint(n) {
        while (n >= 0x80) {
            this.buffer.push((n & 0x7F) | 0x80);
            n >>>= 7;
        }
        this.buffer.push(n);
    }

    /**
     * Variable-length signed integer using zigzag encoding.
     */
    writeVarInt(n) {
        // Zigzag encode: (n << 1) ^ (n >> 31)
        const zigzag = n >= 0 ? n * 2 : (-n * 2) - 1;
        this.writeVarUint(zigzag);
    }

    /**
     * Write a number - uses smallest representation.
     */
    writeNumber(f) {
        if (Number.isInteger(f)) {
            if (f >= 0 && f <= 255) {
                this.writeByte(0x01);  // uint8
                this.writeByte(f);
            } else if (f >= 0 && f <= 65535) {
                this.writeByte(0x02);  // uint16
                this.writeUint16(f);
            } else {
                this.writeByte(0x03);  // varint
                this.writeVarInt(f);
            }
        } else {
            // Float - encode as minimal string
            this.writeByte(0x04);
            this.writeString(minimalFloat(f));
        }
    }

    writeString(s) {
        const encoded = new TextEncoder().encode(s);
        this.writeVarUint(encoded.length);
        for (const b of encoded) this.buffer.push(b);
    }

    toUint8Array() {
        return new Uint8Array(this.buffer);
    }
}

export class BinaryReader {
    constructor(bytes) {
        this.bytes = bytes;
        this.pos = 0;
    }

    readByte() {
        return this.bytes[this.pos++];
    }

    readUint16() {
        const lo = this.bytes[this.pos++];
        const hi = this.bytes[this.pos++];
        return lo | (hi << 8);
    }

    readVarUint() {
        let result = 0;
        let shift = 0;
        while (true) {
            const b = this.bytes[this.pos++];
            result |= (b & 0x7F) << shift;
            if ((b & 0x80) === 0) break;
            shift += 7;
        }
        return result;
    }

    readVarInt() {
        const zigzag = this.readVarUint();
        return (zigzag >>> 1) ^ -(zigzag & 1);
    }

    readNumber() {
        const type = this.readByte();
        switch (type) {
            case 0x01: return this.readByte();
            case 0x02: return this.readUint16();
            case 0x03: return this.readVarInt();
            case 0x04: return parseFloat(this.readString());
            default: throw new Error(`Unknown number type: ${type}`);
        }
    }

    readString() {
        const len = this.readVarUint();
        const bytes = this.bytes.slice(this.pos, this.pos + len);
        this.pos += len;
        return new TextDecoder().decode(bytes);
    }

    hasMore() {
        return this.pos < this.bytes.length;
    }
}

/**
 * Convert float to minimal string representation.
 */
export function minimalFloat(f) {
    const s = String(f);
    // Try to use fewer decimal places if possible
    for (let places = 1; places < 10; places++) {
        const rounded = f.toFixed(places);
        if (parseFloat(rounded) === f) {
            return rounded.length < s.length ? rounded : s;
        }
    }
    return s;
}
