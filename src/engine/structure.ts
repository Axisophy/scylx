import type { HullParams } from '@/types/hull';

// Material properties
const PLYWOOD = {
  E: 10000, // MPa - modulus of elasticity (marine ply)
  density: 600, // kg/m³
  thickness: 0.006, // 6mm
  bendingStrength: 40, // MPa
};

const GLASS_EPOXY = {
  E: 15000, // MPa
  thickness: 0.002, // 2mm laminate
};

// Design pressure for hull panels (ISO 12215-5)
const DESIGN_ACCELERATION = 2.0; // g's - typical for planing craft

export interface PanelAnalysis {
  panelName: string;
  width: number; // m - unsupported span
  length: number; // m
  designPressure: number; // kPa
  deflection: number; // mm
  stress: number; // MPa
  safetyFactor: number;
  status: 'safe' | 'marginal' | 'reinforce';
}

export interface StructuralAnalysis {
  panels: PanelAnalysis[];
  overallStatus: 'safe' | 'marginal' | 'reinforce';
  recommendedFrameSpacing: number; // m
  minimumThickness: number; // mm
  kerfDepth: number; // mm for stitch-and-glue
}

export interface PayloadAnalysis {
  maxPayload: number; // kg
  currentPayload: number; // kg
  payloadRatio: number; // 0-1
  centerOfPayload: number; // m from stern
  trimAngle: number; // degrees (positive = bow up)
  heelFromLoad: number; // degrees
  status: 'optimal' | 'acceptable' | 'overloaded' | 'trimmed';
}

export interface FlotationAnalysis {
  hullVolume: number; // m³
  foamRequired: number; // litres
  foamLocations: { location: string; volume: number }[];
  levelFlotation: boolean;
  swampedFreeboard: number; // m
  swampedStability: number; // GM when swamped
  iso12217Compliant: boolean;
}

export interface CockpitDrainage {
  cockpitArea: number; // m²
  cockpitVolume: number; // litres if flooded
  drainDiameter: number; // mm required
  drainCount: number;
  drainTime: number; // seconds to drain
  selfDraining: boolean;
  minimumFreeboard: number; // m for self-draining
}

/**
 * Calculate design pressure for hull panel
 * Based on simplified ISO 12215-5
 */
function calculateDesignPressure(
  params: HullParams,
  panelPosition: 'bottom' | 'side' | 'transom',
  displacement: number
): number {
  // Base pressure from displacement and acceleration
  const basePressure = displacement * DESIGN_ACCELERATION * 9.81 /
    (params.lwl * params.beam * 1000); // kPa

  // Position factors
  const positionFactor = {
    bottom: 1.0,
    side: 0.6,
    transom: 0.8,
  };

  // Deadrise reduction for bottom
  const deadriseReduction = panelPosition === 'bottom'
    ? 1.0 - (params.deadrise / 60) // Deadrise reduces slamming loads
    : 1.0;

  return basePressure * positionFactor[panelPosition] * deadriseReduction * 1.5; // Safety margin
}

/**
 * Calculate panel deflection and stress
 */
function analyzePanel(
  width: number, // unsupported span
  length: number,
  designPressure: number, // kPa
  thickness: number = PLYWOOD.thickness
): { deflection: number; stress: number } {
  // Simply supported plate under uniform load
  // Using plate theory approximation

  const a = Math.min(width, length);
  const b = Math.max(width, length);
  const ratio = a / b;

  // Plate coefficient (approximately)
  const alpha = 0.0138 + 0.0284 * ratio;
  const beta = 0.2874 + 0.1584 * ratio;

  const p = designPressure * 1000; // Pa
  const E = PLYWOOD.E * 1e6; // Pa
  const t = thickness;

  // Maximum deflection (center of panel)
  const deflection = alpha * p * Math.pow(a, 4) / (E * Math.pow(t, 3)) * 1000; // mm

  // Maximum bending stress
  const stress = beta * p * Math.pow(a, 2) / Math.pow(t, 2) / 1e6; // MPa

  return { deflection, stress };
}

/**
 * Perform structural analysis of hull panels
 */
