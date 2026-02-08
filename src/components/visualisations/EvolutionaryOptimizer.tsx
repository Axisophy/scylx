'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useHullStore } from '@/state/useHullStore';
import { calculatePhysics } from '@/engine/physics';
import { PARAM_BOUNDS } from '@/types/hull';
import type { HullParams, PhysicsResults } from '@/types/hull';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

type FitnessMetric = 'speed' | 'stability' | 'balanced';

interface Individual {
  params: HullParams;
  results: PhysicsResults;
  fitness: number;
}

interface EvolutionState {
  population: Individual[];
  generation: number;
  bestFitness: number;
  bestIndividual: Individual | null;
  running: boolean;
  history: { generation: number; bestFitness: number; avgFitness: number }[];
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createRandomIndividual(baseParams: HullParams): Individual {
  const params: HullParams = {
    ...baseParams,
    lwl: randomInRange(PARAM_BOUNDS.lwl.min, PARAM_BOUNDS.lwl.max),
    beam: randomInRange(PARAM_BOUNDS.beam.min, PARAM_BOUNDS.beam.max),
    depth: randomInRange(PARAM_BOUNDS.depth.min, PARAM_BOUNDS.depth.max),
    deadrise: randomInRange(PARAM_BOUNDS.deadrise.min, PARAM_BOUNDS.deadrise.max),
  };
  const results = calculatePhysics(params);
  return { params, results, fitness: 0 };
}

function calculateFitness(individual: Individual, metric: FitnessMetric): number {
  const { results } = individual;

  // Penalize infeasible designs
  if (results.freeboard < 0.15 || results.GM < 0.2) {
    return 0;
  }

  switch (metric) {
    case 'speed':
      return results.hullSpeed + results.maxSpeed * 0.5;
    case 'stability':
      return results.GM * 10 + (results.stabilityRating === 'stiff' ? 5 : 0);
    case 'balanced':
      // Pareto-style: maximize both
      const speedScore = results.hullSpeed / 7; // Normalize to ~1
      const stabilityScore = results.GM / 1.5; // Normalize to ~1
      return speedScore * stabilityScore * 10;
    default:
      return 0;
  }
}

function tournamentSelect(population: Individual[], tournamentSize: number = 3): Individual {
  let best: Individual | null = null;
  for (let i = 0; i < tournamentSize; i++) {
    const contestant = population[Math.floor(Math.random() * population.length)];
    if (!best || contestant.fitness > best.fitness) {
      best = contestant;
    }
  }
  return best!;
}

function crossover(parent1: Individual, parent2: Individual, baseParams: HullParams): HullParams {
  const alpha = Math.random();
  return {
    ...baseParams,
    lwl: alpha * parent1.params.lwl + (1 - alpha) * parent2.params.lwl,
    beam: alpha * parent1.params.beam + (1 - alpha) * parent2.params.beam,
    depth: alpha * parent1.params.depth + (1 - alpha) * parent2.params.depth,
    deadrise: alpha * parent1.params.deadrise + (1 - alpha) * parent2.params.deadrise,
  };
}

function mutate(params: HullParams, mutationRate: number = 0.2): HullParams {
  const mutated = { ...params };

  if (Math.random() < mutationRate) {
    const range = PARAM_BOUNDS.lwl.max - PARAM_BOUNDS.lwl.min;
    mutated.lwl = Math.max(PARAM_BOUNDS.lwl.min, Math.min(PARAM_BOUNDS.lwl.max,
      params.lwl + (Math.random() - 0.5) * range * 0.3));
  }
  if (Math.random() < mutationRate) {
    const range = PARAM_BOUNDS.beam.max - PARAM_BOUNDS.beam.min;
    mutated.beam = Math.max(PARAM_BOUNDS.beam.min, Math.min(PARAM_BOUNDS.beam.max,
      params.beam + (Math.random() - 0.5) * range * 0.3));
  }
  if (Math.random() < mutationRate) {
    const range = PARAM_BOUNDS.depth.max - PARAM_BOUNDS.depth.min;
    mutated.depth = Math.max(PARAM_BOUNDS.depth.min, Math.min(PARAM_BOUNDS.depth.max,
      params.depth + (Math.random() - 0.5) * range * 0.3));
  }
  if (Math.random() < mutationRate) {
    const range = PARAM_BOUNDS.deadrise.max - PARAM_BOUNDS.deadrise.min;
    mutated.deadrise = Math.max(PARAM_BOUNDS.deadrise.min, Math.min(PARAM_BOUNDS.deadrise.max,
      params.deadrise + (Math.random() - 0.5) * range * 0.3));
  }

  return mutated;
}

export function EvolutionaryOptimizer() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const [fitnessMetric, setFitnessMetric] = useState<FitnessMetric>('balanced');

