import { create } from 'zustand';
import * as tf from '@tensorflow/tfjs';
import type { HullParams, PhysicsResults } from '@/types/hull';
import { calculatePhysics } from '@/engine/physics';
import { trainSurrogate, generateDesignSpaceData } from '@/engine/surrogate';

// Default hull parameters - middle of all ranges
const defaultParams: HullParams = {
  // Dimensions - extended ranges
  lwl: 7.0,
  beam: 1.8,
  depth: 0.85,

  // Hull form
  hullType: 'single-chine',
  deadrise: 15,
  deadriseVariation: 'constant',

  // Bow configuration
  bowType: 'plumb',
  bowRake: 0,
  bowFlare: 10,

  // Stern configuration
  sternType: 'transom',
  transomRake: 10,
  transomImmersion: 30,

  // Hull form refinements
  prismaticCoefficient: 0.58,
  lcb: 52,
  rocker: 0.05,

  // Chine configuration
  chineHeight: 0.3,
  chineAngle: 5,

  // Loading
  crewWeight: 160,  // 2 people
  cargoWeight: 50,
  ballastType: 'none',
  ballastWeight: 0,
  ballastHeight: 0.1,
  fuelCapacity: 50,
  waterCapacity: 40,

  // Power
  engineHP: 25,
  engineType: 'outboard',
  propellerDiameter: 11,
  propellerPitch: 13,
};

// Design space data structure
export interface DesignSpaceData {
  lwlRange: number[];
  beamRange: number[];
  gmGrid: number[][];
  hullSpeedGrid: number[][];
  draftGrid: number[][];
}

// Saved configuration for morphing
export interface SavedConfig {
  name: string;
  params: HullParams;
  timestamp: number;
}

interface HullStore {
  // State
  params: HullParams;
  results: PhysicsResults;

  // Surrogate model
  surrogate: tf.LayersModel | null;
  surrogateReady: boolean;
  surrogateTraining: boolean;
  trainingProgress: number;
  trainingLoss: number;

  // Design space data (generated from surrogate)
  designSpaceData: DesignSpaceData | null;

  // Heel angle for stability visualization
  heelAngle: number;

  // Design DNA morphing
  savedConfigA: SavedConfig | null;
  savedConfigB: SavedConfig | null;
  morphPosition: number; // 0 = configA, 1 = configB
  morphEnabled: boolean;

  // Actions
  setParam: <K extends keyof HullParams>(key: K, value: HullParams[K]) => void;
  setParams: (partial: Partial<HullParams>) => void;
  resetParams: () => void;
  setHeelAngle: (angle: number) => void;
  trainModel: () => Promise<void>;
  updateDesignSpace: () => void;
  saveConfigA: (name?: string) => void;
  saveConfigB: (name?: string) => void;
  clearSavedConfigs: () => void;
  setMorphPosition: (position: number) => void;
  setMorphEnabled: (enabled: boolean) => void;
}

// Helper to interpolate between two hull param sets
function lerpParams(a: HullParams, b: HullParams, t: number): HullParams {
  return {
    // Dimensions
    lwl: a.lwl + (b.lwl - a.lwl) * t,
    beam: a.beam + (b.beam - a.beam) * t,
    depth: a.depth + (b.depth - a.depth) * t,

    // Hull form
    hullType: t < 0.5 ? a.hullType : b.hullType,
    deadrise: a.deadrise + (b.deadrise - a.deadrise) * t,
    deadriseVariation: t < 0.5 ? a.deadriseVariation : b.deadriseVariation,

    // Bow configuration
    bowType: t < 0.5 ? a.bowType : b.bowType,
    bowRake: a.bowRake + (b.bowRake - a.bowRake) * t,
    bowFlare: a.bowFlare + (b.bowFlare - a.bowFlare) * t,

    // Stern configuration
    sternType: t < 0.5 ? a.sternType : b.sternType,
    transomRake: a.transomRake + (b.transomRake - a.transomRake) * t,
    transomImmersion: a.transomImmersion + (b.transomImmersion - a.transomImmersion) * t,

    // Hull form refinements
    prismaticCoefficient: a.prismaticCoefficient + (b.prismaticCoefficient - a.prismaticCoefficient) * t,
    lcb: a.lcb + (b.lcb - a.lcb) * t,
    rocker: a.rocker + (b.rocker - a.rocker) * t,

    // Chine configuration
    chineHeight: a.chineHeight + (b.chineHeight - a.chineHeight) * t,
    chineAngle: a.chineAngle + (b.chineAngle - a.chineAngle) * t,

    // Loading
    crewWeight: a.crewWeight + (b.crewWeight - a.crewWeight) * t,
    cargoWeight: a.cargoWeight + (b.cargoWeight - a.cargoWeight) * t,
    ballastType: t < 0.5 ? a.ballastType : b.ballastType,
    ballastWeight: a.ballastWeight + (b.ballastWeight - a.ballastWeight) * t,
    ballastHeight: a.ballastHeight + (b.ballastHeight - a.ballastHeight) * t,
    fuelCapacity: a.fuelCapacity + (b.fuelCapacity - a.fuelCapacity) * t,
    waterCapacity: a.waterCapacity + (b.waterCapacity - a.waterCapacity) * t,

    // Power
    engineHP: a.engineHP + (b.engineHP - a.engineHP) * t,
    engineType: t < 0.5 ? a.engineType : b.engineType,
    propellerDiameter: a.propellerDiameter + (b.propellerDiameter - a.propellerDiameter) * t,
    propellerPitch: a.propellerPitch + (b.propellerPitch - a.propellerPitch) * t,
  };
}

