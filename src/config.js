/**
 * Configuration dictionaries for ReCalc URL compression.
 * 
 * IMPORTANT: Only APPEND to arrays. Never reorder or remove entries.
 * The index becomes the byte value for encoding.
 */

// Calculator paths (index → path name)
export const PATHS = [
  'flywheel',     // 0
  'belts',        // 1
  'chains',       // 2
  'pneumatics',   // 3
  'arm',          // 4
  'linear',       // 5
  'intake',       // 6
  'ratio',        // 7
  'ratioFinder',  // 8
  'drive',        // 9
  'gears',        // 10
];

/**
 * Parameter schemas per calculator.
 * 
 * When encoding, we store values in this exact order - NO KEYS NEEDED.
 * This saves hundreds of bytes on parameter names.
 * 
 * Format: Array of parameter names in canonical order.
 * Unknown parameters are encoded separately with keys.
 */
export const PARAM_SCHEMAS = {
  flywheel: [
    'currentLimit',
    'efficiency',
    'flywheelMomentOfInertia',
    'flywheelRadius',
    'flywheelRatio',
    'flywheelWeight',
    'motor',
    'motorRatio',
    'projectileRadius',
    'projectileWeight',
    'shooterMomentOfInertia',
    'shooterRadius',
    'shooterTargetSpeed',
    'shooterWeight',
    'useCustomFlywheelMoi',
    'useCustomShooterMoi',
  ],
  
  belts: [
    'customBeltTeeth',
    'desiredCenter',
    'extraCenter',
    'p1Teeth',
    'p2Teeth',
    'pitch',
    'toothIncrement',
    'useCustomBelt',
  ],
  
  chains: [
    'allowHalfLinks',
    'chain',
    'desiredCenter',
    'extraCenter',
    'p1Teeth',
    'p2Teeth',
  ],
  
  pneumatics: [
    'compressor',
    'pistons',
    'tankVolume',
  ],
  
  arm: [
    'armMass',
    'comLength',
    'currentLimit',
    'efficiency',
    'endAngle',
    'iterationLimit',
    'motor',
    'ratio',
    'startAngle',
  ],
  
  linear: [
    'angle',
    'currentLimit',
    'efficiency',
    'limitAcceleration',
    'limitDeceleration',
    'limitVelocity',
    'limitedAcceleration',
    'limitedDeceleration',
    'limitedVelocity',
    'load',
    'motor',
    'ratio',
    'spoolDiameter',
    'travelDistance',
  ],
  
  intake: [
    'drivetrainSpeed',
    'motor',
    'ratio',
    'rollerDiameter',
    'targetTimeToGoal',
    'travelDistance',
  ],
  
  ratio: [
    'ratioPairs',
  ],
  
  ratioFinder: [
    'enable12HexBore',
    'enable20DPGears',
    'enable25Chain',
    'enable32DPGears',
    'enable35Chain',
    'enable38HexBore',
    'enable550Pinions',
    'enable775Pinions',
    'enable875Bore',
    'enableAM',
    'enableBearingBore',
    'enableFalconPinions',
    'enableGT2',
    'enableHTD',
    'enableKrakenPinions',
    'enableMPs',
    'enableMaxSpline',
    'enableNEOPinions',
    'enableREV',
    'enableRT25',
    'enableSplineXL',
    'enableSports',
    'enableTTB',
    'enableVEX',
    'enableVPs',
    'enableVortexPinions',
    'enableWCP',
    'forceStartingPinionSize',
    'maxGearTeeth',
    'maxPulleyTeeth',
    'maxSprocketTeeth',
    'maxStages',
    'minGearTeeth',
    'minPulleyTeeth',
    'minSprocketTeeth',
    'minStages',
    'printablePulleys',
    'reductionError',
    'startingBore',
    'startingPinionSize',
    'targetReduction',
  ],
  
  drive: [
    'appliedVoltageRamp',
    'batteryAmpHours',
    'batteryResistance',
    'batteryVoltageAtRest',
    'efficiency',
    'filtering',
    'gearRatioMax',
    'gearRatioMin',
    'maxSimulationTime',
    'maxSpeedAccelerationThreshold',
    'motor',
    'motorCurrentLimit',
    'numCyclesPerMatch',
    'peakBatteryDischarge',
    'ratio',
    'sprintDistance',
    'swerve',
    'targetTimeToGoal',
    'throttleResponseMax',
    'throttleResponseMin',
    'weightAuxilliary',
    'weightDistributionFrontBack',
    'weightDistributionLeftRight',
    'weightInspected',
    'wheelBaseLength',
    'wheelBaseWidth',
    'wheelCOFDynamic',
    'wheelCOFLateral',
    'wheelCOFStatic',
    'wheelDiameter',
  ],
  
  gears: [
    'gear1Teeth',
    'gear2Teeth',
    'gearDP',
  ],
};

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
];

// Known FRC compressors
export const COMPRESSORS = [
  'VIAIR 90C (12V)',
  'VIAIR 250C-IG (12V)',
  'Thomas 405',
  'AndyMark 1.1 CFM',
];

// Chain types
export const CHAINS = [
  '#25',
  '#35',
];

// Ratio types
export const RATIO_TYPES = [
  'Reduction',
  'Step-up',
];

// Starting bore types (for ratioFinder)
export const STARTING_BORES = [
  'NEO',
  'Falcon',
  'Kraken',
  '550',
  '775',
  'CIM',
];

// Build reverse lookup maps
export const PATH_TO_IDX = Object.fromEntries(PATHS.map((p, i) => [p, i]));
export const UNIT_TO_IDX = Object.fromEntries(UNITS.map((u, i) => [u, i]));
export const MOTOR_TO_IDX = Object.fromEntries(MOTORS.map((m, i) => [m, i]));
export const COMPRESSOR_TO_IDX = Object.fromEntries(COMPRESSORS.map((c, i) => [c, i]));
export const CHAIN_TO_IDX = Object.fromEntries(CHAINS.map((c, i) => [c, i]));
export const RATIO_TYPE_TO_IDX = Object.fromEntries(RATIO_TYPES.map((r, i) => [r, i]));
export const STARTING_BORE_TO_IDX = Object.fromEntries(STARTING_BORES.map((b, i) => [b, i]));

// Type markers for binary encoding
export const TYPE = {
  MISSING: 0,         // Parameter not present (for schema-based encoding)
  NULL: 1,
  BOOL_FALSE: 2,
  BOOL_TRUE: 3,
  UINT8: 4,           // 0-255
  UINT16: 5,          // 0-65535
  INT: 6,             // Variable-length signed int
  FLOAT: 7,           // Float as string
  STRING: 8,
  UNIT_VALUE: 9,      // {"s": number, "u": "unit"}
  MOTOR: 10,          // {"quantity": n, "name": "motor"}
  RATIO: 11,          // {"magnitude": n, "ratioType": "..."}
  COMPRESSOR: 12,     // {"name": "compressor"}
  CHAIN: 13,          // {"name": "chain"}
  OBJECT: 14,         // Generic object
  ARRAY: 15,          // Array
  PISTONS: 16,        // Special pistons structure
  PAIRS: 17,          // Ratio pairs [[n,n], ...]
  STARTING_BORE: 18,  // Starting bore string
};

// Current encoding version
export const VERSION = 2;  // Bumped for schema-based encoding
