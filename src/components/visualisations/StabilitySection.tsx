'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useHullStore, useHeelAngle, useSetHeelAngle } from '@/state/useHullStore';
import { Slider } from '@/components/ui/Slider';
import { RightingCurve } from './RightingCurve';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export function StabilitySection() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [showCurve, setShowCurve] = useState(false);

  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const heelAngle = useHeelAngle();
  const setHeelAngle = useSetHeelAngle();

  // Calculate GZ at current heel angle
  const currentGZ = useMemo(() => {
    const point = results.rightingCurve.find(
      (p) => Math.abs(p.heelAngle - heelAngle) < 0.5
    );
    return point?.GZ || 0;
  }, [results.rightingCurve, heelAngle]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height - 60 }); // Account for slider
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left + width / 2},${margin.top + height * 0.7})`);

    // Scale: 1m = pixels (fit beam and depth)
    const maxDim = Math.max(params.beam, params.depth) * 1.3;
    const scale = Math.min(width, height * 1.2) / maxDim;

    // Heel rotation
    const heelRad = (heelAngle * Math.PI) / 180;

    // Hull cross-section points (simplified trapezoidal/vee shape)
    const halfBeam = params.beam / 2;
    const depth = params.depth;
    const draft = results.draft;
    const deadriseRad = (params.deadrise * Math.PI) / 180;

    // Hull shape based on type
    let hullPath: [number, number][];
    if (params.hullType === 'flat-bottom') {
      hullPath = [
        [-halfBeam, 0],
        [-halfBeam, -depth],
        [halfBeam, -depth],
        [halfBeam, 0],
      ];
    } else {
      // Vee bottom with deadrise
      const keelDepth = halfBeam * Math.tan(deadriseRad);
      hullPath = [
        [-halfBeam, 0],
        [-halfBeam * 0.9, -depth * 0.3],
        [0, -depth * 0.15 - keelDepth * 0.5],
        [halfBeam * 0.9, -depth * 0.3],
        [halfBeam, 0],
      ];
    }

    // Transform points for heel angle
    const rotatePoint = (x: number, y: number): [number, number] => {
      const cos = Math.cos(heelRad);
      const sin = Math.sin(heelRad);
      return [x * cos - y * sin, x * sin + y * cos];
    };

    const rotatedHull = hullPath.map(([x, y]) => rotatePoint(x, y));

    // Draw water (below waterline)
    const waterY = draft - depth; // Waterline relative to hull bottom
    g.append('rect')
      .attr('x', -width / 2)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height * 0.4)
      .attr('fill', 'var(--waterline)')
      .attr('opacity', 0.15);

    // Draw hull
    const lineGenerator = d3.line<[number, number]>()
      .x((d) => d[0] * scale)
      .y((d) => -d[1] * scale);

    // Hull fill (below waterline darker)
    g.append('path')
      .attr('d', lineGenerator(rotatedHull) + 'Z')
      .attr('fill', 'var(--hull-above)')
      .attr('stroke', 'var(--foreground)')
      .attr('stroke-width', 2);

    // Waterline
    g.append('line')
      .attr('x1', -width / 2)
      .attr('y1', 0)
      .attr('x2', width / 2)
      .attr('y2', 0)
      .attr('stroke', 'var(--waterline)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8,4');

    // Calculate marker positions
    const KB = results.KB;
    const KG = results.KG;
    const BM = results.BM;
    const GM = results.GM;

    // K (Keel) - at bottom of hull
    const kPos = rotatePoint(0, -depth);
    // B (Centre of Buoyancy)
    const bPos = rotatePoint(0, -depth + KB);
    // G (Centre of Gravity)
    const gPos = rotatePoint(0, -depth + KG);
    // M (Metacentre)
    const mPos = rotatePoint(0, -depth + KB + BM);

    // Draw vertical centerline (dashed)
    g.append('line')
      .attr('x1', kPos[0] * scale)
      .attr('y1', -kPos[1] * scale)
      .attr('x2', mPos[0] * scale)
      .attr('y2', -mPos[1] * scale)
      .attr('stroke', 'var(--muted-foreground)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Draw GM indicator (the key measurement)
    if (heelAngle === 0) {
      const gmStartY = -gPos[1] * scale;
      const gmEndY = -mPos[1] * scale;

      g.append('line')
        .attr('x1', 20)
        .attr('y1', gmStartY)
        .attr('x2', 20)
        .attr('y2', gmEndY)
        .attr('stroke', GM > 0.3 ? 'var(--safe)' : 'var(--danger)')
        .attr('stroke-width', 3);

      g.append('text')
        .attr('x', 30)
        .attr('y', (gmStartY + gmEndY) / 2)
        .attr('dy', '0.35em')
        .attr('class', 'text-xs font-mono font-bold')
        .attr('fill', GM > 0.3 ? 'var(--safe)' : 'var(--danger)')
        .text(`GM: ${GM.toFixed(2)}m`);
    }

    // Marker drawing function
    const drawMarker = (
      pos: [number, number],
      label: string,
      color: string,
      offsetX: number = 0
    ) => {
      const x = pos[0] * scale + offsetX;
      const y = -pos[1] * scale;

      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', x - 15)
        .attr('y', y)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('class', 'text-xs font-bold')
        .attr('fill', color)
        .text(label);
    };

    // Draw markers
    drawMarker(kPos, 'K', 'var(--muted)');
    drawMarker(bPos, 'B', 'var(--hull-below)');
    drawMarker(gPos, 'G', 'var(--warning)');
    drawMarker(mPos, 'M', 'var(--safe)');

    // Draw righting arm GZ when heeled
    if (heelAngle > 0) {
      // GZ is horizontal distance from G to vertical through B
      const gzLength = currentGZ;

      // Draw GZ arrow
      const gzStartX = gPos[0] * scale;
      const gzStartY = -gPos[1] * scale;
      const gzEndX = gzStartX + gzLength * scale * Math.cos(heelRad);
      const gzEndY = gzStartY - gzLength * scale * Math.sin(heelRad);

      g.append('line')
        .attr('x1', gzStartX)
        .attr('y1', gzStartY)
        .attr('x2', gzEndX)
        .attr('y2', gzEndY)
        .attr('stroke', 'var(--accent-secondary)')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      // Arrow marker definition
      svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 7)
        .attr('refX', 9)
        .attr('refY', 3.5)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0 0, 10 3.5, 0 7')
        .attr('fill', 'var(--accent-secondary)');

      // GZ label
      g.append('text')
        .attr('x', (gzStartX + gzEndX) / 2)
        .attr('y', (gzStartY + gzEndY) / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs font-mono font-bold')
        .attr('fill', 'var(--accent-secondary)')
        .text(`GZ: ${gzLength.toFixed(3)}m`);
    }

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left + 10},${margin.top + 10})`);

    const legendItems = [
      { label: 'K - Keel', color: 'var(--muted)' },
      { label: 'B - Buoyancy', color: 'var(--hull-below)' },
      { label: 'G - Gravity', color: 'var(--warning)' },
      { label: 'M - Metacentre', color: 'var(--safe)' },
    ];

    legendItems.forEach((item, i) => {
      const y = i * 14;
      legend
        .append('circle')
        .attr('cx', 5)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', item.color);
      legend
        .append('text')
        .attr('x', 14)
        .attr('y', y)
        .attr('dy', '0.35em')
        .attr('class', 'text-[10px]')
        .attr('fill', 'var(--muted)')
        .text(item.label);
    });
  }, [params, results, dimensions, heelAngle, currentGZ]);

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* View toggle */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-muted-foreground/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCurve(false)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              !showCurve
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cross-section
          </button>
          <button
            onClick={() => setShowCurve(true)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              showCurve
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            GZ Curve
          </button>
        </div>
        <InfoTooltip title="Stability Analysis">
          <p>
            <strong>Cross-section view:</strong> Shows the hull profile at maximum beam with key stability points marked.
          </p>
          <p>
            <strong>G</strong> = Centre of Gravity (where the boat's weight acts downward)
          </p>
          <p>
            <strong>B</strong> = Centre of Buoyancy (where water pressure acts upward)
          </p>
          <p>
            <strong>M</strong> = Metacentre (the pivot point for small heel angles)
          </p>
          <p>
            <strong>GM</strong> = Metacentric height. Larger GM means stiffer, more stable boat but quicker, less comfortable motion.
          </p>
          <p>
            <strong>GZ Curve:</strong> Shows righting arm vs heel angle. The area under this curve indicates how much energy is needed to capsize the boat.
          </p>
        </InfoTooltip>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {showCurve ? (
          <RightingCurve />
        ) : (
          <svg ref={svgRef} className="w-full h-full" />
        )}
      </div>

      {/* Heel angle slider */}
      <div className="px-4 pb-2 pt-1">
        <Slider
          label="Heel Angle"
          value={heelAngle}
          min={0}
          max={45}
          step={1}
          unit="°"
          decimals={0}
          onChange={setHeelAngle}
        />
      </div>
    </div>
  );
}
