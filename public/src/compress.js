/**
 * Compression utilities.
 * 
 * Uses raw deflate (not gzip) to avoid header overhead.
 * For very small data, may skip compression if it doesn't help.
 */

/**
 * Compress bytes using raw deflate.
 * Returns uncompressed data if compression doesn't help.
 * 
 * Format: [flag byte] [data...]
 * - flag 0x00: data is uncompressed
 * - flag 0x01: data is deflate compressed
 */
export async function compress(bytes) {
  // Try deflate compression
  const stream = new CompressionStream('deflate');
  const blob = new Blob([bytes]);
  const compressed = blob.stream().pipeThrough(stream);
  const compressedBytes = new Uint8Array(await new Response(compressed).arrayBuffer());
  
  // Use compressed only if it's actually smaller (accounting for flag byte)
  if (compressedBytes.length < bytes.length) {
    const result = new Uint8Array(1 + compressedBytes.length);
    result[0] = 0x01;  // compressed flag
    result.set(compressedBytes, 1);
    return result;
  } else {
    const result = new Uint8Array(1 + bytes.length);
    result[0] = 0x00;  // uncompressed flag
    result.set(bytes, 1);
    return result;
  }
}

/**
 * Decompress bytes.
 */
export async function decompress(bytes) {
  const flag = bytes[0];
  const data = bytes.slice(1);
  
  if (flag === 0x00) {
    // Uncompressed
    return data;
  } else if (flag === 0x01) {
    // Deflate compressed
    const stream = new DecompressionStream('deflate');
    const blob = new Blob([data]);
    const decompressed = blob.stream().pipeThrough(stream);
    return new Uint8Array(await new Response(decompressed).arrayBuffer());
  } else {
    throw new Error(`Unknown compression flag: ${flag}`);
  }
}

/**
 * Encode bytes to URL-safe base64.
 */
export function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode URL-safe base64 to bytes.
 */
export function base64UrlDecode(s) {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
