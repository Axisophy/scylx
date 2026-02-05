import * as tf from '@tensorflow/tfjs';
import type { HullParams, HullType } from '@/types/hull';
import { calculatePhysics } from './physics';

// Training configuration
const INPUT_DIM = 7;  // lwl, beam, depth, hullTypeEncoded, deadrise, totalLoad, engineHP
const OUTPUT_DIM = 4; // GM, hullSpeed, maxSpeed, draft

// Normalization statistics (computed during training)
interface NormalizationStats {
  inputMean: number[];
  inputStd: number[];
  outputMean: number[];
  outputStd: number[];
}

let normStats: NormalizationStats | null = null;

/**
 * Encode hull type as numeric value for neural network
 */
function encodeHullType(hullType: HullType): number {
  const encoding: Record<HullType, number> = {
    'flat-bottom': 0,
    'single-chine': 0.5,
    'multi-chine': 1,
  };
  return encoding[hullType];
}

/**
 * Create input vector from hull parameters
 */
function encodeInputs(params: HullParams): number[] {
  const totalLoad = params.crewWeight + params.cargoWeight + params.ballastWeight;
  return [
    params.lwl,
    params.beam,
    params.depth,
    encodeHullType(params.hullType),
    params.deadrise,
    totalLoad,
    params.engineHP,
  ];
}

/**
 * Create output vector from physics results
 */
function encodeOutputs(params: HullParams): number[] {
  const results = calculatePhysics(params);
  return [
    results.GM,
    results.hullSpeed,
    results.maxSpeed,
    results.draft,
  ];
}

/**
 * Generate training data by sweeping parameter space
 */
function generateTrainingData(): { inputs: number[][]; outputs: number[][] } {
  const inputs: number[][] = [];
  const outputs: number[][] = [];

  const hullTypes: HullType[] = ['flat-bottom', 'single-chine', 'multi-chine'];

  // Sweep parameter space (~10,000 configurations)
  for (let lwl = 6.0; lwl <= 7.5; lwl += 0.15) {
    for (let beam = 1.2; beam <= 2.0; beam += 0.08) {
      for (let depth = 0.6; depth <= 1.0; depth += 0.1) {
        for (const hullType of hullTypes) {
          for (let totalLoad = 150; totalLoad <= 500; totalLoad += 70) {
            // Distribute load across crew and cargo
            const crewWeight = Math.min(totalLoad * 0.6, 240);
            const cargoWeight = totalLoad - crewWeight;

            for (let engineHP = 15; engineHP <= 25; engineHP += 5) {
              const params: HullParams = {
                lwl,
                beam,
                depth,
                hullType,
                deadrise: 12, // Fixed for training simplicity
                crewWeight,
                cargoWeight,
                ballastType: 'none',
                ballastWeight: 0,
                ballastHeight: 0.1,
                engineHP,
              };

              inputs.push(encodeInputs(params));
              outputs.push(encodeOutputs(params));
            }
          }
        }
      }
    }
  }

  return { inputs, outputs };
}

/**
 * Compute mean and standard deviation for normalization
 */
function computeStats(data: number[][]): { mean: number[]; std: number[] } {
  const n = data.length;
  const dim = data[0].length;

  const mean = new Array(dim).fill(0);
  const std = new Array(dim).fill(0);

  // Compute mean
  for (const row of data) {
    for (let i = 0; i < dim; i++) {
      mean[i] += row[i] / n;
    }
  }

  // Compute std
  for (const row of data) {
    for (let i = 0; i < dim; i++) {
      std[i] += Math.pow(row[i] - mean[i], 2) / n;
    }
  }

  for (let i = 0; i < dim; i++) {
    std[i] = Math.sqrt(std[i]) || 1; // Avoid division by zero
  }

  return { mean, std };
}

/**
 * Normalize data using z-score normalization
 */
function normalize(data: number[][], mean: number[], std: number[]): number[][] {
  return data.map(row => row.map((val, i) => (val - mean[i]) / std[i]));
}

/**
 * Denormalize output predictions
 */
function denormalize(data: number[], mean: number[], std: number[]): number[] {
  return data.map((val, i) => val * std[i] + mean[i]);
}

/**
 * Train the surrogate neural network
 */