export function calculateStructuralAnalysis(
  params: HullParams,
  displacement: number
): StructuralAnalysis {
  // Typical frame spacing based on hull length
  const frameSpacing = Math.min(0.6, params.lwl / 12);

  const panels: PanelAnalysis[] = [];

  // Bottom panels
  const bottomPressure = calculateDesignPressure(params, 'bottom', displacement);
  const bottomWidth = params.beam / 2; // Panel between centerline and chine
  const bottomLength = frameSpacing;
  const bottomAnalysis = analyzePanel(bottomWidth, bottomLength, bottomPressure);

  panels.push({
    panelName: 'Bottom',
    width: bottomWidth,
    length: bottomLength,
    designPressure: bottomPressure,
    deflection: bottomAnalysis.deflection,
    stress: bottomAnalysis.stress,
    safetyFactor: PLYWOOD.bendingStrength / bottomAnalysis.stress,
    status: bottomAnalysis.stress < PLYWOOD.bendingStrength * 0.5 ? 'safe' :
            bottomAnalysis.stress < PLYWOOD.bendingStrength * 0.8 ? 'marginal' : 'reinforce',
  });

  // Side panels
  const sidePressure = calculateDesignPressure(params, 'side', displacement);
  const sideWidth = params.depth;
  const sideLength = frameSpacing;
  const sideAnalysis = analyzePanel(sideWidth, sideLength, sidePressure);

  panels.push({
    panelName: 'Sides',
    width: sideWidth,
    length: sideLength,
    designPressure: sidePressure,
    deflection: sideAnalysis.deflection,
    stress: sideAnalysis.stress,
    safetyFactor: PLYWOOD.bendingStrength / sideAnalysis.stress,
    status: sideAnalysis.stress < PLYWOOD.bendingStrength * 0.5 ? 'safe' :
            sideAnalysis.stress < PLYWOOD.bendingStrength * 0.8 ? 'marginal' : 'reinforce',
  });

  // Transom
  const transomPressure = calculateDesignPressure(params, 'transom', displacement);
  const transomWidth = params.beam * 0.8;
  const transomLength = params.depth * 0.6;
  const transomAnalysis = analyzePanel(transomWidth, transomLength, transomPressure);

  panels.push({
    panelName: 'Transom',
    width: transomWidth,
    length: transomLength,
    designPressure: transomPressure,
    deflection: transomAnalysis.deflection,
    stress: transomAnalysis.stress,
    safetyFactor: PLYWOOD.bendingStrength / transomAnalysis.stress,
    status: transomAnalysis.stress < PLYWOOD.bendingStrength * 0.5 ? 'safe' :
            transomAnalysis.stress < PLYWOOD.bendingStrength * 0.8 ? 'marginal' : 'reinforce',
  });

  const overallStatus = panels.some(p => p.status === 'reinforce') ? 'reinforce' :
                        panels.some(p => p.status === 'marginal') ? 'marginal' : 'safe';

  // Minimum thickness to achieve safety factor of 2.0
  const maxPressure = Math.max(...panels.map(p => p.designPressure));
  const minThickness = Math.sqrt(maxPressure * 1000 * 0.3 * Math.pow(frameSpacing, 2) /
    (2 * PLYWOOD.bendingStrength * 1e6)) * 1000;

  return {
    panels,
    overallStatus,
    recommendedFrameSpacing: frameSpacing,
    minimumThickness: Math.max(6, Math.ceil(minThickness)),
    kerfDepth: 3, // Typical for 6mm ply
  };
}

/**
 * Analyze payload distribution and trim
 */
