import type { HullParams } from '@/types/hull';

// Material densities and costs
const PLYWOOD_DENSITY = 600; // kg/m³ (marine grade)
const EPOXY_COVERAGE = 4; // m² per kg
const GLASS_WEIGHT = 0.45; // kg/m² for 200gsm cloth
const PLYWOOD_SHEET_SIZE = { width: 1.22, height: 2.44 }; // Standard 4x8 feet sheet
const PLYWOOD_THICKNESS = 0.006; // 6mm marine ply

// Approximate costs (USD, 2025 estimates)
const COSTS = {
  plywoodPerSheet: 85, // Marine grade
  epoxyPerKg: 45,
  glassPerM2: 12,
  copperPaint: 150, // Per litre
  hardwareBasic: 500,
  hardwarePremium: 1200,
};

// Build time estimates (hours per m² of hull surface)
const BUILD_HOURS = {
  cutting: 0.5,
  stitching: 1.0,
  taping: 0.8,
  glassing: 1.2,
  fairing: 2.0,
  painting: 0.5,
};

export interface MaterialsEstimate {
  // Plywood
  plywoodSheets: number;
  plywoodArea: number; // m²
  plywoodWeight: number; // kg

  // Epoxy and glass
  epoxyWeight: number; // kg
  glassArea: number; // m²
  glassWeight: number; // kg

  // Paint
  copperPaintLitres: number;

  // Costs
  plywoodCost: number;
  epoxyCost: number;
  glassCost: number;
  paintCost: number;
  hardwareCost: number;
  totalMaterialsCost: number;

  // Hull weight
  structureWeight: number; // kg
}

export interface BuildTimeEstimate {
  cuttingHours: number;
  stitchingHours: number;
  tapingHours: number;
  glassingHours: number;
  fairingHours: number;
  paintingHours: number;
  totalHours: number;
  weekends: number; // Assuming 8 hours per weekend day
}

export interface TrailerRequirements {
  boatWeight: number; // kg (structure + engine)
  loadedWeight: number; // kg (full displacement)
  trailerCapacity: number; // kg recommended
  trailerLength: number; // m
  beamWithTrailer: number; // m
  launchRampGrade: number; // degrees max
  towVehicleClass: string;
  registrationRequired: boolean;
}

export interface MooringCosts {
  swingingMooringAnnual: number;
  pileAnnual: number;
  marinaBerthAnnual: number;
  drySailAnnual: number;
}

/**
 * Estimate hull surface area for materials calculation
 */
export function estimateHullSurfaceArea(params: HullParams): number {
  const { lwl, beam, depth } = params;

  // Simplified wetted surface + topsides
  // Bottom panel (trapezoidal approximation)
  const bottomArea = lwl * beam * 0.85; // Allow for tapering

  // Side panels (2x)
  const sideArea = 2 * lwl * depth * 0.9;

  // Transom
  const transomArea = beam * depth * 0.5;

  // Deck and cockpit
  const deckArea = lwl * beam * 0.4; // Partial deck

  return bottomArea + sideArea + transomArea + deckArea;
}

/**
 * Calculate materials estimate for stitch-and-glue construction
 */
export function calculateMaterialsEstimate(params: HullParams): MaterialsEstimate {
  const surfaceArea = estimateHullSurfaceArea(params);

  // Plywood panels (1.3x surface area for nesting/waste)
  const plywoodArea = surfaceArea * 1.3;
  const sheetsNeeded = Math.ceil(
    plywoodArea / (PLYWOOD_SHEET_SIZE.width * PLYWOOD_SHEET_SIZE.height)
  );
  const plywoodWeight = plywoodArea * PLYWOOD_THICKNESS * PLYWOOD_DENSITY;

  // Epoxy (structural + coating)
  const epoxyWeight = surfaceArea / EPOXY_COVERAGE * 2.5; // Multiple coats

  // Fiberglass cloth (inside seams + bottom sheathing)
  const glassArea = surfaceArea * 0.8; // Not full coverage
  const glassWeight = glassArea * GLASS_WEIGHT;

  // Antifouling paint
  const copperPaintLitres = (params.lwl * params.beam * 0.6) / 8; // 8m²/litre

  // Costs
  const plywoodCost = sheetsNeeded * COSTS.plywoodPerSheet;
  const epoxyCost = epoxyWeight * COSTS.epoxyPerKg;
  const glassCost = glassArea * COSTS.glassPerM2;
  const paintCost = copperPaintLitres * COSTS.copperPaint;
  const hardwareCost = params.lwl > 7 ? COSTS.hardwarePremium : COSTS.hardwareBasic;

  const structureWeight = plywoodWeight + epoxyWeight + glassWeight;

  return {
    plywoodSheets: sheetsNeeded,
    plywoodArea,
    plywoodWeight,
    epoxyWeight,
    glassArea,
    glassWeight,
    copperPaintLitres,
    plywoodCost,
    epoxyCost,
    glassCost,
    paintCost,
    hardwareCost,
    totalMaterialsCost: plywoodCost + epoxyCost + glassCost + paintCost + hardwareCost,
    structureWeight,
  };
}

