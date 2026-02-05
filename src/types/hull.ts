// Hull type variants
export type HullType = 'flat-bottom' | 'single-chine' | 'multi-chine' | 'round-bilge';

// Bow configuration options
export type BowType = 'plumb' | 'raked' | 'reverse' | 'spoon' | 'clipper';

// Stern configuration options
export type SternType = 'transom' | 'canoe' | 'double-ended' | 'sugar-scoop';

// Deadrise variation along hull
export type DeadriseVariation = 'constant' | 'increasing-aft' | 'decreasing-aft';

// Ballast configuration options
export type BallastType = 'none' | 'jerry-cans' | 'fixed' | 'water';

// Engine type options
export type EngineType = 'outboard' | 'inboard' | 'sterndrive' | 'electric';

// Stability assessment rating
export type StabilityRating = 'stiff' | 'moderate' | 'tender' | 'dangerous';

// User-adjustable hull parameters
export interface HullParams {
  // Dimensions (meters) - EXTENDED RANGES
  lwl: number;      // Waterline length [5.0-10.0]
  beam: number;     // Maximum beam [1.2-2.8]
  depth: number;    // Hull depth [0.5-1.4]

  // Hull form
  hullType: HullType;
  deadrise: number;              // Degrees [0-30]
  deadriseVariation: DeadriseVariation;

  // Bow configuration
  bowType: BowType;
  bowRake: number;               // Degrees from vertical [-15 to +30]
  bowFlare: number;              // Degrees of flare at bow [0-25]

  // Stern configuration
  sternType: SternType;
  transomRake: number;           // Degrees from vertical [0-20]
  transomImmersion: number;      // Percentage of transom below waterline [0-100]

  // Hull form refinements
  prismaticCoefficient: number;  // Cp [0.50-0.70]
  lcb: number;                   // Longitudinal centre of buoyancy [45-55% from bow]
  rocker: number;                // Keel curvature [0-0.3m]

  // Chine configuration (for chined hulls)
  chineHeight: number;           // Height of chine above keel [0.1-0.5 x depth]
  chineAngle: number;            // Spray rail angle [0-15 degrees]

  // Loading (kg) - EXTENDED
  crewWeight: number;            // [60-400]
  cargoWeight: number;           // [0-500]
  ballastType: BallastType;
  ballastWeight: number;         // [0-150]
  ballastHeight: number;         // Height above keel [0.05-0.3]
  fuelCapacity: number;          // Litres [20-200]
  waterCapacity: number;         // Litres [20-100]

  // Power - EXTENDED
  engineHP: number;              // [10-60]
  engineType: EngineType;
  propellerDiameter: number;     // Inches [8-16]
  propellerPitch: number;        // Inches [6-20]
}

// Point on resistance curve
export interface ResistancePoint {
  speed: number;        // knots
  Rf: number;           // Frictional resistance (N)
  Rw: number;           // Wave-making resistance (N)
  Rtotal: number;       // Total resistance (N)
  powerRequired: number; // hp
}

// Point on righting arm curve
export interface RightingPoint {
  heelAngle: number; // degrees
  GZ: number;        // righting arm (m)
}

// Computed physics results
export interface PhysicsResults {
  // Displacement & draft
  displacement: number; // kg - total weight
  draft: number;        // m - depth below waterline
  freeboard: number;    // m - height above waterline

  // Stability metrics
  KB: number;           // m - keel to centre of buoyancy
  BM: number;           // m - buoyancy metacentre radius
  KG: number;           // m - keel to centre of gravity
  GM: number;           // m - metacentric height
  stabilityRating: StabilityRating;

  // Speed metrics
  hullSpeed: number;        // knots - theoretical max displacement speed
  froudeNumber: number;     // dimensionless
  maxSpeed: number;         // knots - achievable with engine
  planingCapable: boolean;  // whether hull can plane
  speedLengthRatio: number; // V / sqrt(LWL)

  // Bow/stern effects
  effectiveLWL: number;     // m - adjusted for bow type
  waveResistanceFactor: number;
  pitchingFactor: number;
  sprayDeflection: number;

  // Curves for visualization
  resistanceCurve: ResistancePoint[];
  rightingCurve: RightingPoint[];
}

// Parameter bounds for validation and UI
export interface ParamBounds {
  min: number;
  max: number;
  step: number;
  unit: string;
}

// Numeric parameters that have bounds
type NumericParamKeys =
  | 'lwl' | 'beam' | 'depth' | 'deadrise'
  | 'bowRake' | 'bowFlare' | 'transomRake' | 'transomImmersion'
  | 'prismaticCoefficient' | 'lcb' | 'rocker'
  | 'chineHeight' | 'chineAngle'
  | 'crewWeight' | 'cargoWeight' | 'ballastWeight' | 'ballastHeight'
  | 'fuelCapacity' | 'waterCapacity'
  | 'engineHP' | 'propellerDiameter' | 'propellerPitch';

