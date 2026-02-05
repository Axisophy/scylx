import type { HullParams, StabilityRating } from '@/types/hull';
import { BLOCK_COEFFICIENTS } from '@/lib/constants';

// Fuel consumption constants
const FUEL_CONSUMPTION = {
  // Litres per HP per hour at wide-open throttle (4-stroke outboard)
  wotLPerHpHr: 0.35,
  // Typical load factor at cruise
  cruiseLoadFactor: 0.6,
  // Petrol density kg/L
  petrolDensity: 0.75,
};

// Anchor sizing guidelines
const ANCHOR_GUIDELINES = {
  // kg of anchor per 100kg displacement
  kgPer100kgDisplacement: 0.4,
  // Chain length as multiple of LOA
  chainLengthMultiple: 4,
  // Chain diameter by displacement
  chainDiameter: {
    light: 6,   // <500kg
    medium: 8,  // 500-1000kg
    heavy: 10,  // >1000kg
  },
  // Kedge as fraction of primary
  kedgeFraction: 0.5,
  // Costs (USD)
  costs: {
    anchorPerKg: 25,
    chainPerM: 8,
    warpPerM: 2,
    shackles: 40,
  },
};

// Safety equipment costs (USD)
const SAFETY_COSTS = {
  lifejacket: 80,
  inshoreFlareSet: 60,
  offshoreFlareSet: 150,
  fireExtinguisher: 45,
  vhf: 150,
  firstAidKit: 40,
  navLights: 120,
  horn: 25,
  throwLine: 30,
  bilgePump: 60,
  paddleOar: 40,
  anchor: 0, // Calculated separately
};

// ============================================================================
// FUEL ANALYSIS
// ============================================================================

export interface FuelCurvePoint {
  speed: number;        // knots
  consumption: number;  // L/hour
  range: number;        // nm
  efficiency: number;   // nm/L
  powerFraction: number; // 0-1
}

export interface FuelAnalysis {
  minHP: number;
  recommendedHP: number;
  maxHP: number;
  fuelCurve: FuelCurvePoint[];
  optimalCruiseSpeed: number;
  optimalConsumption: number;
  maxRange: number;
  enduranceHours: number;
  cruiseRange: number;
}

/**
 * Calculate resistance at a given speed (simplified)
 */
function calculateResistanceAtSpeed(
  speedKnots: number,
  params: HullParams,
  displacement: number
): number {
  const V = speedKnots * 0.514444; // m/s
  const L = params.lwl;
  const S = L * (params.beam + 2 * params.depth * 0.3) * 0.75; // Wetted surface approx

  // Frictional resistance
  const Re = Math.max((V * L) / 1.19e-6, 1000);
  const Cf = 0.075 / Math.pow(Math.log10(Re) - 2, 2);
  const Rf = 0.5 * 1025 * V * V * S * Cf;

  // Wave resistance
  const Fn = V / Math.sqrt(9.81 * L);
  const Cw = 0.001 * Math.pow(Fn, 4) * 0.6 * 10;
  const Rw = 0.5 * 1025 * V * V * S * Cw;

  return Rf + Rw;
}

/**
 * Calculate power required to achieve a given speed
 */
function powerForSpeed(
  speedKnots: number,
  params: HullParams,
  displacement: number
): number {
  const R = calculateResistanceAtSpeed(speedKnots, params, displacement);
  const V = speedKnots * 0.514444;
  const propEfficiency = 0.5; // Typical outboard prop efficiency
  const powerWatts = (R * V) / propEfficiency;
  return powerWatts / 745.7; // Convert to HP
}

