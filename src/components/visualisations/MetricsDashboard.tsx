'use client';

import { useHullStore } from '@/state/useHullStore';
import { formatNumber } from '@/lib/utils';
import type { StabilityRating } from '@/types/hull';

interface MetricProps {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  color?: string;
}

function Metric({ label, value, unit, highlight = false, color }: MetricProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`font-mono text-base tabular-nums ${highlight ? 'font-semibold' : ''}`}
        style={color ? { color } : undefined}
      >
        {value}
        <span className="text-muted-foreground ml-0.5 text-sm">{unit}</span>
      </span>
    </div>
  );
}

function StabilityBar({ rating }: { rating: StabilityRating }) {
  const levels = ['dangerous', 'tender', 'moderate', 'stiff'] as const;
  const currentIndex = levels.indexOf(rating);

  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        Stability
      </span>
      <div className="flex items-center gap-1 mt-1">
        {levels.map((level, i) => {
          const isActive = i <= currentIndex;
          let bgColor = 'bg-muted-foreground/20';

          if (isActive) {
            if (level === 'dangerous') bgColor = 'bg-danger';
            else if (level === 'tender') bgColor = 'bg-warning';
            else bgColor = 'bg-safe';
          }

          return (
            <div
              key={level}
              className={`h-4 w-6 rounded-sm transition-colors ${bgColor}`}
              title={level}
            />
          );
        })}
        <span className="ml-2 text-sm font-mono capitalize">{rating}</span>
      </div>
    </div>
  );
}

export function MetricsDashboard() {
  const results = useHullStore((state) => state.results);

  // Color-code GM based on stability
  const gmColor =
    results.stabilityRating === 'dangerous'
      ? 'var(--danger)'
      : results.stabilityRating === 'tender'
        ? 'var(--warning)'
        : 'var(--safe)';

  return (
    <div className="h-16 border-t border-muted-foreground/20 bg-background px-4 flex items-center gap-8 animate-fade-in">
      <Metric
        label="Hull Speed"
        value={formatNumber(results.hullSpeed, 1)}
        unit="kn"
        highlight
      />
      <Metric
        label="Displacement"
        value={formatNumber(results.displacement, 0)}
        unit="kg"
      />
      <Metric
        label="Draft"
        value={formatNumber(results.draft, 2)}
        unit="m"
      />
      <Metric
        label="Freeboard"
        value={formatNumber(results.freeboard, 2)}
        unit="m"
        color={results.freeboard < 0.2 ? 'var(--danger)' : undefined}
      />
      <Metric
        label="GM"
        value={formatNumber(results.GM, 2)}
        unit="m"
        highlight
        color={gmColor}
      />
      <StabilityBar rating={results.stabilityRating} />
      <div className="flex flex-col ml-auto">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Max Speed
        </span>
        <span className="font-mono text-base tabular-nums">
          {formatNumber(results.maxSpeed, 1)}
          <span className="text-muted-foreground ml-0.5 text-sm">kn</span>
          {results.planingCapable && (
            <span className="ml-2 text-xs text-accent-primary">PLANING</span>
          )}
        </span>
      </div>
    </div>
  );
}