  const baseParams = useHullStore((state) => state.params);
  const setParams = useHullStore((state) => state.setParams);

  const [state, setState] = useState<EvolutionState>({
    population: [],
    generation: 0,
    bestFitness: 0,
    bestIndividual: null,
    running: false,
    history: [],
  });

  const animationRef = useRef<number | null>(null);

  // Initialize population
  const initializePopulation = useCallback(() => {
    const population: Individual[] = [];
    for (let i = 0; i < 30; i++) {
      const individual = createRandomIndividual(baseParams);
      individual.fitness = calculateFitness(individual, fitnessMetric);
      population.push(individual);
    }

    const best = population.reduce((a, b) => a.fitness > b.fitness ? a : b);

    setState({
      population,
      generation: 0,
      bestFitness: best.fitness,
      bestIndividual: best,
      running: false,
      history: [{ generation: 0, bestFitness: best.fitness, avgFitness: population.reduce((s, i) => s + i.fitness, 0) / population.length }],
    });
  }, [baseParams, fitnessMetric]);

  // Evolution step
  const evolveStep = useCallback(() => {
    setState((prev) => {
      if (!prev.running || prev.generation >= 100) {
        return { ...prev, running: false };
      }

      const newPopulation: Individual[] = [];

      // Elitism: keep top 2
      const sorted = [...prev.population].sort((a, b) => b.fitness - a.fitness);
      newPopulation.push(sorted[0], sorted[1]);

      // Generate rest through selection, crossover, mutation
      while (newPopulation.length < prev.population.length) {
        const parent1 = tournamentSelect(prev.population);
        const parent2 = tournamentSelect(prev.population);

        let childParams = crossover(parent1, parent2, baseParams);
        childParams = mutate(childParams);

        const results = calculatePhysics(childParams);
        const child: Individual = {
          params: childParams,
          results,
          fitness: calculateFitness({ params: childParams, results, fitness: 0 }, fitnessMetric),
        };

        newPopulation.push(child);
      }

      const best = newPopulation.reduce((a, b) => a.fitness > b.fitness ? a : b);
      const avgFitness = newPopulation.reduce((s, i) => s + i.fitness, 0) / newPopulation.length;

      return {
        ...prev,
        population: newPopulation,
        generation: prev.generation + 1,
        bestFitness: best.fitness,
        bestIndividual: best,
        history: [...prev.history, { generation: prev.generation + 1, bestFitness: best.fitness, avgFitness }],
      };
    });
  }, [baseParams, fitnessMetric]);

  // Animation loop
  useEffect(() => {
    if (state.running) {
      const step = () => {
        evolveStep();
        animationRef.current = requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.running, evolveStep]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height - 80 });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw visualization
  useEffect(() => {
    if (!svgRef.current || state.population.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 25, left: 35 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Plot population on beam vs LWL space
    const xScale = d3.scaleLinear()
      .domain([PARAM_BOUNDS.beam.min, PARAM_BOUNDS.beam.max])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([PARAM_BOUNDS.lwl.min, PARAM_BOUNDS.lwl.max])
      .range([height, 0]);

    // Fitness color scale
    const maxFitness = Math.max(...state.population.map((i) => i.fitness), 1);
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, maxFitness]);

    // Draw population
    g.selectAll('.individual')
      .data(state.population)
      .enter()
      .append('circle')
      .attr('class', 'individual')
      .attr('cx', (d) => xScale(d.params.beam))
      .attr('cy', (d) => yScale(d.params.lwl))
      .attr('r', (d) => d === state.bestIndividual ? 6 : 3)
      .attr('fill', (d) => d === state.bestIndividual ? 'var(--accent-secondary)' : colorScale(d.fitness))
      .attr('stroke', (d) => d === state.bestIndividual ? 'white' : 'none')
      .attr('stroke-width', 2)
      .attr('opacity', (d) => d === state.bestIndividual ? 1 : 0.7)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setParams({
          lwl: d.params.lwl,
          beam: d.params.beam,
          depth: d.params.depth,
          deadrise: d.params.deadrise,
        });
      });

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(4);
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-[8px]');

