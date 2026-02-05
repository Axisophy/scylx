import type { HullParams } from '@/types/hull';

// Solar panel specifications
const SOLAR = {
  efficiency: 0.22, // 22% typical for monocrystalline
  peakSunHours: {
    tropical: 5.5,
    temperate: 4.0,
    nordic: 2.5,
  },
  panelWattsPerM2: 200, // W/m² at standard test conditions
  degradation: 0.005, // 0.5% per year
};

// Battery specifications
const BATTERY = {
  lifepo4: {
    energyDensity: 150, // Wh/kg
    cycleLife: 3000,
    dod: 0.8, // Depth of discharge
    voltage: 12.8, // Nominal
    cost: 400, // $/kWh
  },
  agm: {
    energyDensity: 35, // Wh/kg
    cycleLife: 500,
    dod: 0.5,
    voltage: 12.0,
    cost: 150, // $/kWh
  },
};

// Electric motor specifications
const MOTOR = {
  efficiency: 0.9, // 90% typical for BLDC
  thrustPerKw: 4.5, // kg thrust per kW at prop
};

export type ClimateZone = 'tropical' | 'temperate' | 'nordic';
export type BatteryType = 'lifepo4' | 'agm';

export interface SolarAnalysis {
  availableArea: number; // m² on deck/cabin
  maxPanelWatts: number; // Wp
  dailyHarvest: Record<ClimateZone, number>; // Wh/day
  effectiveRange: Record<ClimateZone, number>; // hours of propulsion at cruise
  chargeTime: Record<ClimateZone, number>; // hours to full charge
}

export interface BatteryAnalysis {
  type: BatteryType;
  capacityKwh: number;
  weight: number; // kg
  volume: number; // litres
  cycles: number;
  cost: number;
  rangeAtCruise: number; // hours
  rangeAtHull: number; // hours (at hull speed)
}

export interface ElectricPropulsion {
  motorKw: number;
  propDiameter: number; // inches
  thrustKg: number;
  efficiencyAtSpeed: number;
  cruiseSpeed: number; // knots
  maxSpeed: number; // knots
}

export interface ElectricSystemAnalysis {
  solar: SolarAnalysis;
  batteryLiFeP04: BatteryAnalysis;
  batteryAGM: BatteryAnalysis;
  propulsion: ElectricPropulsion;
  energyAtCruise: number; // Wh/nm
  rangeComparison: {
    solarOnly: Record<ClimateZone, number>; // nm/day
    batteryOnly: number; // nm
    combined: Record<ClimateZone, number>; // nm/day
  };
  annualSavings: number; // vs petrol at 50hrs/year
  paybackYears: number;
}

/**
 * Calculate available solar panel area on deck
 */
function calculateSolarArea(params: HullParams): number {
  // Assume solar panels on cabin top and/or bimini
  const cabinLength = params.lwl * 0.3;
  const cabinWidth = params.beam * 0.6;

  // Add bimini area
  const biminiArea = params.lwl > 6 ? 2.0 : 1.2; // m²

  return cabinLength * cabinWidth + biminiArea;
}

/**
 * Calculate power required to maintain speed
 * Uses resistance calculations from physics
 */
function calculatePowerForSpeed(
  speedKnots: number,
  params: HullParams,
  displacement: number
): number {
  const speedMS = speedKnots * 0.514444;

  // Simplified resistance model
  const S = params.lwl * (params.beam + 2 * 0.2) * 0.75; // Wetted surface approx

  // Frictional resistance
  const Re = (speedMS * params.lwl) / 1.19e-6;
  const Cf = Re > 0 ? 0.075 / Math.pow(Math.log10(Math.max(Re, 1000)) - 2, 2) : 0.003;
  const Rf = 0.5 * 1025 * speedMS * speedMS * S * Cf;

  // Wave resistance (simplified)
  const Fn = speedMS / Math.sqrt(9.81 * params.lwl);
  const Cw = 0.001 * Math.pow(Fn, 4) * 0.6 * 10;
  const Rw = 0.5 * 1025 * speedMS * speedMS * S * Cw;

  // Total power = resistance × speed / efficiency
  const power = ((Rf + Rw) * speedMS) / MOTOR.efficiency;

  return power / 1000; // kW
}

/**
 * Calculate motor size required for target performance
 */
function calculateMotorSize(
  params: HullParams,
  displacement: number
): ElectricPropulsion {
  const hullSpeed = 1.34 * Math.sqrt(params.lwl * 3.28084);

  // Power at various speeds
  const powerAtHull = calculatePowerForSpeed(hullSpeed, params, displacement);
  const cruiseSpeed = hullSpeed * 0.7;
  const powerAtCruise = calculatePowerForSpeed(cruiseSpeed, params, displacement);

  // Motor sized for hull speed (with margin)
  const motorKw = powerAtHull * 1.2;

  // Prop diameter based on power and displacement
  const propDiameter = 8 + Math.sqrt(motorKw) * 2;

  const thrustKg = motorKw * MOTOR.thrustPerKw;

  // Max speed (limited by motor power)
  const maxSpeed = Math.min(hullSpeed * 1.1, hullSpeed);

  return {
    motorKw,
    propDiameter: Math.round(propDiameter),
    thrustKg,
    efficiencyAtSpeed: MOTOR.efficiency,
    cruiseSpeed,
    maxSpeed,
  };
}

