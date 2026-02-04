/**
 * ReCalc-specific URL encoding and decoding.
 * 
 * This module handles the conversion between reca.lc URLs and our
 * compact binary format. It uses the dictionaries from config.js
 * to efficiently encode known values.
 */

import { BinaryWriter, BinaryReader } from './codec.js';
import { compress, decompress, base64UrlEncode, base64UrlDecode } from './compress.js';
import {
  PATHS, UNITS, MOTORS, COMPRESSORS, CHAINS, RATIO_TYPES,
  PATH_TO_IDX, UNIT_TO_IDX, MOTOR_TO_IDX, COMPRESSOR_TO_IDX,
  CHAIN_TO_IDX, RATIO_TYPE_TO_IDX,
  TYPE, VERSION
} from './config.js';

/**
 * Encode a JavaScript value to binary.
 */
function encodeValue(writer, val) {
  if (val === null || val === undefined) {
    writer.writeByte(TYPE.NULL);
    return;
  }

  if (typeof val === 'boolean') {
    writer.writeByte(val ? TYPE.BOOL_TRUE : TYPE.BOOL_FALSE);
    return;
  }

  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      writer.writeByte(TYPE.INT);
      writer.writeVarInt(val);
    } else {
      writer.writeByte(TYPE.FLOAT);
      writer.writeString(String(val));
    }
    return;
  }

  if (typeof val === 'string') {
    writer.writeByte(TYPE.STRING);
    writer.writeString(val);
    return;
  }

  if (Array.isArray(val)) {
    writer.writeByte(TYPE.ARRAY);
    writer.writeVarInt(val.length);
    for (const item of val) {
      encodeValue(writer, item);
    }
    return;
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val);

    // Unit value: {"s": number, "u": "unit"}
    if (keys.length === 2 && 's' in val && 'u' in val) {
      const unitIdx = UNIT_TO_IDX[val.u];
      if (unitIdx !== undefined) {
        writer.writeByte(TYPE.UNIT_VALUE);
        writer.writeFloat(val.s);
        writer.writeByte(unitIdx);
        return;
      }
    }

    // Motor: {"quantity": n, "name": "motor"}
    if (keys.length === 2 && 'quantity' in val && 'name' in val) {
      const motorIdx = MOTOR_TO_IDX[val.name];
      if (motorIdx !== undefined) {
        writer.writeByte(TYPE.MOTOR);
        writer.writeVarInt(val.quantity);
        writer.writeByte(motorIdx);
        return;
      }
    }

    // Ratio: {"magnitude": n, "ratioType": "..."}
    if (keys.length === 2 && 'magnitude' in val && 'ratioType' in val) {
      const ratioIdx = RATIO_TYPE_TO_IDX[val.ratioType];
      if (ratioIdx !== undefined) {
        writer.writeByte(TYPE.RATIO);
        writer.writeFloat(val.magnitude);
        writer.writeByte(ratioIdx);
        return;
      }
    }

    // Compressor or Chain: {"name": "..."}
    if (keys.length === 1 && 'name' in val) {
      const compIdx = COMPRESSOR_TO_IDX[val.name];
      if (compIdx !== undefined) {
        writer.writeByte(TYPE.COMPRESSOR);
        writer.writeByte(compIdx);
        return;
      }
      const chainIdx = CHAIN_TO_IDX[val.name];
      if (chainIdx !== undefined) {
        writer.writeByte(TYPE.CHAIN);
        writer.writeByte(chainIdx);
        return;
      }
    }

    // Pistons wrapper: {"pistons": [...]}
    if (keys.length === 1 && 'pistons' in val && Array.isArray(val.pistons)) {
      writer.writeByte(TYPE.PISTONS);
      encodePistons(writer, val.pistons);
      return;
    }

    // Ratio pairs: {"pairs": [[n,n], ...]}
    if (keys.length === 1 && 'pairs' in val && Array.isArray(val.pairs)) {
      writer.writeByte(TYPE.ARRAY);
      writer.writeVarInt(val.pairs.length);
      for (const pair of val.pairs) {
        writer.writeByte(TYPE.ARRAY);
        writer.writeVarInt(2);
        writer.writeByte(TYPE.INT);
        writer.writeVarInt(pair[0]);
        writer.writeByte(TYPE.INT);
        writer.writeVarInt(pair[1]);
      }
      return;
    }

    // Generic object
    writer.writeByte(TYPE.OBJECT);
    writer.writeVarInt(keys.length);
    for (const key of keys) {
      writer.writeString(key);
      encodeValue(writer, val[key]);
    }
    return;
  }

  // Fallback: string representation
  writer.writeByte(TYPE.STRING);
  writer.writeString(String(val));
}

function encodePistons(writer, pistons) {
  writer.writeVarInt(pistons.length);
  for (const p of pistons) {
    writer.writeString(p.name);
    writer.writeVarInt(p.quantity);
    encodeValue(writer, p.bore);
    encodeValue(writer, p.rodDiameter);
    encodeValue(writer, p.strokeLength);
    encodeValue(writer, p.retractPressure);
    encodeValue(writer, p.extendPressure);
    writer.writeByte(p.enabled ? 1 : 0);
    encodeValue(writer, p.period);
  }
}

/**
 * Decode a binary value back to JavaScript.
 */
