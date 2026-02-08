'use client';

import { useMemo } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateAnchorSizing } from '@/engine/operations';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function AnchorCard({
  title,
  type,
  weight,
  rode,
  isSecondary = false,
}: {
  title: string;
  type: string;
  weight: number;
  rode: string;
  isSecondary?: boolean;
}) {
  return (
    <div className={`rounded p-2 ${isSecondary ? 'bg-muted-foreground/5' : 'bg-accent-primary/10 border border-accent-primary/30'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[9px] uppercase tracking-wider ${isSecondary ? 'text-muted-foreground' : 'text-accent-primary'}`}>
          {title}
        </span>
        <span className={`px-1.5 py-0.5 text-[8px] rounded ${isSecondary ? 'bg-muted-foreground/20' : 'bg-accent-primary/20 text-accent-primary'}`}>
          {type}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg">{weight}</span>
        <span className="text-[10px] text-muted-foreground">kg</span>
      </div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{rode}</div>
    </div>
  );
}

export function AnchorSizing() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const anchor = useMemo(
    () => calculateAnchorSizing(params, results.displacement),
    [params, results.displacement]
  );

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-2 right-2 z-10">
        <InfoTooltip title="Anchor Sizing">
          <p>
            Ground tackle recommendations based on boat displacement and windage, following manufacturer guidelines for modern anchor designs.
          </p>
          <p>
            <strong>Primary anchor:</strong> Your main anchor for overnight stays. Modern designs like Rocna/Mantus set quickly and hold well in most seabeds.
          </p>
          <p>
            <strong>Kedge:</strong> A lighter secondary anchor for kedging off sandbars, setting a stern anchor, or backup.
          </p>
          <p>
            <strong>Scope:</strong> The ratio of rode length to water depth. More scope = better holding. 5:1 minimum in calm conditions, 7:1+ in heavy weather.
          </p>
          <p>
            Chain provides weight to keep the pull horizontal - critical for holding power.
          </p>
        </InfoTooltip>
      </div>
      {/* Anchor cards */}
      <div className="grid grid-cols-2 gap-2">
        <AnchorCard
          title="Primary Anchor"
          type={anchor.primaryType}
          weight={anchor.primaryWeightKg}
          rode={`${anchor.chainLengthM}m × ${anchor.chainDiameter}mm chain`}
        />
        <AnchorCard
          title="Kedge Anchor"
          type={anchor.kedgeType}
          weight={anchor.kedgeWeightKg}
          rode={`${anchor.warpLengthM}m warp + 3m chain`}
          isSecondary
        />
      </div>

      {/* Scope diagram */}
      <div className="mt-3 p-2 bg-muted-foreground/5 rounded">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
          Scope Recommendations
        </div>
        <div className="flex items-end gap-2 h-16">
          {/* Normal conditions */}
          <div className="flex-1">
            <div className="bg-safe/30 rounded-t h-8 flex items-end justify-center pb-1">
              <span className="text-[10px] font-mono">{anchor.minScope}:1</span>
            </div>
            <div className="text-[8px] text-center text-muted-foreground mt-1">Normal</div>
          </div>
          {/* Heavy weather */}
          <div className="flex-1">
            <div className="bg-warning/30 rounded-t h-16 flex items-end justify-center pb-1">
              <span className="text-[10px] font-mono">{anchor.heavyWeatherScope}:1</span>
            </div>
            <div className="text-[8px] text-center text-muted-foreground mt-1">Heavy</div>
          </div>
        </div>
        <div className="text-[8px] text-muted-foreground mt-2">
          Scope = rode length : water depth. More scope = better holding.
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="mt-3 p-2 bg-muted-foreground/5 rounded">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
          Ground Tackle Cost
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Primary anchor ({anchor.primaryType} {anchor.primaryWeightKg}kg)</span>
            <span className="font-mono">{formatCurrency(anchor.costs.primaryAnchor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain ({anchor.chainLengthM}m × {anchor.chainDiameter}mm)</span>
            <span className="font-mono">{formatCurrency(anchor.costs.chain)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kedge anchor ({anchor.kedgeType} {anchor.kedgeWeightKg}kg)</span>
            <span className="font-mono">{formatCurrency(anchor.costs.kedgeAnchor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Warp ({anchor.warpLengthM}m)</span>
            <span className="font-mono">{formatCurrency(anchor.costs.warp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shackles & hardware</span>
            <span className="font-mono">{formatCurrency(anchor.costs.hardware)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-muted-foreground/20 font-medium">
            <span>Total</span>
            <span className="font-mono text-accent-primary">{formatCurrency(anchor.costs.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {anchor.notes.length > 0 && (
        <div className="mt-3 space-y-1">
          {anchor.notes.map((note, i) => (
            <div key={i} className="text-[9px] text-muted-foreground flex gap-1">
              <span className="text-accent-primary">*</span>
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