/**
 * Calculate solar panel performance
 */
function calculateSolar(params: HullParams): SolarAnalysis {
  const availableArea = calculateSolarArea(params);
  const maxPanelWatts = availableArea * SOLAR.panelWattsPerM2;

  const dailyHarvest: Record<ClimateZone, number> = {
    tropical: maxPanelWatts * SOLAR.peakSunHours.tropical * SOLAR.efficiency * 5,
    temperate: maxPanelWatts * SOLAR.peakSunHours.temperate * SOLAR.efficiency * 5,
    nordic: maxPanelWatts * SOLAR.peakSunHours.nordic * SOLAR.efficiency * 5,
  };

  return {
    availableArea,
    maxPanelWatts,
    dailyHarvest,
    effectiveRange: { tropical: 0, temperate: 0, nordic: 0 }, // Calculated later
    chargeTime: { tropical: 0, temperate: 0, nordic: 0 }, // Calculated later
  };
}

/**
 * Calculate battery requirements
 */
function calculateBattery(
  type: BatteryType,
  propulsion: ElectricPropulsion,
  targetRange: number // hours at cruise
): BatteryAnalysis {
  const spec = BATTERY[type];
  const energyRequired = propulsion.motorKw * targetRange * 0.6; // Average load factor
  const capacityKwh = energyRequired / spec.dod; // Account for DoD

  const weight = capacityKwh * 1000 / spec.energyDensity;
  const volume = weight * (type === 'lifepo4' ? 1.5 : 2.5); // Approximate volume

  const rangeAtCruise = (capacityKwh * spec.dod) /
    (propulsion.motorKw * 0.5); // 50% load at cruise

  const powerAtHull = propulsion.motorKw * 0.8; // 80% load at hull speed
  const rangeAtHull = (capacityKwh * spec.dod) / powerAtHull;

  return {
    type,
    capacityKwh,
    weight,
    volume,
    cycles: spec.cycleLife,
    cost: capacityKwh * spec.cost,
    rangeAtCruise,
    rangeAtHull,
  };
}

/**
 * Complete electric system analysis
 */
export function calculateElectricSystem(
  params: HullParams,
  displacement: number,
  targetHours: number = 4
): ElectricSystemAnalysis {
  const propulsion = calculateMotorSize(params, displacement);
  const solar = calculateSolar(params);

  const batteryLiFeP04 = calculateBattery('lifepo4', propulsion, targetHours);
  const batteryAGM = calculateBattery('agm', propulsion, targetHours);

  // Use LiFePO4 for main calculations
  const battery = batteryLiFeP04;

  // Energy consumption at cruise
  const powerAtCruise = propulsion.motorKw * 0.5;
  const energyAtCruise = powerAtCruise * 1000 / propulsion.cruiseSpeed; // Wh/nm

  // Update solar with effective range calculations
  const climates: ClimateZone[] = ['tropical', 'temperate', 'nordic'];
  for (const climate of climates) {
    const dailyEnergy = solar.dailyHarvest[climate];
    solar.effectiveRange[climate] = dailyEnergy / (powerAtCruise * 1000);
    solar.chargeTime[climate] = battery.capacityKwh * 1000 / (solar.maxPanelWatts * SOLAR.efficiency * SOLAR.peakSunHours[climate]);
  }

  // Range comparisons
  const rangeComparison = {
    solarOnly: {
      tropical: solar.dailyHarvest.tropical / energyAtCruise,
      temperate: solar.dailyHarvest.temperate / energyAtCruise,
      nordic: solar.dailyHarvest.nordic / energyAtCruise,
    },
    batteryOnly: battery.rangeAtCruise * propulsion.cruiseSpeed,
    combined: {
      tropical: (solar.dailyHarvest.tropical + battery.capacityKwh * 1000 * (battery.type === 'lifepo4' ? BATTERY.lifepo4.dod : BATTERY.agm.dod)) / energyAtCruise,
      temperate: (solar.dailyHarvest.temperate + battery.capacityKwh * 1000 * 0.8) / energyAtCruise,
      nordic: (solar.dailyHarvest.nordic + battery.capacityKwh * 1000 * 0.8) / energyAtCruise,
    },
  };

  // Annual savings (vs petrol outboard)
  const petrolCostPerHour = (params.engineHP * 0.4 * 1.5); // L/hr × $/L
  const electricCostPerHour = powerAtCruise * 0.15; // $/kWh grid
  const annualHours = 50;
  const annualSavings = (petrolCostPerHour - electricCostPerHour) * annualHours;

  // System cost
  const systemCost = battery.cost + solar.maxPanelWatts * 0.8 + propulsion.motorKw * 300;
  const paybackYears = systemCost / Math.max(annualSavings, 100);

  return {
    solar,
    batteryLiFeP04,
    batteryAGM,
    propulsion,
    energyAtCruise,
    rangeComparison,
    annualSavings,
    paybackYears,
  };
}
