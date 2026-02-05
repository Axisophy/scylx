'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useHullStore } from '@/state/useHullStore';

interface SimulationResult {
  maxHeel: number;
  maxPitch: number;
  swamped: boolean;
}

interface MonteCarloState {
  results: SimulationResult[];
  running: boolean;
  totalRuns: number;
  swampedCount: number;
  dangerCount: number;
}

// Pierson-Moskowitz spectrum for significant wave height
function generateWaveHeight(Hs: number): number {
  // Rayleigh distribution approximation for wave heights
  const u = Math.random();
  return Hs * Math.sqrt(-2 * Math.log(1 - u)) * 0.5;
}

// Simulate a single wave encounter
function simulateEncounter(
  GM: number,
  beam: number,
  lwl: number,
  freeboard: number,
  waveHeight: number
): SimulationResult {
  // Simplified roll response model
  // Roll amplitude roughly proportional to wave steepness / GM
  const waveLength = 20 + Math.random() * 40; // Random wave period
  const waveSteepness = waveHeight / waveLength;

  // Roll RAO (Response Amplitude Operator) simplified
  const rollNatural = 2 * Math.PI * Math.sqrt(beam / (2 * 9.81 * GM));
  const encounterPeriod = waveLength / (5 + Math.random() * 5); // Random encounter

  // Resonance factor
  const tuning = encounterPeriod / rollNatural;
  const resonanceFactor = 1 / Math.sqrt(Math.pow(1 - tuning * tuning, 2) + 0.04);

  // Max heel angle (degrees)
  const baseRoll = (waveSteepness * 180 / Math.PI) * (beam / GM) * 20;
  const maxHeel = baseRoll * Math.min(resonanceFactor, 3) * (0.5 + Math.random());

  // Pitch response
  const maxPitch = (waveHeight / lwl) * 15 * (0.5 + Math.random());

  // Swamping check - if heel + wave > freeboard threshold
  const effectiveFreeboard = freeboard - waveHeight * 0.3;
  const heelSubmersion = beam * 0.5 * Math.sin(maxHeel * Math.PI / 180);
  const swamped = heelSubmersion > effectiveFreeboard || maxHeel > 60;

  return { maxHeel, maxPitch, swamped };
}