export async function trainSurrogate(
  onProgress?: (epoch: number, loss: number) => void
): Promise<tf.LayersModel> {
  console.log('Generating training data...');
  const { inputs, outputs } = generateTrainingData();
  console.log(`Generated ${inputs.length} training samples`);

  // Compute normalization statistics
  const inputStats = computeStats(inputs);
  const outputStats = computeStats(outputs);

  normStats = {
    inputMean: inputStats.mean,
    inputStd: inputStats.std,
    outputMean: outputStats.mean,
    outputStd: outputStats.std,
  };

  // Normalize data
  const normalizedInputs = normalize(inputs, inputStats.mean, inputStats.std);
  const normalizedOutputs = normalize(outputs, outputStats.mean, outputStats.std);

  // Convert to tensors
  const inputTensor = tf.tensor2d(normalizedInputs);
  const outputTensor = tf.tensor2d(normalizedOutputs);

  // Build model
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [INPUT_DIM],
        kernelInitializer: 'heNormal',
      }),
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      }),
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      }),
      tf.layers.dense({
        units: OUTPUT_DIM,
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
  });

  console.log('Training surrogate model...');

  // Train
  await model.fit(inputTensor, outputTensor, {
    epochs: 50,
    batchSize: 64,
    shuffle: true,
    validationSplit: 0.1,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onProgress && logs) {
          onProgress(epoch + 1, logs.loss as number);
        }
      },
    },
  });

  // Clean up tensors
  inputTensor.dispose();
  outputTensor.dispose();

  console.log('Surrogate model training complete');
  return model;
}

/**
 * Predict physics outputs using trained surrogate
 */
export function predictWithSurrogate(
  model: tf.LayersModel,
  params: HullParams
): { GM: number; hullSpeed: number; maxSpeed: number; draft: number } | null {
  if (!normStats) {
    console.warn('Normalization stats not available');
    return null;
  }

  const input = encodeInputs(params);
  const normalizedInput = input.map(
    (val, i) => (val - normStats!.inputMean[i]) / normStats!.inputStd[i]
  );

  const inputTensor = tf.tensor2d([normalizedInput]);
  const outputTensor = model.predict(inputTensor) as tf.Tensor;
  const normalizedOutput = outputTensor.dataSync();

  inputTensor.dispose();
  outputTensor.dispose();

  const output = denormalize(
    Array.from(normalizedOutput),
    normStats.outputMean,
    normStats.outputStd
  );

  return {
    GM: output[0],
    hullSpeed: output[1],
    maxSpeed: output[2],
    draft: output[3],
  };
}

/**
 * Generate design space data using surrogate for fast inference
 * Returns a grid of predictions for the LWL x Beam space
 */
export function generateDesignSpaceData(
  model: tf.LayersModel,
  params: Omit<HullParams, 'lwl' | 'beam'>,
  resolution: number = 50
): {
  lwlRange: number[];
  beamRange: number[];
  gmGrid: number[][];
  hullSpeedGrid: number[][];
  draftGrid: number[][];
} {
  const lwlMin = 6.0, lwlMax = 7.5;
  const beamMin = 1.2, beamMax = 2.0;

  const lwlStep = (lwlMax - lwlMin) / (resolution - 1);
  const beamStep = (beamMax - beamMin) / (resolution - 1);

  const lwlRange: number[] = [];
  const beamRange: number[] = [];

  for (let i = 0; i < resolution; i++) {
    lwlRange.push(lwlMin + i * lwlStep);
    beamRange.push(beamMin + i * beamStep);
  }

  // Batch predict for efficiency
  const inputs: number[][] = [];
  for (const lwl of lwlRange) {
    for (const beam of beamRange) {
      const fullParams: HullParams = { ...params, lwl, beam };
      inputs.push(encodeInputs(fullParams));
    }
  }

  if (!normStats) {
    throw new Error('Model not trained yet');
  }

  const normalizedInputs = normalize(inputs, normStats.inputMean, normStats.inputStd);
  const inputTensor = tf.tensor2d(normalizedInputs);
  const outputTensor = model.predict(inputTensor) as tf.Tensor;
  const outputs = outputTensor.arraySync() as number[][];

  inputTensor.dispose();
  outputTensor.dispose();

  // Denormalize and reshape into grids
  const gmGrid: number[][] = [];
  const hullSpeedGrid: number[][] = [];
  const draftGrid: number[][] = [];

  let idx = 0;
  for (let i = 0; i < resolution; i++) {
    const gmRow: number[] = [];
    const speedRow: number[] = [];
    const draftRow: number[] = [];

    for (let j = 0; j < resolution; j++) {
      const denorm = denormalize(outputs[idx], normStats.outputMean, normStats.outputStd);
      gmRow.push(denorm[0]);
      speedRow.push(denorm[1]);
      draftRow.push(denorm[3]);
      idx++;
    }

    gmGrid.push(gmRow);
    hullSpeedGrid.push(speedRow);
    draftGrid.push(draftRow);
  }

  return { lwlRange, beamRange, gmGrid, hullSpeedGrid, draftGrid };
}

/**
 * Get normalization stats (for debugging/display)
 */
export function getNormalizationStats(): NormalizationStats | null {
  return normStats;
}