export function calculateFuelAnalysis(
  params: HullParams,
  displacement: number
): FuelAnalysis {
  const hullSpeed = 1.34 * Math.sqrt(params.lwl * 3.28084);

  // Engine sizing
  const powerAtHullSpeed = powerForSpeed(hullSpeed, params, displacement);
  const minHP = Math.ceil(powerAtHullSpeed * 0.8);
  const recommendedHP = Math.ceil(powerAtHullSpeed * 1.2);
  const maxHP = Math.min(60, Math.ceil(powerAtHullSpeed * 2));

  // Generate fuel curve
  const fuelCurve: FuelCurvePoint[] = [];
  let bestEfficiency = 0;
  let optimalSpeed = 0;

  // Use actual engine HP from params
  const engineHP = params.engineHP;

  for (let speed = 2; speed <= hullSpeed * 1.2; speed += 0.5) {
    const powerNeeded = powerForSpeed(speed, params, displacement);
    const powerFraction = Math.min(powerNeeded / engineHP, 1);

    // Fuel consumption: base rate × HP × load factor
    // At low loads, engines are less efficient (higher specific consumption)
    const loadEfficiencyFactor = 0.7 + 0.3 * powerFraction;
    const consumption = engineHP * FUEL_CONSUMPTION.wotLPerHpHr * powerFraction / loadEfficiencyFactor;

    // Range and efficiency
    const range = consumption > 0 ? (params.fuelCapacity / consumption) * speed : 0;
    const efficiency = consumption > 0 ? speed / consumption : 0;

    fuelCurve.push({
      speed,
      consumption,
      range,
      efficiency,
      powerFraction,
    });

    if (efficiency > bestEfficiency) {
      bestEfficiency = efficiency;
      optimalSpeed = speed;
    }
  }

  // Find optimal cruise point
  const optimalPoint = fuelCurve.find(p => p.speed === optimalSpeed) || fuelCurve[0];

  // Calculate practical cruise (70% of hull speed)
  const cruiseSpeed = hullSpeed * 0.7;
  const cruisePoint = fuelCurve.reduce((prev, curr) =>
    Math.abs(curr.speed - cruiseSpeed) < Math.abs(prev.speed - cruiseSpeed) ? curr : prev
  );

  return {
    minHP,
    recommendedHP,
    maxHP,
    fuelCurve,
    optimalCruiseSpeed: optimalSpeed,
    optimalConsumption: optimalPoint.consumption,
    maxRange: Math.max(...fuelCurve.map(p => p.range)),
    enduranceHours: params.fuelCapacity / cruisePoint.consumption,
    cruiseRange: cruisePoint.range,
  };
}

// ============================================================================
// VOYAGE CALCULATOR
// ============================================================================

export type SeaCondition = 'calm' | 'moderate' | 'rough';

export interface VoyageCalculation {
  distance: number;
  conditions: SeaCondition;
  cruiseSpeed: number;
  fuelRequired: number;
  fuelWithReserve: number;
  canMakeIt: boolean;
  fuelRemaining: number;
  refuelStops: number;
  timeUnderway: number;
  averageConsumption: number;
}

const CONDITION_FACTORS: Record<SeaCondition, number> = {
  calm: 1.0,
  moderate: 1.15,  // 15% more fuel in moderate seas
  rough: 1.35,     // 35% more fuel in rough seas
};

const SPEED_REDUCTION: Record<SeaCondition, number> = {
  calm: 1.0,
  moderate: 0.85,  // 15% slower in moderate seas
  rough: 0.65,     // 35% slower in rough seas
};

export function calculateVoyage(
  distance: number,
  conditions: SeaCondition,
  params: HullParams,
  fuelAnalysis: FuelAnalysis
): VoyageCalculation {
  const conditionFactor = CONDITION_FACTORS[conditions];
  const speedFactor = SPEED_REDUCTION[conditions];

  // Effective cruise speed
  const cruiseSpeed = fuelAnalysis.optimalCruiseSpeed * speedFactor;

  // Time underway
  const timeUnderway = distance / cruiseSpeed;

  // Find consumption at this speed
  const cruisePoint = fuelAnalysis.fuelCurve.reduce((prev, curr) =>
    Math.abs(curr.speed - cruiseSpeed) < Math.abs(prev.speed - cruiseSpeed) ? curr : prev
  );

  // Fuel required (adjusted for conditions)
  const baseConsumption = cruisePoint.consumption * conditionFactor;
  const fuelRequired = baseConsumption * timeUnderway;
  const fuelWithReserve = fuelRequired * 1.2; // 20% reserve

  // Can we make it?
  const canMakeIt = fuelWithReserve <= params.fuelCapacity;
  const fuelRemaining = Math.max(0, params.fuelCapacity - fuelRequired);

  // Refuel stops needed
  const rangePerTank = params.fuelCapacity / baseConsumption * cruiseSpeed * 0.8; // 80% usable
  const refuelStops = Math.max(0, Math.ceil(distance / rangePerTank) - 1);

  return {
    distance,
    conditions,
    cruiseSpeed,
    fuelRequired,
    fuelWithReserve,
    canMakeIt,
    fuelRemaining,
    refuelStops,
    timeUnderway,
    averageConsumption: baseConsumption,
  };
}

