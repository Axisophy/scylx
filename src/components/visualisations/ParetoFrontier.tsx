'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useHullStore, useSurrogateReady } from '@/state/useHullStore';
import { calculatePhysics } from '@/engine/physics';
import type { HullParams, PhysicsResults } from '@/types/hull';

interface ParetoPoint {
  params: HullParams;
  results: PhysicsResults;
  isPareto: boolean;
}

function generateParetoData(baseParams: HullParams, resolution: number = 25): ParetoPoint[] {
  const points: ParetoPoint[] = [];

  // Sample across beam and LWL space
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const lwl = 6.0 + (i / (resolution - 1)) * 1.5;
      const beam = 1.2 + (j / (resolution - 1)) * 0.8;

      const params: HullParams = {
        ...baseParams,
        lwl,
        beam,
      };

      const results = calculatePhysics(params);

      points.push({
        params,
        results,
        isPareto: false,
      });
    }
  }

  // Compute Pareto frontier (maximize both GM and hull speed)
  points.forEach((point) => {
    const dominated = points.some(
      (other) =>
        other !== point &&
        other.results.GM >= point.results.GM &&
        other.results.hullSpeed >= point.results.hullSpeed &&
        (other.results.GM > point.results.GM || other.results.hullSpeed > point.results.hullSpeed)
    );
    point.isPareto = !dominated;
  });

  return points;
}

export function ParetoFrontier() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 150 });

  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const setParams = useHullStore((state) => state.setParams);
  const surrogateReady = useSurrogateReady();

  // Generate Pareto data
  const paretoData = useMemo(() => {
    return generateParetoData(params, 20);
  }, [params.hullType, params.deadrise, params.crewWeight, params.cargoWeight]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw chart
  useEffect(() => {
    if (!svgRef.current || paretoData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 15, right: 15, bottom: 35, left: 45 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(paretoData, (d) => d.results.GM) as [number, number];
    const yExtent = d3.extent(paretoData, (d) => d.results.hullSpeed) as [number, number];

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] * 0.9, xExtent[1] * 1.1])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] * 0.95, yExtent[1] * 1.05])
      .range([height, 0]);

    // Color scale for displacement
    const colorExtent = d3.extent(paretoData, (d) => d.results.displacement) as [number, number];
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(colorExtent);

    // Draw all points
    g.selectAll('.point')
      .data(paretoData.filter((d) => !d.isPareto))
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (d) => xScale(d.results.GM))
      .attr('cy', (d) => yScale(d.results.hullSpeed))
      .attr('r', 3)
      .attr('fill', (d) => colorScale(d.results.displacement))
      .attr('opacity', 0.4)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setParams({ lwl: d.params.lwl, beam: d.params.beam });
      });

    // Draw Pareto frontier points
    const paretoPoints = paretoData.filter((d) => d.isPareto);
    paretoPoints.sort((a, b) => a.results.GM - b.results.GM);

    // Pareto line
    const paretoLine = d3.line<ParetoPoint>()
      .x((d) => xScale(d.results.GM))
      .y((d) => yScale(d.results.hullSpeed))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(paretoPoints)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent-primary)')
      .attr('stroke-width', 2)
      .attr('d', paretoLine);

    // Pareto points
    g.selectAll('.pareto-point')
      .data(paretoPoints)
      .enter()
      .append('circle')
      .attr('class', 'pareto-point')
      .attr('cx', (d) => xScale(d.results.GM))
      .attr('cy', (d) => yScale(d.results.hullSpeed))
      .attr('r', 5)
      .attr('fill', 'var(--accent-primary)')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setParams({ lwl: d.params.lwl, beam: d.params.beam });
      });

    // Current design marker
    g.append('circle')
      .attr('cx', xScale(results.GM))
      .attr('cy', yScale(results.hullSpeed))
      .attr('r', 8)
      .attr('fill', 'var(--accent-secondary)')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', xScale(results.GM) + 12)
      .attr('y', yScale(results.hullSpeed) + 4)
      .attr('class', 'text-[9px] font-bold')
      .attr('fill', 'var(--accent-secondary)')
      .text('Current');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${(d as number).toFixed(1)}`);
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-[9px]');

    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${(d as number).toFixed(1)}`);
    g.append('g')
      .call(yAxis)
      .attr('class', 'text-[9px]');

    // Labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 28)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[9px] fill-muted')
      .text('Stability (GM, m)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -32)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[9px] fill-muted')
      .text('Hull Speed (kn)');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left + width - 60}, ${margin.top + 5})`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 15)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', 'var(--accent-primary)')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 3)
      .attr('class', 'text-[8px] fill-muted')
      .text('Pareto front');

  }, [paretoData, results, dimensions, setParams]);

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-1 right-2 text-[8px] text-muted-foreground">
        Click any point to explore
      </div>
    </div>
  );
}
