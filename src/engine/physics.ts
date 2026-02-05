import type { HullParams, PhysicsResults, ResistancePoint, RightingPoint, StabilityRating } from '@/types/hull';
import { getBowFactors, getSternFactors } from '@/types/hull';
import {
  RHO_SEAWATER,
  GRAVITY,
  KINEMATIC_VISCOSITY,
  METERS_TO_FEET,
  KNOTS_TO_MS,
  WATTS_TO_HP,
  HULL_WEIGHT,
  ENGINE_WEIGHT_PER_HP,
  BLOCK_COEFFICIENTS,
  PRISMATIC_COEFFICIENTS,
  GM_THRESHOLDS,
  CROUCH_CONSTANT,
  SLR_PLANING_THRESHOLD,
  CG_HEIGHT_FACTORS,
  FUEL_DENSITY,
  WATER_DENSITY,
  ENGINE_WEIGHTS,
} from '@/lib/constants';
import { degToRad, range } from '@/lib/utils';

/**
 * Calculate engine weight based on engine type
 */
export function calculateEngineWeight(params: HullParams): number {
  const engineType = params.engineType || 'outboard';
  const weights = ENGINE_WEIGHTS[engineType] || ENGINE_WEIGHTS.outboard;
  return weights.base + weights.perHP * params.engineHP;
}

/**
 * Calculate total displacement (weight in kg)
 * Includes hull, engine, crew, cargo, ballast, fuel, and water
 */
export function calculateDisplacement(params: HullParams): number {
  const engineWeight = calculateEngineWeight(params);
  const fuelWeight = (params.fuelCapacity || 50) * FUEL_DENSITY;
  const waterWeight = (params.waterCapacity || 40) * WATER_DENSITY;

  return (
    HULL_WEIGHT +
    engineWeight +
    params.crewWeight +
    params.cargoWeight +
    params.ballastWeight +
    fuelWeight +
    waterWeight
  );
}

/**
 * Calculate draft from displacement using block coefficient
 * T = Δ / (ρ × L × B × CB)
 */
export function calculateDraft(displacement: number, params: HullParams): number {
  const CB = BLOCK_COEFFICIENTS[params.hullType];
  const draft = displacement / (RHO_SEAWATER * params.lwl * params.beam * CB);
  return draft;
}

/**
 * Calculate freeboard (hull depth minus draft)
 */
export function calculateFreeboard(draft: number, depth: number): number {
  return depth - draft;
}

/**
 * Calculate centre of gravity height above keel (KG)
 * Weighted average of all mass components
 */
export function calculateKG(params: HullParams, draft: number): number {
  const displacement = calculateDisplacement(params);
  const engineWeight = calculateEngineWeight(params);
  const fuelWeight = (params.fuelCapacity || 50) * FUEL_DENSITY;
  const waterWeight = (params.waterCapacity || 40) * WATER_DENSITY;

  // Calculate weighted CG
  const hullCG = CG_HEIGHT_FACTORS.hull * params.depth;
  const engineCG = CG_HEIGHT_FACTORS.engine * params.depth;
  const crewCG = CG_HEIGHT_FACTORS.crew * params.depth;
  const cargoCG = CG_HEIGHT_FACTORS.cargo * params.depth;
  const ballastCG = params.ballastHeight; // Explicit height above keel
  const fuelCG = 0.25 * params.depth; // Fuel tanks typically low in hull
  const waterCG = 0.25 * params.depth; // Water tanks typically low in hull

  const weightedSum =
    HULL_WEIGHT * hullCG +
    engineWeight * engineCG +
    params.crewWeight * crewCG +
    params.cargoWeight * cargoCG +
    params.ballastWeight * ballastCG +
    fuelWeight * fuelCG +
    waterWeight * waterCG;

  return weightedSum / displacement;
}

/**
 * Calculate centre of buoyancy above keel (KB)
 * Simplified: KB ≈ 0.53 × T for typical hull forms
 */
export function calculateKB(draft: number): number {
  return 0.53 * draft;
}

