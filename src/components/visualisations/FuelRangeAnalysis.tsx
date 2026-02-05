'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateFuelAnalysis } from '@/engine/operations';
import * as d3 from 'd3';

function MetricCard({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-muted-foreground/5 rounded px-2 py-1.5">
      <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-sm ${highlight ? 'text-accent-primary' : ''}`}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

export function FuelRangeAnalysis() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const svgRef = useRef<SVGSVGElement>(null);

  const fuelAnalysis = useMemo(
    () => calculateFuelAnalysis(params, results.displacement),
    [params, results.displacement]
  );

  // D3 Chart
  useEffect(() => {
    if (!svgRef.current || fuelAnalysis.fuelCurve.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 50, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(fuelAnalysis.fuelCurve, (d) => d.speed) || 10])
      .range([0, innerWidth]);

    const yScaleConsumption = d3
      .scaleLinear()
      .domain([0, d3.max(fuelAnalysis.fuelCurve, (d) => d.consumption) || 10])
      .range([innerHeight, 0]);

    const yScaleEfficiency = d3
      .scaleLinear()
      .domain([0, d3.max(fuelAnalysis.fuelCurve, (d) => d.efficiency) || 5])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .attr('class', 'text-[9px] text-muted-foreground');

    g.append('g')
      .call(d3.axisLeft(yScaleConsumption).ticks(5))
      .attr('class', 'text-[9px] text-muted-foreground');

    g.append('g')
      .attr('transform', `translate(${innerWidth},0)`)
      .call(d3.axisRight(yScaleEfficiency).ticks(5))
      .attr('class', 'text-[9px] text-muted-foreground');

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 25)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted-foreground')
      .text('Speed (knots)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted-foreground')
      .text('Consumption (L/hr)');

    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('x', innerHeight / 2)
      .attr('y', -innerWidth - 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted-foreground')
      .text('Efficiency (nm/L)');

    // Consumption line
    const consumptionLine = d3
      .line<(typeof fuelAnalysis.fuelCurve)[0]>()
      .x((d) => xScale(d.speed))
      .y((d) => yScaleConsumption(d.consumption))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(fuelAnalysis.fuelCurve)
      .attr('fill', 'none')
      .attr('stroke', 'var(--warning)')
      .attr('stroke-width', 2)
      .attr('d', consumptionLine);

    // Efficiency line
    const efficiencyLine = d3
      .line<(typeof fuelAnalysis.fuelCurve)[0]>()
      .x((d) => xScale(d.speed))
      .y((d) => yScaleEfficiency(d.efficiency))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(fuelAnalysis.fuelCurve)
      .attr('fill', 'none')
      .attr('stroke', 'var(--safe)')
      .attr('stroke-width', 2)
      .attr('d', efficiencyLine);

    // Optimal cruise marker
    const optimalX = xScale(fuelAnalysis.optimalCruiseSpeed);
    g.append('line')
      .attr('x1', optimalX)
      .attr('x2', optimalX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'var(--accent-primary)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2');

    g.append('text')
      .attr('x', optimalX + 4)
      .attr('y', 10)
      .attr('class', 'text-[8px] fill-accent-primary')
      .text('Optimal');

    // Legend
    const legend = g.append('g').attr('transform', `translate(10, 0)`);

    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 15)
      .attr('y1', 5)
      .attr('y2', 5)
      .attr('stroke', 'var(--warning)')
      .attr('stroke-width', 2);
    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 8)
      .attr('class', 'text-[8px] fill-muted-foreground')
      .text('Consumption');

    legend
      .append('line')
      .attr('x1', 80)
      .attr('x2', 95)
      .attr('y1', 5)
      .attr('y2', 5)
      .attr('stroke', 'var(--safe)')
      .attr('stroke-width', 2);
    legend
      .append('text')
      .attr('x', 100)
      .attr('y', 8)
      .attr('class', 'text-[8px] fill-muted-foreground')
      .text('Efficiency');
  }, [fuelAnalysis]);

  const hullSpeed = 1.34 * Math.sqrt(params.lwl * 3.28084);

  return (
    <div className="h-full flex flex-col p-3">
      {/* Chart */}
      <div className="flex-1 min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-2 mt-2 pt-2 border-t border-muted-foreground/10">
        <MetricCard
          label="Optimal Cruise"
          value={fuelAnalysis.optimalCruiseSpeed}
          unit="kn"
          highlight
        />
        <MetricCard
          label="Consumption"
          value={fuelAnalysis.optimalConsumption}
          unit="L/hr"
        />
        <MetricCard
          label="Max Range"
          value={fuelAnalysis.maxRange}
          unit="nm"
          highlight
        />
        <MetricCard
          label="Endurance"
          value={fuelAnalysis.enduranceHours}
          unit="hrs"
        />
        <MetricCard
          label="Hull Speed"
          value={hullSpeed}
          unit="kn"
        />
      </div>

      {/* Engine sizing info */}
      <div className="mt-2 pt-2 border-t border-muted-foreground/10 flex gap-4 text-[9px] text-muted-foreground">
        <span>
          Engine sizing: <span className="text-foreground">{fuelAnalysis.minHP}</span> HP min /{' '}
          <span className="text-accent-primary font-medium">{fuelAnalysis.recommendedHP}</span> HP
          recommended / <span className="text-foreground">{fuelAnalysis.maxHP}</span> HP max
        </span>
      </div>
    </div>
  );
}
