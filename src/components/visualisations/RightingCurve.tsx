'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useHullStore, useHeelAngle } from '@/state/useHullStore';

export function RightingCurve() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 100 });

  const results = useHullStore((state) => state.results);
  const heelAngle = useHeelAngle();

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
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 8, right: 8, bottom: 20, left: 30 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { rightingCurve } = results;

    // Scales
    const xScale = d3.scaleLinear().domain([0, 45]).range([0, width]);
    const yMax = Math.max(...rightingCurve.map((d) => Math.abs(d.GZ)), 0.5);
    const yScale = d3.scaleLinear().domain([-yMax * 0.2, yMax]).range([height, 0]);

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'var(--muted-foreground)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Area fill
    const area = d3
      .area<(typeof rightingCurve)[0]>()
      .x((d) => xScale(d.heelAngle))
      .y0(yScale(0))
      .y1((d) => yScale(d.GZ))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(rightingCurve)
      .attr('fill', 'var(--safe)')
      .attr('fill-opacity', 0.2)
      .attr('d', area);

    // Line
    const line = d3
      .line<(typeof rightingCurve)[0]>()
      .x((d) => xScale(d.heelAngle))
      .y((d) => yScale(d.GZ))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(rightingCurve)
      .attr('fill', 'none')
      .attr('stroke', 'var(--safe)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Current heel angle marker
    const currentGZ = rightingCurve.find(
      (p) => Math.abs(p.heelAngle - heelAngle) < 1
    )?.GZ || 0;

    g.append('line')
      .attr('x1', xScale(heelAngle))
      .attr('x2', xScale(heelAngle))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'var(--accent-secondary)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');

    g.append('circle')
      .attr('cx', xScale(heelAngle))
      .attr('cy', yScale(currentGZ))
      .attr('r', 4)
      .attr('fill', 'var(--accent-secondary)')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5);

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${d}°`);
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-[9px]');

    // Y axis
    const yAxis = d3.axisLeft(yScale).ticks(3).tickFormat((d) => `${(d as number).toFixed(2)}`);
    g.append('g')
      .call(yAxis)
      .attr('class', 'text-[9px]');

    // Labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 16)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted')
      .text('Heel angle');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -22)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] fill-muted')
      .text('GZ (m)');
  }, [results, dimensions, heelAngle]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
