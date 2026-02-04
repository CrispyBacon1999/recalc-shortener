/**
 * Configuration dictionaries for ReCalc URL compression.
 * 
 * To add support for new calculators, units, motors, etc., simply add them
 * to the appropriate array below. The index in the array becomes the byte
 * value used for encoding, so:
 * 
 * - Only APPEND new entries (don't reorder or remove existing ones)
 * - Keep frequently used items near the beginning for documentation
 */

// Calculator paths (index → path name)
export const PATHS = [
  'flywheel',
  'belts', 
  'chains',
  'pneumatics',
  'arm',
  'linear',
  'intake',
  'ratio',
  'ratioFinder',
  'drive',
  'gears',
  // Add new calculator types here
];

// Common measurement units
export const UNITS = [
  'in',        // 0
  'mm',        // 1
  'lbs',       // 2
  'A',         // 3
  'rpm',       // 4
  'deg',       // 5
  'V',         // 6
  's',         // 7
  'psi',       // 8
  'ft/s',      // 9
  'in/s',      // 10
  'in/s2',     // 11
  'ft/s2',     // 12
  'V/s',       // 13
  'Ohm',       // 14
  'A*h',       // 15
  'cm3',       // 16
  'in2*lbs',   // 17
  'ft',        // 18
  'lbf',       // 19
  'm',         // 20
  'kg',        // 21
  'N',         // 22
  'Nm',        // 23
  // Add new units here
];

// Known FRC motors
export const MOTORS = [
  'Kraken X60',
  'Kraken X60 (FOC)',
  'Falcon 500',
  'Falcon 500 (FOC)',
  'NEO',
  'NEO Vortex',
  'NEO 550',
  'CIM',
  'Mini CIM',
  '775pro',
  'BAG',
  'AM 9015',
  'Snowblower',
  // Add new motors here
];

// Known FRC compressors
export const COMPRESSORS = [
  'VIAIR 90C (12V)',
  'VIAIR 250C-IG (12V)',
  'Thomas 405',
  'AndyMark 1.1 CFM',
  // Add new compressors here
];

// Chain types
export const CHAINS = [
  '#25',
  '#35',
  // Add new chain types here
];

// Ratio types
export const RATIO_TYPES = [
  'Reduction',
  'Step-up',
];

// Build reverse lookup maps for encoding
export const PATH_TO_IDX = Object.fromEntries(PATHS.map((p, i) => [p, i]));
export const UNIT_TO_IDX = Object.fromEntries(UNITS.map((u, i) => [u, i]));
export const MOTOR_TO_IDX = Object.fromEntries(MOTORS.map((m, i) => [m, i]));
export const COMPRESSOR_TO_IDX = Object.fromEntries(COMPRESSORS.map((c, i) => [c, i]));
export const CHAIN_TO_IDX = Object.fromEntries(CHAINS.map((c, i) => [c, i]));
export const RATIO_TYPE_TO_IDX = Object.fromEntries(RATIO_TYPES.map((r, i) => [r, i]));

// Type markers for binary encoding
export const TYPE = {
  NULL: 0,
  BOOL_FALSE: 1,
  BOOL_TRUE: 2,
  INT: 3,
  FLOAT: 4,
  STRING: 5,
  UNIT_VALUE: 6,      // {"s": number, "u": "unit"}
  MOTOR: 7,           // {"quantity": n, "name": "motor"}
  RATIO: 8,           // {"magnitude": n, "ratioType": "..."}
  COMPRESSOR: 9,      // {"name": "compressor"}
  CHAIN: 10,          // {"name": "chain"}
  OBJECT: 11,         // generic object
  ARRAY: 12,          // array
  PISTONS: 13,        // special pistons structure
};

// Current encoding version (increment when making breaking changes)
export const VERSION = 1;