// ============================================================================
// ANCHOR SIZING
// ============================================================================

export type AnchorType = 'Rocna' | 'Mantus' | 'Delta' | 'CQR' | 'Danforth';

export interface AnchorRecommendation {
  primaryType: AnchorType;
  primaryWeightKg: number;
  chainLengthM: number;
  chainDiameter: number;
  kedgeType: AnchorType;
  kedgeWeightKg: number;
  warpLengthM: number;
  minScope: number;
  heavyWeatherScope: number;
  costs: {
    primaryAnchor: number;
    chain: number;
    kedgeAnchor: number;
    warp: number;
    hardware: number;
    total: number;
  };
  notes: string[];
}

export function calculateAnchorSizing(
  params: HullParams,
  displacement: number
): AnchorRecommendation {
  // Primary anchor weight based on displacement
  const baseWeight = (displacement / 100) * ANCHOR_GUIDELINES.kgPer100kgDisplacement;
  const primaryWeightKg = Math.max(4, Math.ceil(baseWeight));

  // Chain length based on LOA
  const chainLengthM = Math.ceil(params.lwl * ANCHOR_GUIDELINES.chainLengthMultiple);

  // Chain diameter based on displacement
  const chainDiameter =
    displacement < 500 ? ANCHOR_GUIDELINES.chainDiameter.light :
    displacement < 1000 ? ANCHOR_GUIDELINES.chainDiameter.medium :
    ANCHOR_GUIDELINES.chainDiameter.heavy;

  // Kedge anchor
  const kedgeWeightKg = Math.max(2, Math.ceil(primaryWeightKg * ANCHOR_GUIDELINES.kedgeFraction));

  // Warp length
  const warpLengthM = 50;

  // Costs
  const primaryAnchorCost = primaryWeightKg * ANCHOR_GUIDELINES.costs.anchorPerKg;
  const chainCost = chainLengthM * ANCHOR_GUIDELINES.costs.chainPerM * (chainDiameter / 6);
  const kedgeAnchorCost = kedgeWeightKg * ANCHOR_GUIDELINES.costs.anchorPerKg;
  const warpCost = warpLengthM * ANCHOR_GUIDELINES.costs.warpPerM;

  // Notes based on conditions
  const notes: string[] = [];
  if (displacement < 400) {
    notes.push('Light displacement - anchor may drag in strong winds, consider upsizing');
  }
  if (params.lwl > 8) {
    notes.push('Longer hull = more windage, ensure adequate chain weight');
  }
  notes.push('All-chain rode recommended for primary anchor');
  notes.push('Kedge can use rope rode with 3m chain leader');

  return {
    primaryType: 'Rocna', // Modern recommendation
    primaryWeightKg,
    chainLengthM,
    chainDiameter,
    kedgeType: 'Danforth',
    kedgeWeightKg,
    warpLengthM,
    minScope: 5,
    heavyWeatherScope: 10,
    costs: {
      primaryAnchor: primaryAnchorCost,
      chain: chainCost,
      kedgeAnchor: kedgeAnchorCost,
      warp: warpCost,
      hardware: ANCHOR_GUIDELINES.costs.shackles,
      total: primaryAnchorCost + chainCost + kedgeAnchorCost + warpCost + ANCHOR_GUIDELINES.costs.shackles,
    },
    notes,
  };
}

// ============================================================================
// WATER BALLAST SYSTEM
// ============================================================================

export interface WaterBallastSystem {
  tankVolume: number;         // litres
  tankDimensions: {
    length: number;           // m
    width: number;            // m
    height: number;           // m
  };
  tankCentreHeight: number;   // m above keel

  emptyGM: number;
  floodedGM: number;
  gmIncrease: number;         // percentage

  addedDisplacement: number;  // kg
  emptyDraft: number;
  floodedDraft: number;
  emptyFreeboard: number;
  floodedFreeboard: number;

  fillTime: number;           // minutes (with 20 L/min pump)
  drainTime: number;          // minutes (gravity)

  recommendedUse: string[];
  warnings: string[];
}