function decodeValue(reader) {
  const type = reader.readByte();

  switch (type) {
    case TYPE.NULL: return null;
    case TYPE.BOOL_FALSE: return false;
    case TYPE.BOOL_TRUE: return true;
    case TYPE.INT: return reader.readVarInt();
    case TYPE.FLOAT: return parseFloat(reader.readString());
    case TYPE.STRING: return reader.readString();

    case TYPE.UNIT_VALUE: {
      const s = reader.readFloat();
      const u = UNITS[reader.readByte()];
      return { s, u };
    }

    case TYPE.MOTOR: {
      const quantity = reader.readVarInt();
      const name = MOTORS[reader.readByte()];
      return { quantity, name };
    }

    case TYPE.RATIO: {
      const magnitude = reader.readFloat();
      const ratioType = RATIO_TYPES[reader.readByte()];
      return { magnitude, ratioType };
    }

    case TYPE.COMPRESSOR:
      return { name: COMPRESSORS[reader.readByte()] };

    case TYPE.CHAIN:
      return { name: CHAINS[reader.readByte()] };

    case TYPE.ARRAY: {
      const len = reader.readVarInt();
      const arr = [];
      for (let i = 0; i < len; i++) {
        arr.push(decodeValue(reader));
      }
      return arr;
    }

    case TYPE.OBJECT: {
      const len = reader.readVarInt();
      const obj = {};
      for (let i = 0; i < len; i++) {
        const key = reader.readString();
        obj[key] = decodeValue(reader);
      }
      return obj;
    }

    case TYPE.PISTONS:
      return { pistons: decodePistons(reader) };

    default:
      throw new Error(`Unknown type marker: ${type}`);
  }
}

function decodePistons(reader) {
  const count = reader.readVarInt();
  const pistons = [];
  for (let i = 0; i < count; i++) {
    pistons.push({
      name: reader.readString(),
      quantity: reader.readVarInt(),
      bore: decodeValue(reader),
      rodDiameter: decodeValue(reader),
      strokeLength: decodeValue(reader),
      retractPressure: decodeValue(reader),
      extendPressure: decodeValue(reader),
      enabled: reader.readByte() === 1,
      period: decodeValue(reader),
    });
  }
  return pistons;
}

/**
 * Encode a ReCalc URL to binary format.
 * @param {string} url - Full reca.lc URL
 * @returns {Uint8Array} - Encoded binary data
 */
export function encodeRecalcUrl(url) {
  const u = new URL(url);

  // Validate domain
  if (!u.hostname.endsWith('reca.lc')) {
    throw new Error('Only reca.lc URLs are supported');
  }

  const writer = new BinaryWriter();

  // Version byte
  writer.writeByte(VERSION);

  // Path index
  const path = u.pathname.replace(/^\//, '');
  const pathIdx = PATH_TO_IDX[path];
  if (pathIdx === undefined) {
    throw new Error(`Unknown calculator type: ${path}`);
  }
  writer.writeByte(pathIdx);

  // Parse and encode query parameters
  const params = [];
  for (const [key, value] of u.searchParams) {
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      // Not JSON, keep as string or number
      parsed = /^\d+$/.test(value) ? parseInt(value, 10) :
               /^\d+\.\d+$/.test(value) ? parseFloat(value) : value;
    }
    params.push([key, parsed]);
  }

  // Sort params by key for consistency
  params.sort((a, b) => a[0].localeCompare(b[0]));

  // Write params
  writer.writeVarInt(params.length);
  for (const [key, val] of params) {
    writer.writeString(key);
    encodeValue(writer, val);
  }

  return writer.toUint8Array();
}

/**
 * Decode binary format back to a ReCalc URL.
 * @param {Uint8Array} bytes - Encoded binary data
 * @returns {string} - Full reca.lc URL
 */
export function decodeRecalcUrl(bytes) {
  const reader = new BinaryReader(bytes);

  // Version
  const version = reader.readByte();
  if (version !== VERSION) {
    throw new Error(`Unsupported encoding version: ${version}`);
  }

  // Path
  const pathIdx = reader.readByte();
  const path = PATHS[pathIdx];
  if (!path) {
    throw new Error(`Unknown path index: ${pathIdx}`);
  }

  // Params
  const paramCount = reader.readVarInt();
  const searchParams = new URLSearchParams();

  for (let i = 0; i < paramCount; i++) {
    const key = reader.readString();
    const val = decodeValue(reader);

    // Encode value back to URL format
    if (typeof val === 'object' && val !== null) {
      searchParams.set(key, JSON.stringify(val));
    } else if (typeof val === 'number' || typeof val === 'string') {
      searchParams.set(key, String(val));
    } else if (typeof val === 'boolean') {
      searchParams.set(key, val ? '1' : '0');
    }
  }

  const query = searchParams.toString();
  return `https://www.reca.lc/${path}${query ? '?' + query : ''}`;
}

/**
 * Shrink a ReCalc URL to a compact token.
 * @param {string} longUrl - Full reca.lc URL
 * @returns {Promise<string>} - Compressed base64url token
 */
export async function shrinkUrl(longUrl) {
  const encoded = encodeRecalcUrl(longUrl);
  const compressed = await compress(encoded);
  return base64UrlEncode(compressed);
}

/**
 * Expand a token back to a ReCalc URL.
 * @param {string} token - Compressed base64url token
 * @returns {Promise<string>} - Full reca.lc URL
 */
export async function expandUrl(token) {
  const compressed = base64UrlDecode(token);
  const encoded = await decompress(compressed);
  return decodeRecalcUrl(encoded);
}