export const useHullStore = create<HullStore>((set, get) => ({
  // Initial state
  params: defaultParams,
  results: calculatePhysics(defaultParams),
  surrogate: null,
  surrogateReady: false,
  surrogateTraining: false,
  trainingProgress: 0,
  trainingLoss: 0,
  designSpaceData: null,
  heelAngle: 0,
  savedConfigA: null,
  savedConfigB: null,
  morphPosition: 0,
  morphEnabled: false,

  // Update single parameter
  setParam: (key, value) => {
    const newParams = { ...get().params, [key]: value };
    set({
      params: newParams,
      results: calculatePhysics(newParams),
    });
    // Update design space if surrogate is ready
    if (get().surrogateReady) {
      get().updateDesignSpace();
    }
  },

  // Update multiple parameters at once
  setParams: (partial) => {
    const newParams = { ...get().params, ...partial };
    set({
      params: newParams,
      results: calculatePhysics(newParams),
    });
    if (get().surrogateReady) {
      get().updateDesignSpace();
    }
  },

  // Reset to defaults
  resetParams: () => {
    set({
      params: defaultParams,
      results: calculatePhysics(defaultParams),
    });
    if (get().surrogateReady) {
      get().updateDesignSpace();
    }
  },

  // Set heel angle for stability visualization
  setHeelAngle: (angle) => {
    set({ heelAngle: angle });
  },

  // Train the surrogate model
  trainModel: async () => {
    set({ surrogateTraining: true, trainingProgress: 0 });

    try {
      const model = await trainSurrogate((epoch, loss) => {
        set({
          trainingProgress: (epoch / 50) * 100,
          trainingLoss: loss,
        });
      });

      set({
        surrogate: model,
        surrogateReady: true,
        surrogateTraining: false,
        trainingProgress: 100,
      });

      // Generate initial design space data
      get().updateDesignSpace();
    } catch (error) {
      console.error('Training failed:', error);
      set({ surrogateTraining: false });
    }
  },

  // Update design space data using current params (except lwl/beam which vary)
  updateDesignSpace: () => {
    const { surrogate, params } = get();
    if (!surrogate) return;

    const { lwl, beam, ...restParams } = params;
    const data = generateDesignSpaceData(surrogate, restParams, 40);
    set({ designSpaceData: data });
  },

  // Save current config as A
  saveConfigA: (name?: string) => {
    const { params } = get();
    set({
      savedConfigA: {
        name: name || 'Config A',
        params: { ...params },
        timestamp: Date.now(),
      },
    });
  },

  // Save current config as B
  saveConfigB: (name?: string) => {
    const { params } = get();
    set({
      savedConfigB: {
        name: name || 'Config B',
        params: { ...params },
        timestamp: Date.now(),
      },
    });
  },

  // Clear saved configs
  clearSavedConfigs: () => {
    set({
      savedConfigA: null,
      savedConfigB: null,
      morphEnabled: false,
      morphPosition: 0,
    });
  },

  // Set morph position and update params
  setMorphPosition: (position: number) => {
    const { savedConfigA, savedConfigB, morphEnabled } = get();
    if (!morphEnabled || !savedConfigA || !savedConfigB) {
      set({ morphPosition: position });
      return;
    }

    const morphedParams = lerpParams(savedConfigA.params, savedConfigB.params, position);
    set({
      morphPosition: position,
      params: morphedParams,
      results: calculatePhysics(morphedParams),
    });

    if (get().surrogateReady) {
      get().updateDesignSpace();
    }
  },

  // Enable/disable morphing mode
  setMorphEnabled: (enabled: boolean) => {
    const { savedConfigA, savedConfigB, morphPosition } = get();
    set({ morphEnabled: enabled });

    // If enabling and both configs exist, apply morph immediately
    if (enabled && savedConfigA && savedConfigB) {
      const morphedParams = lerpParams(savedConfigA.params, savedConfigB.params, morphPosition);
      set({
        params: morphedParams,
        results: calculatePhysics(morphedParams),
      });
    }
  },
}));

// Selector hooks for performance (prevent unnecessary re-renders)
export const useHullParams = () => useHullStore((state) => state.params);
export const usePhysicsResults = () => useHullStore((state) => state.results);
export const useSetParam = () => useHullStore((state) => state.setParam);
export const useSetParams = () => useHullStore((state) => state.setParams);

// Individual surrogate status selectors (avoid object creation)
export const useSurrogateReady = () => useHullStore((state) => state.surrogateReady);
export const useSurrogateTraining = () => useHullStore((state) => state.surrogateTraining);
export const useTrainingProgress = () => useHullStore((state) => state.trainingProgress);
export const useTrainingLoss = () => useHullStore((state) => state.trainingLoss);

export const useDesignSpaceData = () => useHullStore((state) => state.designSpaceData);
export const useHeelAngle = () => useHullStore((state) => state.heelAngle);
export const useSetHeelAngle = () => useHullStore((state) => state.setHeelAngle);

// Morph selectors
export const useSavedConfigA = () => useHullStore((state) => state.savedConfigA);
export const useSavedConfigB = () => useHullStore((state) => state.savedConfigB);
export const useMorphPosition = () => useHullStore((state) => state.morphPosition);
export const useMorphEnabled = () => useHullStore((state) => state.morphEnabled);
export const useSaveConfigA = () => useHullStore((state) => state.saveConfigA);
export const useSaveConfigB = () => useHullStore((state) => state.saveConfigB);
export const useClearSavedConfigs = () => useHullStore((state) => state.clearSavedConfigs);
export const useSetMorphPosition = () => useHullStore((state) => state.setMorphPosition);
export const useSetMorphEnabled = () => useHullStore((state) => state.setMorphEnabled);
