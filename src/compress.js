/**
 * Compression utilities using browser-native gzip.
 */

/**
 * Compress bytes using gzip.
 * @param {Uint8Array} bytes - Data to compress
 * @returns {Promise<Uint8Array>} - Compressed data
 */
export async function compress(bytes) {
  const stream = new CompressionStream('gzip');
  const blob = new Blob([bytes]);
  const compressed = blob.stream().pipeThrough(stream);
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

/**
 * Decompress gzip bytes.
 * @param {Uint8Array} bytes - Compressed data
 * @returns {Promise<Uint8Array>} - Decompressed data
 */
export async function decompress(bytes) {
  const stream = new DecompressionStream('gzip');
  const blob = new Blob([bytes]);
  const decompressed = blob.stream().pipeThrough(stream);
  return new Uint8Array(await new Response(decompressed).arrayBuffer());
}

/**
 * Encode bytes to URL-safe base64.
 * @param {Uint8Array} bytes - Data to encode
 * @returns {string} - Base64url string
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
 * @param {string} s - Base64url string
 * @returns {Uint8Array} - Decoded bytes
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

