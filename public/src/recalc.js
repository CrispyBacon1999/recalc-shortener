/**
 * ReCalc-specific URL encoding and decoding.
 * 
 * V2 encoding uses per-calculator parameter schemas to avoid storing
 * parameter names entirely. This saves hundreds of bytes on complex URLs.
 */

import { BinaryWriter, BinaryReader } from './codec.js';
import { compress, decompress, base64UrlEncode, base64UrlDecode } from './compress.js';
import {
  PATHS, PARAM_SCHEMAS, UNITS, MOTORS, COMPRESSORS, CHAINS, RATIO_TYPES, STARTING_BORES,
  PATH_TO_IDX, UNIT_TO_IDX, MOTOR_TO_IDX, COMPRESSOR_TO_IDX,
  CHAIN_TO_IDX, RATIO_TYPE_TO_IDX, STARTING_BORE_TO_IDX,
  TYPE, VERSION
} from './config.js';

// ============================================================================
// Encoding
// ============================================================================

function encodeValue(writer, val) {
  if (val === undefined) {
    writer.writeByte(TYPE.MISSING);
    return;
  }
  
  if (val === null) {
    writer.writeByte(TYPE.NULL);
    return;
  }

  if (typeof val === 'boolean') {
    writer.writeByte(val ? TYPE.BOOL_TRUE : TYPE.BOOL_FALSE);
    return;
  }

  if (typeof val === 'number') {
    if (Number.isInteger(val) && val >= 0 && val <= 255) {
      writer.writeByte(TYPE.UINT8);
      writer.writeByte(val);
    } else if (Number.isInteger(val) && val >= 0 && val <= 65535) {
      writer.writeByte(TYPE.UINT16);
      writer.writeUint16(val);
    } else if (Number.isInteger(val)) {
      writer.writeByte(TYPE.INT);
      writer.writeVarInt(val);
    } else {
      writer.writeByte(TYPE.FLOAT);
      writer.writeString(minimalFloat(val));
    }
    return;
  }

  if (typeof val === 'string') {
    // Check if it's a known starting bore
    const boreIdx = STARTING_BORE_TO_IDX[val];
    if (boreIdx !== undefined) {
      writer.writeByte(TYPE.STARTING_BORE);
      writer.writeByte(boreIdx);
      return;
    }
    writer.writeByte(TYPE.STRING);
    writer.writeString(val);
    return;
  }

  if (Array.isArray(val)) {
    // Check for ratio pairs format [[n,n], ...]
    if (val.length > 0 && Array.isArray(val[0]) && val[0].length === 2) {
      writer.writeByte(TYPE.PAIRS);
      writer.writeVarUint(val.length);
      for (const [a, b] of val) {
        writer.writeVarUint(a);
        writer.writeVarUint(b);
      }
      return;
    }
    
    writer.writeByte(TYPE.ARRAY);
    writer.writeVarUint(val.length);
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
        writer.writeNumber(val.s);
        writer.writeByte(unitIdx);
        return;
      }
    }

    // Motor: {"quantity": n, "name": "motor"}
    if (keys.length === 2 && 'quantity' in val && 'name' in val) {
      const motorIdx = MOTOR_TO_IDX[val.name];
      if (motorIdx !== undefined) {
        writer.writeByte(TYPE.MOTOR);
        writer.writeByte(val.quantity);  // Usually 1-8
        writer.writeByte(motorIdx);
        return;
      }
    }

    // Ratio: {"magnitude": n, "ratioType": "..."}
    if (keys.length === 2 && 'magnitude' in val && 'ratioType' in val) {
      const ratioIdx = RATIO_TYPE_TO_IDX[val.ratioType];
      if (ratioIdx !== undefined) {
        writer.writeByte(TYPE.RATIO);
        writer.writeNumber(val.magnitude);
        writer.writeByte(ratioIdx);
        return;
      }
    }

    // Compressor: {"name": "compressor"}
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

    // Ratio pairs wrapper: {"pairs": [[n,n], ...]}
    if (keys.length === 1 && 'pairs' in val && Array.isArray(val.pairs)) {
      writer.writeByte(TYPE.PAIRS);
      writer.writeVarUint(val.pairs.length);
      for (const [a, b] of val.pairs) {
        writer.writeVarUint(a);
        writer.writeVarUint(b);
      }
      return;
    }

    // Generic object
    writer.writeByte(TYPE.OBJECT);
    writer.writeVarUint(keys.length);
    for (const key of keys) {
      writer.writeString(key);
      encodeValue(writer, val[key]);
    }
  }
}

function encodePistons(writer, pistons) {
  writer.writeVarUint(pistons.length);
  for (const p of pistons) {
    writer.writeString(p.name);
    writer.writeByte(p.quantity);
    encodeValue(writer, p.bore);
    encodeValue(writer, p.rodDiameter);
    encodeValue(writer, p.strokeLength);
    encodeValue(writer, p.retractPressure);
    encodeValue(writer, p.extendPressure);
    writer.writeByte(p.enabled ? 1 : 0);
    encodeValue(writer, p.period);
  }
}

// ============================================================================
// Decoding
// ============================================================================