/**
 * Calculate metacentric radius (BM)
 * BM = I / ∇ where I is waterplane second moment of area
 * I = (L × B³) / 12 for rectangular waterplane
 * ∇ = Δ / ρ (displaced volume)
 *
 * KEY INSIGHT: BM ∝ B³ (beam cubed)
 */
export function calculateBM(params: HullParams, displacement: number): number {
  // Waterplane second moment of area (rectangular approximation)
  const I = (params.lwl * Math.pow(params.beam, 3)) / 12;

  // Displaced volume
  const nabla = displacement / RHO_SEAWATER;

  // BM = I / ∇
  return I / nabla;
}

/**
 * Calculate metacentric height (GM)
 * GM = KB + BM - KG
 *
 * Positive GM = stable (rights itself when heeled)
 * Negative GM = unstable (capsizes)
 */
export function calculateGM(KB: number, BM: number, KG: number): number {
  return KB + BM - KG;
}

/**
 * Determine stability rating from GM value
 */
export function getStabilityRating(GM: number): StabilityRating {
  if (GM > GM_THRESHOLDS.stiff) return 'stiff';
  if (GM > GM_THRESHOLDS.moderate) return 'moderate';
  if (GM > GM_THRESHOLDS.tender) return 'tender';
  return 'dangerous';
}

/**
 * Calculate effective waterline length based on bow type
 * Different bow shapes provide different effective sailing lengths
 */
export function calculateEffectiveLWL(params: HullParams): number {
  const bowFactors = getBowFactors(params.bowType || 'plumb', params.bowRake || 0);
  return params.lwl * bowFactors.lwlEfficiency;
}

/**
 * Calculate wave resistance factor from bow/stern configuration
 */
export function calculateWaveResistanceFactor(params: HullParams): number {
  const bowFactors = getBowFactors(params.bowType || 'plumb', params.bowRake || 0);
  const sternFactors = getSternFactors(params.sternType || 'transom');

  // Combine bow and stern effects
  return bowFactors.waveResistance * sternFactors.transomDrag;
}

/**
 * Calculate pitching tendency factor
 */
export function calculatePitchingFactor(params: HullParams): number {
  const bowFactors = getBowFactors(params.bowType || 'plumb', params.bowRake || 0);
  const sternFactors = getSternFactors(params.sternType || 'transom');

  // Pitching is affected by both bow entry and stern form
  return bowFactors.pitching * (1 + (1 - sternFactors.followingSea) * 0.2);
}

/**
 * Calculate spray deflection rating
 * Lower is better (less spray on deck)
 */
export function calculateSprayDeflection(params: HullParams): number {
  const bowFactors = getBowFactors(params.bowType || 'plumb', params.bowRake || 0);
  const flareEffect = 1 - (params.bowFlare || 0) * 0.02; // More flare = less spray

  return bowFactors.spray * flareEffect;
}

/**
 * Calculate theoretical hull speed (displacement mode limit)
 * V_hull = 1.34 × √(LWL_feet)
 * Uses effective LWL for more accurate prediction
 */
export function calculateHullSpeed(lwl: number): number {
  const lwlFeet = lwl * METERS_TO_FEET;
  return 1.34 * Math.sqrt(lwlFeet);
}

/**
 * Calculate Froude number
 * Fn = V / √(g × L)
 */
export function calculateFroudeNumber(speedKnots: number, lwl: number): number {
  const speedMS = speedKnots * KNOTS_TO_MS;
  return speedMS / Math.sqrt(GRAVITY * lwl);
}

/**
 * Estimate wetted surface area
 * Simplified approximation for planing hulls
 */
export function estimateWettedSurface(params: HullParams, draft: number): number {
  // Rough approximation: S ≈ L × (B + 2T) × coefficient
  // Coefficient varies by hull type
  const coefficients: Record<HullParams['hullType'], number> = {
    'flat-bottom': 0.85,
    'single-chine': 0.75,
    'multi-chine': 0.72,
    'round-bilge': 0.70,
  };
  const coefficient = coefficients[params.hullType] || 0.75;
  return params.lwl * (params.beam + 2 * draft) * coefficient;
}