    const yAxis = d3.axisLeft(yScale).ticks(4);
    g.append('g')
      .call(yAxis)
      .attr('class', 'text-[8px]');

    // Labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 20)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted')
      .text('Beam (m)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted')
      .text('LWL (m)');

  }, [state.population, state.bestIndividual, dimensions, setParams]);

  const handleStart = () => {
    if (state.population.length === 0) {
      initializePopulation();
    }
    setState((prev) => ({ ...prev, running: true }));
  };

  const handleStop = () => {
    setState((prev) => ({ ...prev, running: false }));
  };

  const handleReset = () => {
    setState((prev) => ({ ...prev, running: false }));
    initializePopulation();
  };

  const handleApplyBest = () => {
    if (state.bestIndividual) {
      setParams({
        lwl: state.bestIndividual.params.lwl,
        beam: state.bestIndividual.params.beam,
        depth: state.bestIndividual.params.depth,
        deadrise: state.bestIndividual.params.deadrise,
      });
    }
  };

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col relative">
      <div className="absolute top-2 right-2 z-10">
        <InfoTooltip title="Evolutionary Optimizer">
          <p>
            A <strong>genetic algorithm</strong> that evolves hull designs toward optimal performance.
          </p>
          <p>
            <strong>How it works:</strong> A population of random designs competes based on fitness. The best designs "breed" to create the next generation, with random mutations introducing variation.
          </p>
          <p>
            <strong>Fitness metrics:</strong> Choose between optimizing for speed, stability, or a balanced combination of both.
          </p>
          <p>
            <strong>Click any point</strong> to apply those parameters to your hull. The orange marker shows the current best individual.
          </p>
          <p>
            Evolution typically converges within 50-100 generations.
          </p>
        </InfoTooltip>
      </div>
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-muted-foreground/10">
        <select
          value={fitnessMetric}
          onChange={(e) => setFitnessMetric(e.target.value as FitnessMetric)}
          className="text-[10px] bg-transparent border border-muted-foreground/30 rounded px-1 py-0.5"
          disabled={state.running}
        >
          <option value="balanced">Balanced</option>
          <option value="speed">Max Speed</option>
          <option value="stability">Max Stability</option>
        </select>

        {!state.running ? (
          <button
            onClick={handleStart}
            className="px-2 py-0.5 text-[10px] bg-safe text-white rounded hover:opacity-90 transition-opacity"
          >
            {state.generation === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-2 py-0.5 text-[10px] bg-warning text-white rounded hover:opacity-90 transition-opacity"
          >
            Pause
          </button>
        )}

        <button
          onClick={handleReset}
          className="px-2 py-0.5 text-[10px] border border-muted-foreground/30 rounded hover:bg-muted-foreground/10 transition-colors"
          disabled={state.running}
        >
          Reset
        </button>

        <div className="ml-auto text-[10px] font-mono text-muted-foreground">
          Gen: <span className="text-foreground">{state.generation}</span>
        </div>
      </div>

      {/* Visualization */}
      <div className="flex-1 min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />

        {state.population.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Click Start to begin evolution
          </div>
        )}
      </div>

      {/* Best individual info */}
      {state.bestIndividual && (
        <div className="px-3 py-2 border-t border-muted-foreground/10 flex items-center gap-4">
          <div className="text-[9px]">
            <span className="text-muted-foreground">Best: </span>
            <span className="font-mono">
              {state.bestIndividual.params.lwl.toFixed(2)}m × {state.bestIndividual.params.beam.toFixed(2)}m
            </span>
          </div>
          <div className="text-[9px]">
            <span className="text-muted-foreground">GM: </span>
            <span className="font-mono">{state.bestIndividual.results.GM.toFixed(2)}m</span>
          </div>
          <div className="text-[9px]">
            <span className="text-muted-foreground">Speed: </span>
            <span className="font-mono">{state.bestIndividual.results.hullSpeed.toFixed(1)}kn</span>
          </div>
          <button
            onClick={handleApplyBest}
            className="ml-auto px-2 py-0.5 text-[9px] bg-accent-primary text-white rounded hover:opacity-90 transition-opacity"
          >
            Apply Best
          </button>
        </div>
      )}
    </div>
  );
}
