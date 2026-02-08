'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useHullStore } from '@/state/useHullStore';
import { calculatePhysics } from '@/engine/physics';
import { PARAM_BOUNDS } from '@/types/hull';
import type { HullParams } from '@/types/hull';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

type OutputMetric = 'GM' | 'hullSpeed' | 'displacement' | 'draft';
type NumericParamKey = 'lwl' | 'beam' | 'depth' | 'deadrise' | 'crewWeight' | 'cargoWeight' | 'ballastWeight' | 'ballastHeight' | 'engineHP';

interface SensitivityResult {
  param: NumericParamKey;
  label: string;
  impact: number;
  direction: 'positive' | 'negative';
}

const NUMERIC_PARAMS: { key: NumericParamKey; label: string }[] = [
  { key: 'lwl', label: 'Length' },
  { key: 'beam', label: 'Beam' },
  { key: 'depth', label: 'Depth' },
  { key: 'deadrise', label: 'Deadrise' },
  { key: 'crewWeight', label: 'Crew' },
  { key: 'cargoWeight', label: 'Cargo' },
  { key: 'ballastWeight', label: 'Ballast' },
  { key: 'engineHP', label: 'Engine HP' },
];

function calculateSensitivity(
  baseParams: HullParams,
  metric: OutputMetric,
  perturbation: number = 0.1
): SensitivityResult[] {
  const baseResults = calculatePhysics(baseParams);
  const baseValue = baseResults[metric] as number;

  const results: SensitivityResult[] = [];

  for (const { key, label } of NUMERIC_PARAMS) {
    const currentValue = baseParams[key];
    const bounds = PARAM_BOUNDS[key];

    if (!bounds) continue;

    const range = bounds.max - bounds.min;
    const delta = range * perturbation;

    // Perturb up
    const upParams: HullParams = { ...baseParams, [key]: Math.min(currentValue + delta, bounds.max) };
    const upResults = calculatePhysics(upParams);
    const upValue = upResults[metric] as number;

    // Perturb down
    const downParams: HullParams = { ...baseParams, [key]: Math.max(currentValue - delta, bounds.min) };
    const downResults = calculatePhysics(downParams);
    const downValue = downResults[metric] as number;

    // Calculate sensitivity (change in output per unit change in input, normalized)
    const sensitivity = ((upValue - downValue) / (2 * delta)) * (range / Math.max(baseValue, 0.001));

    results.push({
      param: key,
      label,
      impact: Math.abs(sensitivity),
      direction: sensitivity >= 0 ? 'positive' : 'negative',
    });
  }

  // Sort by impact
  results.sort((a, b) => b.impact - a.impact);

  return results;
}

export function SensitivityChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 150 });
  const [selectedMetric, setSelectedMetric] = useState<OutputMetric>('GM');

  const params = useHullStore((state) => state.params);

  const sensitivityData = useMemo(() => {
    return calculateSensitivity(params, selectedMetric);
  }, [params, selectedMetric]);

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

  // Draw tornado chart
  useEffect(() => {
    if (!svgRef.current || sensitivityData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 5, right: 10, bottom: 5, left: 55 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - 35 - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top + 30})`);

    // Take top 6 parameters
    const topData = sensitivityData.slice(0, 6);
    const maxImpact = Math.max(...topData.map((d) => d.impact));

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, maxImpact * 1.1])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(topData.map((d) => d.label))
      .range([0, height])
      .padding(0.25);

    // Bars
    g.selectAll('.bar')
      .data(topData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.label) || 0)
      .attr('width', (d) => xScale(d.impact))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => d.direction === 'positive' ? 'var(--safe)' : 'var(--warning)')
      .attr('rx', 2);

    // Labels
    g.selectAll('.label')
      .data(topData)
      .enter()
      .append('text')
      .attr('class', 'label text-[9px]')
      .attr('x', -5)
      .attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--muted)')
      .text((d) => d.label);

    // Impact values
    g.selectAll('.value')
      .data(topData)
      .enter()
      .append('text')
      .attr('class', 'value text-[8px] font-mono')
      .attr('x', (d) => xScale(d.impact) + 4)
      .attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'var(--muted-foreground)')
      .text((d) => d.impact.toFixed(2));

    // Direction indicators
    g.selectAll('.direction')
      .data(topData)
      .enter()
      .append('text')
      .attr('class', 'direction text-[8px]')
      .attr('x', (d) => xScale(d.impact) + 28)
      .attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', (d) => d.direction === 'positive' ? 'var(--safe)' : 'var(--warning)')
      .text((d) => d.direction === 'positive' ? '↑' : '↓');

  }, [sensitivityData, dimensions]);

  const metricLabels: Record<OutputMetric, string> = {
    GM: 'Stability (GM)',
    hullSpeed: 'Hull Speed',
    displacement: 'Displacement',
    draft: 'Draft',
  };

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col">
      {/* Metric selector */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-muted-foreground/10">
        {(Object.keys(metricLabels) as OutputMetric[]).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-2 py-0.5 text-[9px] rounded transition-colors ${
              selectedMetric === metric
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {metric}
          </button>
        ))}
        <div className="ml-auto">
          <InfoTooltip title="Sensitivity Analysis">
            <p>
              A <strong>tornado chart</strong> showing which parameters have the greatest impact on the selected metric.
            </p>
            <p>
              Longer bars mean higher sensitivity - small changes in that parameter cause large changes in the output.
            </p>
            <p>
              <strong>Green:</strong> Increasing the parameter improves the metric
            </p>
            <p>
              <strong>Red:</strong> Increasing the parameter worsens the metric
            </p>
            <p>
              This helps identify which parameters to focus on during design optimization.
            </p>
          </InfoTooltip>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-2 py-1 text-[8px] text-muted-foreground border-t border-muted-foreground/10">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-safe" />
          Positive correlation
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-warning" />
          Negative correlation
        </span>
      </div>
    </div>
  );
}