/**
 * Calculate frictional resistance using ITTC 1957 correlation line
 * Cf = 0.075 / (log₁₀(Re) - 2)²
 */
export function calculateFrictionalResistance(
  speedMS: number,
  lwl: number,
  wettedSurface: number
): number {
  if (speedMS < 0.01) return 0;

  // Reynolds number
  const Re = (speedMS * lwl) / KINEMATIC_VISCOSITY;

  // Friction coefficient (ITTC 1957)
  const Cf = 0.075 / Math.pow(Math.log10(Re) - 2, 2);

  // Frictional resistance: Rf = 0.5 × ρ × V² × S × Cf
  return 0.5 * RHO_SEAWATER * speedMS * speedMS * wettedSurface * Cf;
}

/**
 * Calculate wave-making resistance using Havelock approximation
 * Increases dramatically as Froude number approaches 0.4-0.5
 * Now uses user-specified prismatic coefficient and bow/stern effects
 */
export function calculateWaveResistance(
  speedMS: number,
  lwl: number,
  wettedSurface: number,
  params: HullParams
): number {
  if (speedMS < 0.01) return 0;

  // Use effective LWL for Froude number calculation
  const effectiveLWL = calculateEffectiveLWL(params);
  const Fn = speedMS / Math.sqrt(GRAVITY * effectiveLWL);

  // Use user-specified prismatic coefficient, or fall back to hull type default
  const Cp = params.prismaticCoefficient || PRISMATIC_COEFFICIENTS[params.hullType];

  // Get wave resistance factor from bow/stern configuration
  const waveResFactor = calculateWaveResistanceFactor(params);

  // Wave-making coefficient (empirical)
  // Increases with Fn^4, scaled by prismatic coefficient
  const Cw = 0.001 * Math.pow(Fn, 4) * Cp * 10 * waveResFactor;

  // Wave resistance
  return 0.5 * RHO_SEAWATER * speedMS * speedMS * wettedSurface * Cw;
}

/**
 * Calculate resistance at a given speed
 */
export function calculateResistance(
  speedKnots: number,
  params: HullParams,
  draft: number
): ResistancePoint {
  const speedMS = speedKnots * KNOTS_TO_MS;
  const S = estimateWettedSurface(params, draft);
  const effectiveLWL = calculateEffectiveLWL(params);

  const Rf = calculateFrictionalResistance(speedMS, effectiveLWL, S);
  const Rw = calculateWaveResistance(speedMS, effectiveLWL, S, params);
  const Rtotal = Rf + Rw;

  // Power required: P = R × V (in watts), convert to hp
  const powerRequired = (Rtotal * speedMS) / WATTS_TO_HP;

  return {
    speed: speedKnots,
    Rf,
    Rw,
    Rtotal,
    powerRequired,
  };
}

/**
 * Generate full resistance curve from 0 to max speed
 */
export function calculateResistanceCurve(
  params: HullParams,
  draft: number,
  maxSpeed: number
): ResistancePoint[] {
  const curve: ResistancePoint[] = [];
  const speeds = range(0, Math.ceil(maxSpeed) + 2, 0.5);

  for (const speed of speeds) {
    curve.push(calculateResistance(speed, params, draft));
  }

  return curve;
}

/**
 * Estimate maximum achievable speed with given engine power
 * Uses Crouch's formula for planing estimation
 */
export function estimateMaxSpeed(
  params: HullParams,
  displacement: number,
  hullSpeed: number
): number {
  // Crouch's formula: V = C × √(SHP / Δ)
  // where Δ is displacement in pounds
  const displacementLbs = displacement * 2.20462;
  const planingSpeed = CROUCH_CONSTANT * Math.sqrt(params.engineHP / displacementLbs);

  // In reality, can't exceed planing speed estimate or practical limit
  // Return the lesser of Crouch speed and a reasonable max
  return Math.min(planingSpeed, hullSpeed * 1.5, 15);
}

/**
 * Determine if hull can achieve planing
 * Takes into account hull type and stern configuration
 */