export function MonteCarloSeakeeping() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 150 });
  const [seaState, setSeaState] = useState(3); // Sea state 1-6

  const results = useHullStore((state) => state.results);
  const params = useHullStore((state) => state.params);

  const [state, setState] = useState<MonteCarloState>({
    results: [],
    running: false,
    totalRuns: 0,
    swampedCount: 0,
    dangerCount: 0,
  });

  const animationRef = useRef<number | null>(null);

  // Significant wave height by sea state (Beaufort scale approximation)
  const seaStateToHs: Record<number, number> = {
    1: 0.1,
    2: 0.3,
    3: 0.6,
    4: 1.2,
    5: 2.0,
    6: 3.5,
  };

  const runSimulation = useCallback(() => {
    const Hs = seaStateToHs[seaState] || 0.6;

    setState((prev) => {
      if (!prev.running || prev.totalRuns >= 500) {
        return { ...prev, running: false };
      }

      // Run batch of 10 simulations
      const newResults: SimulationResult[] = [];
      let swampedCount = prev.swampedCount;
      let dangerCount = prev.dangerCount;

      for (let i = 0; i < 10; i++) {
        const waveHeight = generateWaveHeight(Hs);
        const result = simulateEncounter(
          results.GM,
          params.beam,
          params.lwl,
          results.freeboard,
          waveHeight
        );

        newResults.push(result);
        if (result.swamped) swampedCount++;
        if (result.maxHeel > 30) dangerCount++;
      }

      return {
        ...prev,
        results: [...prev.results, ...newResults],
        totalRuns: prev.totalRuns + 10,
        swampedCount,
        dangerCount,
      };
    });
  }, [seaState, results.GM, results.freeboard, params.beam, params.lwl]);

  // Animation loop
  useEffect(() => {
    if (state.running) {
      const step = () => {
        runSimulation();
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
  }, [state.running, runSimulation]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height - 70 });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw histogram
  useEffect(() => {
    if (!svgRef.current || state.results.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 25, left: 35 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create histogram
    const heelAngles = state.results.map((r) => r.maxHeel);
    const bins = d3.bin()
      .domain([0, 60])
      .thresholds(20)(heelAngles);

    const xScale = d3.scaleLinear()
      .domain([0, 60])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) || 1])
      .range([height, 0]);

    // Draw bars
    g.selectAll('.bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.x0 || 0))
      .attr('y', (d) => yScale(d.length))
      .attr('width', (d) => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr('height', (d) => height - yScale(d.length))
      .attr('fill', (d) => {
        const midAngle = ((d.x0 || 0) + (d.x1 || 0)) / 2;
        if (midAngle > 45) return 'var(--danger)';
        if (midAngle > 30) return 'var(--warning)';
        return 'var(--safe)';
      })
      .attr('opacity', 0.8);

    // Danger threshold line
    g.append('line')
      .attr('x1', xScale(30))
      .attr('x2', xScale(30))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'var(--warning)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    g.append('text')
      .attr('x', xScale(30) + 3)
      .attr('y', 12)
      .attr('class', 'text-[8px] fill-warning')
      .text('Danger');

    // Capsize threshold
    g.append('line')
      .attr('x1', xScale(45))
      .attr('x2', xScale(45))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'var(--danger)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${d}°`);
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-[8px]');

    // Y axis
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
      .text('Max Heel Angle');

  }, [state.results, dimensions]);

  const handleStart = () => {
    setState({
      results: [],
      running: true,
      totalRuns: 0,
      swampedCount: 0,
      dangerCount: 0,
    });
  };

  const handleStop = () => {
    setState((prev) => ({ ...prev, running: false }));
  };

  const swampProbability = state.totalRuns > 0 ? (state.swampedCount / state.totalRuns * 100) : 0;
  const dangerProbability = state.totalRuns > 0 ? (state.dangerCount / state.totalRuns * 100) : 0;

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-muted-foreground/10">
        <label className="text-[9px] text-muted-foreground">Sea State:</label>
        <select
          value={seaState}
          onChange={(e) => setSeaState(parseInt(e.target.value))}
          className="text-[10px] bg-transparent border border-muted-foreground/30 rounded px-1 py-0.5"
          disabled={state.running}
        >
          <option value={2}>2 - Smooth (0.3m)</option>
          <option value={3}>3 - Slight (0.6m)</option>
          <option value={4}>4 - Moderate (1.2m)</option>
          <option value={5}>5 - Rough (2.0m)</option>
          <option value={6}>6 - Very Rough (3.5m)</option>
        </select>

        {!state.running ? (
          <button
            onClick={handleStart}
            className="px-2 py-0.5 text-[10px] bg-safe text-white rounded hover:opacity-90 transition-opacity"
          >
            Run 500
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-2 py-0.5 text-[10px] bg-warning text-white rounded hover:opacity-90 transition-opacity"
          >
            Stop
          </button>
        )}

        <div className="ml-auto text-[9px] font-mono text-muted-foreground">
          n={state.totalRuns}
        </div>
      </div>

      {/* Histogram */}
      <div className="flex-1 min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />

        {state.results.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Click Run to simulate wave encounters
          </div>
        )}
      </div>

      {/* Stats */}
      {state.totalRuns > 0 && (
        <div className="px-3 py-2 border-t border-muted-foreground/10 flex items-center gap-4 text-[9px]">
          <div>
            <span className="text-muted-foreground">P(heel &gt; 30°): </span>
            <span className={`font-mono ${dangerProbability > 20 ? 'text-warning' : 'text-safe'}`}>
              {dangerProbability.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">P(swamp): </span>
            <span className={`font-mono ${swampProbability > 5 ? 'text-danger' : 'text-safe'}`}>
              {swampProbability.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Mean heel: </span>
            <span className="font-mono">
              {(state.results.reduce((s, r) => s + r.maxHeel, 0) / state.results.length).toFixed(1)}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
