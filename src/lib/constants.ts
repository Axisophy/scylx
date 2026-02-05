import type { HullType } from '@/types/hull';

// Physical constants
export const RHO_SEAWATER = 1025; // kg/m³ - seawater density
export const RHO_FRESHWATER = 1000; // kg/m³ - freshwater density
export const GRAVITY = 9.81; // m/s²
export const KINEMATIC_VISCOSITY = 1.19e-6; // m²/s - seawater at 15°C

// Conversion factors
export const METERS_TO_FEET = 3.28084;
export const KNOTS_TO_MS = 0.514444;
export const WATTS_TO_HP = 745.7;

// Hull weight estimates (kg)
export const HULL_WEIGHT = 150; // Base hull weight for plywood construction
export const ENGINE_WEIGHT_PER_HP = 2.5; // Approximate kg per hp for outboards

// Block coefficients by hull type
// CB = displaced volume / (L × B × T)
export const BLOCK_COEFFICIENTS: Record<HullType, number> = {
  'flat-bottom': 0.78,
  'single-chine': 0.60,
  'multi-chine': 0.55,
  'round-bilge': 0.52,
};

// Prismatic coefficients for wave resistance calculation
export const PRISMATIC_COEFFICIENTS: Record<HullType, number> = {
  'flat-bottom': 0.72,
  'single-chine': 0.62,
  'multi-chine': 0.58,
  'round-bilge': 0.55,
};

// Fuel and water density (kg/L)
export const FUEL_DENSITY = 0.85; // Diesel/petrol approximate
export const WATER_DENSITY = 1.0; // Fresh water

// Engine weights by type (base weight + per HP factor)
export const ENGINE_WEIGHTS: Record<string, { base: number; perHP: number }> = {
  outboard: { base: 20, perHP: 2.0 },
  inboard: { base: 60, perHP: 3.5 },
  sterndrive: { base: 80, perHP: 3.0 },
  electric: { base: 30, perHP: 4.0 }, // Includes battery weight estimate
};

// Stability thresholds (GM in meters)
export const GM_THRESHOLDS = {
  stiff: 1.0,     // GM > 1.0m
  moderate: 0.5,   // GM > 0.5m
  tender: 0.3,     // GM > 0.3m
  // dangerous: GM < 0.3m
};

// Froude number thresholds for speed regimes
export const FROUDE_THRESHOLDS = {
  displacement: 0.35,  // Below this: displacement mode
  transition: 0.50,    // Transition zone
  planing: 0.60,       // Above this: planing possible
};

// Crouch constant for planing speed estimation
export const CROUCH_CONSTANT = 150; // For moderate planing hulls

// Speed-length ratio threshold for planing
export const SLR_PLANING_THRESHOLD = 2.5;

// Center of gravity height factors
// These approximate the vertical position of mass items relative to keel
export const CG_HEIGHT_FACTORS = {
  hull: 0.4,      // Hull CG at 40% of depth
  engine: 0.3,    // Engine CG at 30% of depth (transom-mounted)
  crew: 0.5,      // Crew CG at 50% of depth (seated)
  cargo: 0.35,    // Cargo CG at 35% of depth (low in hull)
  // Ballast uses explicit ballastHeight parameter
};
