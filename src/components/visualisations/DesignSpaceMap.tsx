'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useHullStore, useDesignSpaceData, useSurrogateReady, useSurrogateTraining, useTrainingProgress } from '@/state/useHullStore';

type MetricType = 'gm' | 'hullSpeed' | 'draft';

const METRIC_CONFIG: Record<MetricType, { label: string; unit: string; colorScale: string[] }> = {
  gm: {
    label: 'Metacentric Height (GM)',
    unit: 'm',
    colorScale: ['#DC2626', '#EA580C', '#FBBF24', '#84CC16', '#2563EB'],
  },
  hullSpeed: {
    label: 'Hull Speed',
    unit: 'kn',
    colorScale: ['#E0E7FF', '#A5B4FC', '#6366F1', '#4338CA', '#312E81'],
  },
  draft: {
    label: 'Draft',
    unit: 'm',
    colorScale: ['#ECFDF5', '#6EE7B7', '#10B981', '#047857', '#064E3B'],
  },
};

export function DesignSpaceMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [metric, setMetric] = useState<MetricType>('gm');
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  const designSpaceData = useDesignSpaceData();
  const ready = useSurrogateReady();
  const training = useSurrogateTraining();
  const progress = useTrainingProgress();
  const params = useHullStore((state) => state.params);
  const setParams = useHullStore((state) => state.setParams);

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
    if (!svgRef.current || !designSpaceData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 60, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { lwlRange, beamRange, gmGrid, hullSpeedGrid, draftGrid } = designSpaceData;

    // Select grid based on metric
    const grid = metric === 'gm' ? gmGrid : metric === 'hullSpeed' ? hullSpeedGrid : draftGrid;

    // Flatten grid to find extent
    const flatGrid = grid.flat();
    const [minVal, maxVal] = d3.extent(flatGrid) as [number, number];

    // Scales
    const xScale = d3.scaleLinear().domain([beamRange[0], beamRange[beamRange.length - 1]]).range([0, width]);
    const yScale = d3.scaleLinear().domain([lwlRange[0], lwlRange[lwlRange.length - 1]]).range([height, 0]);

    const colorScale = d3
      .scaleSequential()
      .domain([minVal, maxVal])
      .interpolator(d3.interpolateRgbBasis(METRIC_CONFIG[metric].colorScale));

    // Draw heatmap
    const cellWidth = width / (beamRange.length - 1);
    const cellHeight = height / (lwlRange.length - 1);

    for (let i = 0; i < lwlRange.length - 1; i++) {
      for (let j = 0; j < beamRange.length - 1; j++) {
        const value = grid[i][j];
        g.append('rect')
          .attr('x', xScale(beamRange[j]))
          .attr('y', yScale(lwlRange[i + 1]))
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', colorScale(value))
          .attr('opacity', 0.85);
      }
    }

    // Draw contours
    const contourData: number[] = [];
    for (let i = 0; i < lwlRange.length; i++) {
      for (let j = 0; j < beamRange.length; j++) {
        contourData.push(grid[i][j]);
      }
    }

    const contours = d3
      .contours()
      .size([beamRange.length, lwlRange.length])
      .thresholds(10)(contourData);

    const contourXScale = d3.scaleLinear().domain([0, beamRange.length - 1]).range([0, width]);
    const contourYScale = d3.scaleLinear().domain([0, lwlRange.length - 1]).range([height, 0]);

    g.append('g')
      .attr('class', 'contours')
      .selectAll('path')
      .data(contours)
      .enter()
      .append('path')
      .attr('d', d3.geoPath(d3.geoIdentity().scale(width / (beamRange.length - 1)).reflectY(true).translate([0, height])))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0,0,0,0.3)')
      .attr('stroke-width', 0.5);

    // Current position marker
    g.append('circle')
      .attr('cx', xScale(params.beam))
      .attr('cy', yScale(params.lwl))
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', '#0A0A0A')
      .attr('stroke-width', 2);

    g.append('circle')
      .attr('cx', xScale(params.beam))
      .attr('cy', yScale(params.lwl))
      .attr('r', 3)
      .attr('fill', '#0A0A0A');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${d}m`);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}m`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs')
      .text('Beam');

    g.append('g')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs')
      .text('LWL');

    // Color legend
    const legendWidth = 15;
    const legendHeight = height;
    const legendX = width + 10;

    const legendScale = d3.scaleLinear().domain([minVal, maxVal]).range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5).tickFormat((d) => (d as number).toFixed(2));

    // Legend gradient
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', `legend-gradient-${metric}`)
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '100%')
      .attr('y2', '0%');

    METRIC_CONFIG[metric].colorScale.forEach((color, i, arr) => {
      gradient
        .append('stop')
        .attr('offset', `${(i / (arr.length - 1)) * 100}%`)
        .attr('stop-color', color);
    });

    g.append('rect')
      .attr('x', legendX)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', `url(#legend-gradient-${metric})`);

    g.append('g')
      .attr('transform', `translate(${legendX + legendWidth},0)`)
      .call(legendAxis);

    // Title
    svg
      .append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs font-medium fill-current')
      .text(METRIC_CONFIG[metric].label);

    // Click handler
    svg.on('click', (event) => {
      const [mx, my] = d3.pointer(event);
      const beam = xScale.invert(mx - margin.left);
      const lwl = yScale.invert(my - margin.top);

      // Clamp to valid ranges
      const clampedBeam = Math.max(1.2, Math.min(2.0, beam));
      const clampedLwl = Math.max(6.0, Math.min(7.5, lwl));

      setParams({ beam: clampedBeam, lwl: clampedLwl });
    });

    svg.style('cursor', 'crosshair');
  }, [designSpaceData, dimensions, metric, params.beam, params.lwl, setParams]);

  // Training state
  if (training) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="text-sm text-muted-foreground">Training neural surrogate...</div>
        <div className="w-48 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono">{progress.toFixed(0)}%</div>
      </div>
    );
  }

  if (!ready || !designSpaceData) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Waiting for surrogate model...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-muted-foreground/20">
        <span className="text-xs text-muted-foreground">Show:</span>
        {(['gm', 'hullSpeed', 'draft'] as MetricType[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              metric === m
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'gm' ? 'GM' : m === 'hullSpeed' ? 'Speed' : 'Draft'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Click to explore</span>
      </div>
      <svg ref={svgRef} className="flex-1 w-full" />
    </div>
  );
}