/**
 * Calculate build time estimate
 */
export function calculateBuildTime(params: HullParams): BuildTimeEstimate {
  const surfaceArea = estimateHullSurfaceArea(params);

  // Complexity factor based on hull type
  const complexityFactor =
    params.hullType === 'multi-chine' ? 1.3 :
    params.hullType === 'round-bilge' ? 1.5 :
    1.0;

  const cuttingHours = surfaceArea * BUILD_HOURS.cutting * complexityFactor;
  const stitchingHours = surfaceArea * BUILD_HOURS.stitching * complexityFactor;
  const tapingHours = surfaceArea * BUILD_HOURS.taping;
  const glassingHours = surfaceArea * BUILD_HOURS.glassing;
  const fairingHours = surfaceArea * BUILD_HOURS.fairing * complexityFactor;
  const paintingHours = surfaceArea * BUILD_HOURS.painting;

  const totalHours = cuttingHours + stitchingHours + tapingHours +
                     glassingHours + fairingHours + paintingHours;

  // Weekend build: 8 hours per weekend day (2 days)
  const weekends = Math.ceil(totalHours / 16);

  return {
    cuttingHours,
    stitchingHours,
    tapingHours,
    glassingHours,
    fairingHours,
    paintingHours,
    totalHours,
    weekends,
  };
}

/**
 * Calculate trailer requirements
 */
export function calculateTrailerRequirements(
  params: HullParams,
  displacement: number,
  structureWeight: number
): TrailerRequirements {
  // Engine weight estimate
  const engineWeight = params.engineHP * 2.5 + 40;
  const boatWeight = structureWeight + engineWeight;
  const loadedWeight = displacement;

  // Trailer needs 25% margin over boat weight
  const trailerCapacity = Math.ceil(boatWeight * 1.25 / 50) * 50;

  // Trailer length: boat length + 0.5m for roller/bunk overhang
  const trailerLength = params.lwl + 0.5;

  // Beam with trailer (add 0.3m for bunks/rollers)
  const beamWithTrailer = params.beam + 0.3;

  // Max ramp grade depends on loaded weight
  const launchRampGrade = loadedWeight < 500 ? 15 : loadedWeight < 800 ? 12 : 10;

  // Tow vehicle class
  const towVehicleClass =
    loadedWeight + trailerCapacity * 0.15 < 750 ? 'Small car' :
    loadedWeight + trailerCapacity * 0.15 < 1200 ? 'Medium SUV' :
    loadedWeight + trailerCapacity * 0.15 < 2000 ? 'Large SUV / Ute' :
    '4WD / Heavy tow vehicle';

  // Registration required over 750kg trailer capacity (varies by region)
  const registrationRequired = trailerCapacity > 750;

  return {
    boatWeight,
    loadedWeight,
    trailerCapacity,
    trailerLength,
    beamWithTrailer,
    launchRampGrade,
    towVehicleClass,
    registrationRequired,
  };
}

/**
 * Calculate annual mooring costs (approximate, varies by location)
 */
export function calculateMooringCosts(params: HullParams): MooringCosts {
  const lengthFactor = params.lwl / 6; // Normalize to 6m base

  return {
    swingingMooringAnnual: Math.round(800 * lengthFactor),
    pileAnnual: Math.round(1500 * lengthFactor),
    marinaBerthAnnual: Math.round(4000 * lengthFactor),
    drySailAnnual: Math.round(2500 * lengthFactor),
  };
}