export function canPlane(
  maxSpeed: number,
  params: HullParams
): boolean {
  const lwlFeet = params.lwl * METERS_TO_FEET;
  const slr = maxSpeed / Math.sqrt(lwlFeet);

  // Flat bottoms plane easier, vee hulls need more power
  let threshold = SLR_PLANING_THRESHOLD;
  if (params.hullType === 'flat-bottom') {
    threshold *= 0.9;
  } else if (params.hullType === 'round-bilge') {
    threshold *= 1.2; // Round bilge harder to plane
  }

  // Stern type affects planing ability
  const sternFactors = getSternFactors(params.sternType || 'transom');
  threshold /= sternFactors.planing; // Lower threshold = easier to plane

  return slr > threshold;
}

/**
 * Calculate speed-length ratio
 */
export function calculateSpeedLengthRatio(speedKnots: number, lwl: number): number {
  const lwlFeet = lwl * METERS_TO_FEET;
  return speedKnots / Math.sqrt(lwlFeet);
}

/**
 * Calculate righting arm (GZ) at given heel angle
 * For small angles: GZ ≈ GM × sin(θ)
 * For larger angles, B shifts outboard
 */
export function calculateGZ(
  heelAngle: number,
  GM: number,
  BM: number,
  KB: number,
  KG: number,
  beam: number
): number {
  const theta = degToRad(heelAngle);

  if (heelAngle < 15) {
    // Small angle approximation
    return GM * Math.sin(theta);
  }

  // Large angle approximation
  // As heel increases, the centre of buoyancy shifts outboard
  const buoyancyShift = BM * Math.sin(theta);
  const gravityArm = (KG - KB) * Math.sin(theta);

  return (buoyancyShift - gravityArm) * Math.cos(theta);
}

/**
 * Generate righting curve from 0 to 45 degrees
 */
export function calculateRightingCurve(
  GM: number,
  BM: number,
  KB: number,
  KG: number,
  beam: number
): RightingPoint[] {
  const curve: RightingPoint[] = [];
  const angles = range(0, 45, 1);

  for (const angle of angles) {
    curve.push({
      heelAngle: angle,
      GZ: calculateGZ(angle, GM, BM, KB, KG, beam),
    });
  }

  return curve;
}

/**
 * Master function: calculate all physics from hull parameters
 */
export function calculatePhysics(params: HullParams): PhysicsResults {
  // Displacement and draft
  const displacement = calculateDisplacement(params);
  const draft = calculateDraft(displacement, params);
  const freeboard = calculateFreeboard(draft, params.depth);

  // Stability
  const KB = calculateKB(draft);
  const BM = calculateBM(params, displacement);
  const KG = calculateKG(params, draft);
  const GM = calculateGM(KB, BM, KG);
  const stabilityRating = getStabilityRating(GM);

  // Bow/stern effects
  const effectiveLWL = calculateEffectiveLWL(params);
  const waveResistanceFactor = calculateWaveResistanceFactor(params);
  const pitchingFactor = calculatePitchingFactor(params);
  const sprayDeflection = calculateSprayDeflection(params);

  // Speed - use effective LWL for more accurate predictions
  const hullSpeed = calculateHullSpeed(effectiveLWL);
  const froudeNumber = calculateFroudeNumber(hullSpeed, effectiveLWL);
  const maxSpeed = estimateMaxSpeed(params, displacement, hullSpeed);
  const planingCapable = canPlane(maxSpeed, params);
  const speedLengthRatio = calculateSpeedLengthRatio(maxSpeed, params.lwl);

  // Curves
  const resistanceCurve = calculateResistanceCurve(params, draft, maxSpeed);
  const rightingCurve = calculateRightingCurve(GM, BM, KB, KG, params.beam);

  return {
    displacement,
    draft,
    freeboard,
    KB,
    BM,
    KG,
    GM,
    stabilityRating,
    hullSpeed,
    froudeNumber,
    maxSpeed,
    planingCapable,
    speedLengthRatio,
    effectiveLWL,
    waveResistanceFactor,
    pitchingFactor,
    sprayDeflection,
    resistanceCurve,
    rightingCurve,
  };
}
