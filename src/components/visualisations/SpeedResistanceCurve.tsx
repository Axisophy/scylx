'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useHullStore } from '@/state/useHullStore';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export function SpeedResistanceCurve() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [showPower, setShowPower] = useState(true);

  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

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

  // Draw visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 60, bottom: 45, left: 55 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { resistanceCurve, hullSpeed, maxSpeed } = results;

    // Scales
    const maxSpeedDisplay = Math.max(...resistanceCurve.map((d) => d.speed), maxSpeed + 1);
    const maxResistance = Math.max(...resistanceCurve.map((d) => d.Rtotal));
    const maxPower = Math.max(...resistanceCurve.map((d) => d.powerRequired));

    const xScale = d3.scaleLinear().domain([0, maxSpeedDisplay]).range([0, width]);
    const yScaleResistance = d3.scaleLinear().domain([0, maxResistance * 1.1]).range([height, 0]);
    const yScalePower = d3.scaleLinear().domain([0, maxPower * 1.1]).range([height, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScaleResistance.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScaleResistance(d))
      .attr('y2', (d) => yScaleResistance(d))
      .attr('stroke', 'var(--muted-foreground)')
      .attr('stroke-opacity', 0.1);

    // Hull speed zone (vertical band)
    g.append('rect')
      .attr('x', xScale(hullSpeed * 0.95))
      .attr('y', 0)
      .attr('width', xScale(hullSpeed * 0.1))
      .attr('height', height)
      .attr('fill', 'var(--warning)')
      .attr('opacity', 0.15);

    // Hull speed line
    g.append('line')
      .attr('x1', xScale(hullSpeed))
      .attr('y1', 0)
      .attr('x2', xScale(hullSpeed))
      .attr('y2', height)
      .attr('stroke', 'var(--warning)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3');

    // Hull speed label
    g.append('text')
      .attr('x', xScale(hullSpeed) + 5)
      .attr('y', 15)
      .attr('class', 'text-[10px] font-mono')
      .attr('fill', 'var(--warning)')
      .text(`Hull speed: ${hullSpeed.toFixed(1)}kn`);

    // Total resistance curve
    const resistanceLine = d3
      .line<(typeof resistanceCurve)[0]>()
      .x((d) => xScale(d.speed))
      .y((d) => yScaleResistance(d.Rtotal))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(resistanceCurve)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent-primary)')
      .attr('stroke-width', 2.5)
      .attr('d', resistanceLine);

    // Frictional resistance (lighter)
    const frictionLine = d3
      .line<(typeof resistanceCurve)[0]>()
      .x((d) => xScale(d.speed))
      .y((d) => yScaleResistance(d.Rf))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(resistanceCurve)
      .attr('fill', 'none')
      .attr('stroke', 'var(--muted)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
      .attr('d', frictionLine);

    // Power curve (on secondary axis)
    if (showPower) {
      const powerLine = d3
        .line<(typeof resistanceCurve)[0]>()
        .x((d) => xScale(d.speed))
        .y((d) => yScalePower(d.powerRequired))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(resistanceCurve)
        .attr('fill', 'none')
        .attr('stroke', 'var(--accent-secondary)')
        .attr('stroke-width', 2)
        .attr('d', powerLine);

      // Engine power available line
      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScalePower(params.engineHP * 0.7)) // Assume 70% efficiency
        .attr('x2', width)
        .attr('y2', yScalePower(params.engineHP * 0.7))
        .attr('stroke', 'var(--accent-secondary)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '8,4')
        .attr('opacity', 0.7);

      // Power axis
      const powerAxis = d3
        .axisRight(yScalePower)
        .ticks(5)
        .tickFormat((d) => `${d}hp`);

      g.append('g')
        .attr('transform', `translate(${width},0)`)
        .call(powerAxis)
        .attr('class', 'text-xs')
        .selectAll('text')
        .attr('fill', 'var(--accent-secondary)');
    }

    // Max achievable speed marker
    const maxSpeedPoint = resistanceCurve.find((d) => d.speed >= maxSpeed) || resistanceCurve[resistanceCurve.length - 1];
    if (maxSpeedPoint) {
      g.append('circle')
        .attr('cx', xScale(maxSpeed))
        .attr('cy', yScaleResistance(maxSpeedPoint.Rtotal))
        .attr('r', 5)
        .attr('fill', 'var(--safe)')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', xScale(maxSpeed))
        .attr('y', yScaleResistance(maxSpeedPoint.Rtotal) - 12)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[10px] font-mono font-bold')
        .attr('fill', 'var(--safe)')
        .text(`Max: ${maxSpeed.toFixed(1)}kn`);
    }

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat((d) => `${d}kn`);
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-xs');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs')
      .attr('fill', 'var(--muted)')
      .text('Speed (knots)');

    // Y axis (resistance)
    const yAxis = d3
      .axisLeft(yScaleResistance)
      .ticks(5)
      .tickFormat((d) => `${(+d / 1000).toFixed(1)}kN`);

    g.append('g')
      .call(yAxis)
      .attr('class', 'text-xs');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs')
      .attr('fill', 'var(--accent-primary)')
      .text('Resistance');

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left + 10},${margin.top + 10})`);

    const legendItems = [
      { label: 'Total resistance', color: 'var(--accent-primary)', dash: '' },
      { label: 'Friction only', color: 'var(--muted)', dash: '4,2' },
      ...(showPower ? [{ label: 'Power required', color: 'var(--accent-secondary)', dash: '' }] : []),
    ];

    legendItems.forEach((item, i) => {
      const y = i * 14;
      legend
        .append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', item.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', item.dash);
      legend
        .append('text')
        .attr('x', 25)
        .attr('y', y)
        .attr('dy', '0.35em')
        .attr('class', 'text-[10px]')
        .attr('fill', 'var(--muted)')
        .text(item.label);
    });

    // Title
    svg
      .append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs font-medium fill-current')
      .text('Speed vs Resistance');
  }, [params, results, dimensions, showPower]);

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-muted-foreground/20">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showPower}
            onChange={(e) => setShowPower(e.target.checked)}
            className="w-3 h-3"
          />
          Show power curve
        </label>
        {results.planingCapable && (
          <span className="text-xs text-accent-primary font-medium">
            Planing capable
          </span>
        )}
        <div className="ml-auto">
          <InfoTooltip title="Speed & Resistance">
            <p>
              Shows how resistance increases with speed for this hull configuration.
            </p>
            <p>
              <strong>Blue curve:</strong> Total resistance (friction + wave-making)
            </p>
            <p>
              <strong>Orange curve:</strong> Engine power required to overcome resistance at each speed
            </p>
            <p>
              <strong>Hull speed</strong> (dashed line) is the theoretical maximum for displacement hulls, where wave-making resistance increases dramatically. V = 1.34 × √LWL(ft).
            </p>
            <p>
              Beyond hull speed, the power required increases exponentially. Planing hulls can break through this barrier by rising onto their bow wave.
            </p>
          </InfoTooltip>
        </div>
      </div>
      <svg ref={svgRef} className="flex-1 w-full" />
    </div>
  );
}