export function calculateWaterBallast(
  params: HullParams,
  displacement: number,
  currentGM: number,
  currentDraft: number
): WaterBallastSystem {
  // Tank sizing - aim for 15-25% of displacement as ballast
  const targetBallast = displacement * 0.2;
  const tankVolume = Math.round(targetBallast);

  // Tank dimensions - low and wide in the bilge
  const tankHeight = 0.15; // 150mm deep
  const tankLength = params.lwl * 0.3;
  const tankWidth = params.beam * 0.4;
  const actualVolume = tankLength * tankWidth * tankHeight * 1000;

  // Adjust to fit available space
  const finalVolume = Math.min(tankVolume, actualVolume);

  // Tank centre height - as low as possible
  const tankCentreHeight = tankHeight / 2;

  // Calculate stability effect
  const addedMass = finalVolume; // 1L water = 1kg
  const newDisplacement = displacement + addedMass;

  // New KG (weighted average)
  // Estimate current KG from GM, KB, BM relationship
  const currentKB = 0.53 * currentDraft;
  const CB = BLOCK_COEFFICIENTS[params.hullType] || 0.6;
  const nabla = displacement / 1025;
  const I = (params.lwl * Math.pow(params.beam, 3)) / 12;
  const currentBM = I / nabla;
  const currentKG = currentKB + currentBM - currentGM;

  // New weighted KG
  const newKG = (displacement * currentKG + addedMass * tankCentreHeight) / newDisplacement;

  // New draft
  const newDraft = currentDraft * Math.pow(newDisplacement / displacement, 1/3);

  // New KB and BM
  const newKB = 0.53 * newDraft;
  const newNabla = newDisplacement / 1025;
  const newBM = I / newNabla;

  // New GM
  const floodedGM = newKB + newBM - newKG;
  const gmIncrease = ((floodedGM - currentGM) / currentGM) * 100;

  // Fill/drain times
  const pumpRate = 20; // L/min typical bilge pump
  const fillTime = finalVolume / pumpRate;
  const drainTime = finalVolume / (pumpRate * 1.5); // Gravity is faster

  // Recommendations
  const recommendedUse: string[] = [];
  const warnings: string[] = [];

  if (currentGM < 0.5) {
    recommendedUse.push('Fill ballast before leaving harbour');
    recommendedUse.push('Keep flooded in any wind over 15 knots');
  } else {
    recommendedUse.push('Fill when anchoring in exposed locations');
    recommendedUse.push('Fill in beam seas for comfort');
  }
  recommendedUse.push('Fill when crew moves around the boat');
  recommendedUse.push('Drain when trailering to reduce weight');

  // Warnings
  if (newDraft > params.depth * 0.7) {
    warnings.push('Flooded draft may be too deep for shallow waters');
  }
  if (gmIncrease > 50) {
    warnings.push('Large GM increase may make motion uncomfortable');
  }

  return {
    tankVolume: finalVolume,
    tankDimensions: {
      length: tankLength,
      width: tankWidth,
      height: tankHeight,
    },
    tankCentreHeight,
    emptyGM: currentGM,
    floodedGM,
    gmIncrease,
    addedDisplacement: addedMass,
    emptyDraft: currentDraft,
    floodedDraft: newDraft,
    emptyFreeboard: params.depth - currentDraft,
    floodedFreeboard: params.depth - newDraft,
    fillTime,
    drainTime,
    recommendedUse,
    warnings,
  };
}

// ============================================================================
// SAFETY EQUIPMENT
// ============================================================================

export type CECategory = 'C' | 'D';

export interface SafetyItem {
  item: string;
  quantity: number;
  cost: number;
  required: boolean;
  notes?: string;
}

export interface SafetyEquipment {
  ceCategory: CECategory;
  maxPersons: number;

  lifesaving: SafetyItem[];
  firefighting: SafetyItem[];
  navigation: SafetyItem[];
  communication: SafetyItem[];
  general: SafetyItem[];

  totalRequiredCost: number;
  totalRecommendedCost: number;
  totalCost: number;
}