export const PARAM_BOUNDS: Record<NumericParamKeys, ParamBounds> = {
  // Dimensions - extended ranges
  lwl: { min: 5.0, max: 10.0, step: 0.1, unit: 'm' },
  beam: { min: 1.2, max: 2.8, step: 0.05, unit: 'm' },
  depth: { min: 0.5, max: 1.4, step: 0.02, unit: 'm' },

  // Hull form
  deadrise: { min: 0, max: 30, step: 1, unit: '°' },

  // Bow configuration
  bowRake: { min: -15, max: 30, step: 1, unit: '°' },
  bowFlare: { min: 0, max: 25, step: 1, unit: '°' },

  // Stern configuration
  transomRake: { min: 0, max: 20, step: 1, unit: '°' },
  transomImmersion: { min: 0, max: 100, step: 5, unit: '%' },

  // Hull form refinements
  prismaticCoefficient: { min: 0.50, max: 0.70, step: 0.01, unit: '' },
  lcb: { min: 45, max: 55, step: 0.5, unit: '%' },
  rocker: { min: 0, max: 0.3, step: 0.01, unit: 'm' },

  // Chine configuration
  chineHeight: { min: 0.1, max: 0.5, step: 0.02, unit: '×D' },
  chineAngle: { min: 0, max: 15, step: 1, unit: '°' },

  // Loading - extended
  crewWeight: { min: 60, max: 400, step: 10, unit: 'kg' },
  cargoWeight: { min: 0, max: 500, step: 10, unit: 'kg' },
  ballastWeight: { min: 0, max: 150, step: 5, unit: 'kg' },
  ballastHeight: { min: 0.05, max: 0.3, step: 0.01, unit: 'm' },
  fuelCapacity: { min: 20, max: 200, step: 10, unit: 'L' },
  waterCapacity: { min: 20, max: 100, step: 5, unit: 'L' },

  // Power - extended
  engineHP: { min: 10, max: 60, step: 1, unit: 'hp' },
  propellerDiameter: { min: 8, max: 16, step: 0.5, unit: 'in' },
  propellerPitch: { min: 6, max: 20, step: 0.5, unit: 'in' },
};

// Hull type options for select dropdown
export const HULL_TYPE_OPTIONS: { value: HullType; label: string }[] = [
  { value: 'flat-bottom', label: 'Flat Bottom' },
  { value: 'single-chine', label: 'Single Chine' },
  { value: 'multi-chine', label: 'Multi Chine' },
  { value: 'round-bilge', label: 'Round Bilge' },
];

// Bow type options
export const BOW_TYPE_OPTIONS: { value: BowType; label: string; description: string }[] = [
  { value: 'plumb', label: 'Plumb', description: 'Vertical stem, max waterline length' },
  { value: 'raked', label: 'Raked', description: 'Traditional forward-angled stem' },
  { value: 'reverse', label: 'Reverse/Axe', description: 'Wave-piercing, less pitching' },
  { value: 'spoon', label: 'Spoon', description: 'Classic workboat, soft entry' },
  { value: 'clipper', label: 'Clipper', description: 'Concave, classic yacht' },
];

// Stern type options
export const STERN_TYPE_OPTIONS: { value: SternType; label: string; description: string }[] = [
  { value: 'transom', label: 'Transom', description: 'Flat stern, best for outboards' },
  { value: 'canoe', label: 'Canoe', description: 'Pointed, excellent following seas' },
  { value: 'double-ended', label: 'Double-Ended', description: 'Symmetric, ultimate seaworthiness' },
  { value: 'sugar-scoop', label: 'Sugar Scoop', description: 'Stepped platform, easy boarding' },
];

// Deadrise variation options
export const DEADRISE_VARIATION_OPTIONS: { value: DeadriseVariation; label: string }[] = [
  { value: 'constant', label: 'Constant' },
  { value: 'increasing-aft', label: 'Increasing Aft' },
  { value: 'decreasing-aft', label: 'Decreasing Aft' },
];

// Ballast type options for select dropdown
export const BALLAST_TYPE_OPTIONS: { value: BallastType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'jerry-cans', label: 'Jerry Cans' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'water', label: 'Water Ballast' },
];

// Engine type options
export const ENGINE_TYPE_OPTIONS: { value: EngineType; label: string }[] = [
  { value: 'outboard', label: 'Outboard' },
  { value: 'inboard', label: 'Inboard' },
  { value: 'sterndrive', label: 'Sterndrive' },
  { value: 'electric', label: 'Electric' },
];

// Bow type physics factors
export function getBowFactors(bowType: BowType, bowRake: number) {
  const factors = {
    plumb: { lwlEfficiency: 1.0, waveResistance: 1.0, pitching: 1.1, spray: 0.7 },
    raked: { lwlEfficiency: 0.92 - (bowRake * 0.002), waveResistance: 0.95, pitching: 1.0, spray: 1.0 },
    reverse: { lwlEfficiency: 1.02, waveResistance: 0.85, pitching: 0.75, spray: 0.5 },
    spoon: { lwlEfficiency: 0.95, waveResistance: 0.92, pitching: 0.95, spray: 0.9 },
    clipper: { lwlEfficiency: 0.90, waveResistance: 0.93, pitching: 0.98, spray: 1.1 },
  };
  return factors[bowType];
}

// Stern type physics factors
export function getSternFactors(sternType: SternType) {
  const factors = {
    transom: { followingSea: 0.8, transomDrag: 1.0, planing: 1.0 },
    canoe: { followingSea: 1.0, transomDrag: 0.7, planing: 0.3 },
    'double-ended': { followingSea: 1.0, transomDrag: 0.7, planing: 0.2 },
    'sugar-scoop': { followingSea: 0.75, transomDrag: 1.1, planing: 0.95 },
  };
  return factors[sternType];
}