function decodeValue(reader) {
  const type = reader.readByte();

  switch (type) {
    case TYPE.MISSING: return undefined;
    case TYPE.NULL: return null;
    case TYPE.BOOL_FALSE: return false;
    case TYPE.BOOL_TRUE: return true;
    case TYPE.UINT8: return reader.readByte();
    case TYPE.UINT16: return reader.readUint16();
    case TYPE.INT: return reader.readVarInt();
    case TYPE.FLOAT: return parseFloat(reader.readString());
    case TYPE.STRING: return reader.readString();
    case TYPE.STARTING_BORE: return STARTING_BORES[reader.readByte()];

    case TYPE.UNIT_VALUE: {
      const s = reader.readNumber();
      const u = UNITS[reader.readByte()];
      return { s, u };
    }

    case TYPE.MOTOR: {
      const quantity = reader.readByte();
      const name = MOTORS[reader.readByte()];
      return { quantity, name };
    }

    case TYPE.RATIO: {
      const magnitude = reader.readNumber();
      const ratioType = RATIO_TYPES[reader.readByte()];
      return { magnitude, ratioType };
    }

    case TYPE.COMPRESSOR:
      return { name: COMPRESSORS[reader.readByte()] };

    case TYPE.CHAIN:
      return { name: CHAINS[reader.readByte()] };

    case TYPE.ARRAY: {
      const len = reader.readVarUint();
      const arr = [];
      for (let i = 0; i < len; i++) {
        arr.push(decodeValue(reader));
      }
      return arr;
    }

    case TYPE.OBJECT: {
      const len = reader.readVarUint();
      const obj = {};
      for (let i = 0; i < len; i++) {
        const key = reader.readString();
        obj[key] = decodeValue(reader);
      }
      return obj;
    }

    case TYPE.PISTONS:
      return { pistons: decodePistons(reader) };

    case TYPE.PAIRS: {
      const len = reader.readVarUint();
      const pairs = [];
      for (let i = 0; i < len; i++) {
        pairs.push([reader.readVarUint(), reader.readVarUint()]);
      }
      return { pairs };
    }

    default:
      throw new Error(`Unknown type marker: ${type}`);
  }
}

function decodePistons(reader) {
  const count = reader.readVarUint();
  const pistons = [];
  for (let i = 0; i < count; i++) {
    pistons.push({
      name: reader.readString(),
      quantity: reader.readByte(),
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

// ============================================================================
// URL Encoding (Schema-based)
// ============================================================================

/**
 * Encode a ReCalc URL to binary format.
 */
export function encodeRecalcUrl(url) {
  const u = new URL(url);

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

  // Parse parameters
  const params = {};
  for (const [key, value] of u.searchParams) {
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = /^\d+$/.test(value) ? parseInt(value, 10) :
               /^\d+\.\d+$/.test(value) ? parseFloat(value) : value;
    }
    params[key] = parsed;
  }

  // Get schema for this calculator
  const schema = PARAM_SCHEMAS[path];
  
  if (schema) {
    // Schema-based encoding: values in order, no keys
    const extraParams = {};
    
    for (const key of schema) {
      encodeValue(writer, params[key]);  // undefined → MISSING
    }
    
    // Check for any extra parameters not in schema
    for (const key of Object.keys(params)) {
      if (!schema.includes(key)) {
        extraParams[key] = params[key];
      }
    }
    
    // Write extra parameters count and data
    const extraKeys = Object.keys(extraParams);
    writer.writeVarUint(extraKeys.length);
    for (const key of extraKeys) {
      writer.writeString(key);
      encodeValue(writer, extraParams[key]);
    }
  } else {
    // Fallback: key-value encoding for unknown calculators
    const keys = Object.keys(params).sort();
    writer.writeVarUint(keys.length);
    for (const key of keys) {
      writer.writeString(key);
      encodeValue(writer, params[key]);
    }
  }

  return writer.toUint8Array();
}

/**
 * Decode binary format back to a ReCalc URL.
 */
export function decodeRecalcUrl(bytes) {
  const reader = new BinaryReader(bytes);

  const version = reader.readByte();
  if (version !== VERSION) {
    throw new Error(`Unsupported encoding version: ${version}`);
  }

  const pathIdx = reader.readByte();
  const path = PATHS[pathIdx];
  if (!path) {
    throw new Error(`Unknown path index: ${pathIdx}`);
  }

  const searchParams = new URLSearchParams();
  const schema = PARAM_SCHEMAS[path];

  if (schema) {
    // Schema-based decoding
    for (const key of schema) {
      const val = decodeValue(reader);
      if (val !== undefined) {
        setParam(searchParams, key, val);
      }
    }
    
    // Read extra parameters
    const extraCount = reader.readVarUint();
    for (let i = 0; i < extraCount; i++) {
      const key = reader.readString();
      const val = decodeValue(reader);
      setParam(searchParams, key, val);
    }
  } else {
    // Key-value decoding
    const count = reader.readVarUint();
    for (let i = 0; i < count; i++) {
      const key = reader.readString();
      const val = decodeValue(reader);
      setParam(searchParams, key, val);
    }
  }

  const query = searchParams.toString();
  return `https://www.reca.lc/${path}${query ? '?' + query : ''}`;
}

function setParam(searchParams, key, val) {
  if (typeof val === 'object' && val !== null) {
    searchParams.set(key, JSON.stringify(val));
  } else if (typeof val === 'number' || typeof val === 'string') {
    searchParams.set(key, String(val));
  } else if (typeof val === 'boolean') {
    searchParams.set(key, val ? '1' : '0');
  }
}

// ============================================================================
// Public API
// ============================================================================

export async function shrinkUrl(longUrl) {
  const encoded = encodeRecalcUrl(longUrl);
  const compressed = await compress(encoded);
  return base64UrlEncode(compressed);
}

export async function expandUrl(token) {
  const compressed = base64UrlDecode(token);
  const encoded = await decompress(compressed);
  return decodeRecalcUrl(encoded);
}

// ============================================================================
// Helpers
// ============================================================================

function minimalFloat(f) {
  const s = String(f);
  for (let places = 1; places < 10; places++) {
    const rounded = f.toFixed(places);
    if (parseFloat(rounded) === f && rounded.length < s.length) {
      return rounded;
    }
  }
  return s;
}