export function calculateSafetyEquipment(
  params: HullParams,
  displacement: number
): SafetyEquipment {
  // CE Category based on design
  // Category C: Inshore waters, wind to Force 6, waves to 2m
  // Category D: Sheltered waters, wind to Force 4, waves to 0.3m
  const ceCategory: CECategory = params.lwl >= 6 && params.depth >= 0.7 ? 'C' : 'D';

  // Max persons based on displacement and cockpit size
  const maxPersons = Math.min(6, Math.floor(displacement / 100));

  // Lifesaving equipment
  const lifesaving: SafetyItem[] = [
    {
      item: 'Lifejackets (150N)',
      quantity: maxPersons,
      cost: SAFETY_COSTS.lifejacket * maxPersons,
      required: true,
    },
    {
      item: 'Throwline (20m)',
      quantity: 1,
      cost: SAFETY_COSTS.throwLine,
      required: ceCategory === 'C',
    },
  ];

  if (ceCategory === 'C') {
    lifesaving.push({
      item: 'Offshore flare pack',
      quantity: 1,
      cost: SAFETY_COSTS.offshoreFlareSet,
      required: true,
      notes: '2 red handhelds, 2 orange smoke, 2 red parachute',
    });
  } else {
    lifesaving.push({
      item: 'Inshore flare pack',
      quantity: 1,
      cost: SAFETY_COSTS.inshoreFlareSet,
      required: true,
      notes: '2 red handhelds, 2 orange smoke',
    });
  }

  // Firefighting
  const firefighting: SafetyItem[] = [
    {
      item: 'Fire extinguisher (1kg dry powder)',
      quantity: 1,
      cost: SAFETY_COSTS.fireExtinguisher,
      required: true,
    },
    {
      item: 'Fire blanket',
      quantity: 1,
      cost: 20,
      required: false,
      notes: 'Recommended if cooking aboard',
    },
  ];

  // Navigation
  const navigation: SafetyItem[] = [
    {
      item: 'Navigation lights (LED)',
      quantity: 1,
      cost: SAFETY_COSTS.navLights,
      required: true,
    },
    {
      item: 'Compass',
      quantity: 1,
      cost: 60,
      required: ceCategory === 'C',
    },
    {
      item: 'Charts (paper or electronic)',
      quantity: 1,
      cost: 50,
      required: true,
    },
    {
      item: 'Foghorn/whistle',
      quantity: 1,
      cost: SAFETY_COSTS.horn,
      required: true,
    },
  ];

  // Communication
  const communication: SafetyItem[] = [
    {
      item: 'VHF Radio (handheld)',
      quantity: 1,
      cost: SAFETY_COSTS.vhf,
      required: ceCategory === 'C',
      notes: 'DSC capable recommended',
    },
    {
      item: 'Mobile phone (waterproof case)',
      quantity: 1,
      cost: 30,
      required: false,
      notes: 'Backup communication',
    },
  ];

  // General
  const general: SafetyItem[] = [
    {
      item: 'First aid kit (offshore)',
      quantity: 1,
      cost: SAFETY_COSTS.firstAidKit,
      required: true,
    },
    {
      item: 'Bilge pump (manual)',
      quantity: 1,
      cost: SAFETY_COSTS.bilgePump,
      required: true,
    },
    {
      item: 'Paddle/oar',
      quantity: 2,
      cost: SAFETY_COSTS.paddleOar * 2,
      required: true,
      notes: 'Emergency propulsion',
    },
    {
      item: 'Bailer/bucket',
      quantity: 1,
      cost: 10,
      required: true,
    },
    {
      item: 'Torch (waterproof)',
      quantity: 1,
      cost: 25,
      required: true,
    },
    {
      item: 'Knife (serrated)',
      quantity: 1,
      cost: 20,
      required: true,
    },
    {
      item: 'Tool kit',
      quantity: 1,
      cost: 50,
      required: false,
    },
    {
      item: 'Spare fuel can',
      quantity: 1,
      cost: 25,
      required: false,
    },
  ];

  // Calculate totals
  const allItems = [...lifesaving, ...firefighting, ...navigation, ...communication, ...general];
  const totalRequiredCost = allItems.filter(i => i.required).reduce((sum, i) => sum + i.cost, 0);
  const totalRecommendedCost = allItems.filter(i => !i.required).reduce((sum, i) => sum + i.cost, 0);

  return {
    ceCategory,
    maxPersons,
    lifesaving,
    firefighting,
    navigation,
    communication,
    general,
    totalRequiredCost,
    totalRecommendedCost,
    totalCost: totalRequiredCost + totalRecommendedCost,
  };
}