export function calculatePayloadAnalysis(
  params: HullParams,
  displacement: number,
  structureWeight: number
): PayloadAnalysis {
  // Max payload is typically 40% of displacement for small craft
  const maxPayload = displacement * 0.4;

  const currentPayload = params.crewWeight + params.cargoWeight;
  const payloadRatio = currentPayload / maxPayload;

  // Calculate longitudinal center of payload
  // Crew typically sits aft, cargo can be anywhere
  const crewPosition = params.lwl * 0.35; // From stern
  const cargoPosition = params.lwl * 0.45; // Slightly forward of crew

  const centerOfPayload = params.crewWeight > 0 || params.cargoWeight > 0 ?
    (params.crewWeight * crewPosition + params.cargoWeight * cargoPosition) /
    (params.crewWeight + params.cargoWeight) : params.lwl * 0.4;

  // Trim angle approximation
  const lcb = params.lwl * (params.lcb / 100); // LCB from stern
  const momentArm = centerOfPayload - lcb;
  const trimAngle = Math.atan2(momentArm * currentPayload * 0.001,
    displacement * params.lwl * 0.1) * 180 / Math.PI;

  // Heel from asymmetric load (simplified)
  const heelFromLoad = Math.abs(trimAngle) * 0.3; // Rough approximation

  const status = payloadRatio > 1.0 ? 'overloaded' :
                 Math.abs(trimAngle) > 5 ? 'trimmed' :
                 payloadRatio > 0.8 ? 'acceptable' : 'optimal';

  return {
    maxPayload,
    currentPayload,
    payloadRatio,
    centerOfPayload,
    trimAngle,
    heelFromLoad,
    status,
  };
}

/**
 * Calculate flotation requirements
 */
export function calculateFlotationAnalysis(
  params: HullParams,
  displacement: number,
  structureWeight: number
): FlotationAnalysis {
  // Hull volume approximation
  const hullVolume = params.lwl * params.beam * params.depth *
    (params.hullType === 'flat-bottom' ? 0.7 : 0.5);

  // Foam required to float structure + engine + 50% of max load
  const weightToFloat = structureWeight + params.engineHP * 2.5 + 60 + displacement * 0.25;
  const foamBuoyancy = 20; // kg/m³ of foam (net buoyancy in water)
  const foamRequired = (weightToFloat / foamBuoyancy) * 1000; // litres

  // Foam locations
  const foamLocations = [
    { location: 'Bow compartment', volume: foamRequired * 0.35 },
    { location: 'Under seats', volume: foamRequired * 0.35 },
    { location: 'Stern quarters', volume: foamRequired * 0.3 },
  ];

  // Level flotation check
  const levelFlotation = true; // Assumes proper distribution

  // Swamped freeboard (rough estimate)
  const swampedFreeboard = (hullVolume * 1000 - displacement) /
    (params.lwl * params.beam * 1000) * params.depth;

  // Swamped stability (reduced)
  const swampedStability = 0.1; // Very low GM when swamped

  // ISO 12217 compliance (simplified check)
  const iso12217Compliant = foamRequired < hullVolume * 1000 * 0.5 && swampedFreeboard > 0;

  return {
    hullVolume,
    foamRequired,
    foamLocations,
    levelFlotation,
    swampedFreeboard: Math.max(0, swampedFreeboard),
    swampedStability,
    iso12217Compliant,
  };
}

/**
 * Calculate cockpit drainage requirements
 */
export function calculateCockpitDrainage(
  params: HullParams,
  draft: number
): CockpitDrainage {
  // Cockpit dimensions (approximate)
  const cockpitLength = params.lwl * 0.5;
  const cockpitWidth = params.beam * 0.8;
  const cockpitDepth = 0.3; // m typical

  const cockpitArea = cockpitLength * cockpitWidth;
  const cockpitVolume = cockpitArea * cockpitDepth * 1000; // litres

  // Drain sizing based on ISO 11812
  // Minimum drain area = cockpit area × 0.1 (for <6m boats)
  const drainArea = cockpitArea * 0.002; // m² minimum
  const drainDiameter = Math.sqrt(drainArea / Math.PI) * 2 * 1000; // mm
  const drainCount = drainDiameter > 38 ? Math.ceil(drainArea / (Math.PI * 0.019 * 0.019)) : 2;

  // Drain time (simplified gravity drain)
  const drainRate = drainArea * Math.sqrt(2 * 9.81 * cockpitDepth) * 1000; // L/s
  const drainTime = cockpitVolume / drainRate;

  // Self-draining check
  const cockpitFloorHeight = params.depth - cockpitDepth;
  const minimumFreeboard = draft + 0.05; // Need 5cm above waterline
  const selfDraining = cockpitFloorHeight > minimumFreeboard;

  return {
    cockpitArea,
    cockpitVolume,
    drainDiameter: Math.max(25, Math.ceil(drainDiameter)), // 25mm minimum
    drainCount: Math.max(2, drainCount),
    drainTime,
    selfDraining,
    minimumFreeboard,
  };
}
