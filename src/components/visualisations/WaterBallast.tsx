'use client';

import { useMemo } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateWaterBallast } from '@/engine/operations';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

function ComparisonBar({
  label,
  emptyValue,
  floodedValue,
  unit,
  higherIsBetter = true,
}: {
  label: string;
  emptyValue: number;
  floodedValue: number;
  unit: string;
  higherIsBetter?: boolean;
}) {
  const maxValue = Math.max(emptyValue, floodedValue) * 1.2;
  const emptyWidth = (emptyValue / maxValue) * 100;
  const floodedWidth = (floodedValue / maxValue) * 100;
  const isImproved = higherIsBetter ? floodedValue > emptyValue : floodedValue < emptyValue;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-[9px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={isImproved ? 'text-safe' : 'text-warning'}>
          {emptyValue.toFixed(2)} → {floodedValue.toFixed(2)} {unit}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground w-12">Empty</span>
          <div className="flex-1 h-2 bg-muted-foreground/10 rounded overflow-hidden">
            <div
              className="h-full bg-muted-foreground/40 rounded"
              style={{ width: `${emptyWidth}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground w-12">Flooded</span>
          <div className="flex-1 h-2 bg-muted-foreground/10 rounded overflow-hidden">
            <div
              className={`h-full rounded ${isImproved ? 'bg-safe' : 'bg-warning'}`}
              style={{ width: `${floodedWidth}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WaterBallast() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const ballast = useMemo(
    () => calculateWaterBallast(params, results.displacement, results.GM, results.draft),
    [params, results.displacement, results.GM, results.draft]
  );

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-2 right-2 z-10">
        <InfoTooltip title="Water Ballast">
          <p>
            A <strong>water ballast system</strong> allows you to increase stability by flooding tanks low in the hull when conditions demand it.
          </p>
          <p>
            <strong>How it works:</strong> Water (1kg/L) added low in the hull lowers the centre of gravity, increasing GM and making the boat stiffer.
          </p>
          <p>
            <strong>Trade-offs:</strong> Increased stability comes at the cost of higher displacement, deeper draft, and reduced freeboard.
          </p>
          <p>
            <strong>When to use:</strong> Heavy weather, when motoring into waves, or when sailing with a small crew. Drain the tanks for light-air sailing or shallow waters.
          </p>
        </InfoTooltip>
      </div>
      {/* Tank specs */}
      <div className="bg-accent-primary/10 border border-accent-primary/30 rounded p-2 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-accent-primary uppercase tracking-wider">
            Water Ballast Tank
          </span>
          <span className="px-1.5 py-0.5 text-[8px] bg-accent-primary/20 text-accent-primary rounded">
            {ballast.tankVolume} L
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div className="text-muted-foreground">Length</div>
            <div className="font-mono">{ballast.tankDimensions.length.toFixed(2)}m</div>
          </div>
          <div>
            <div className="text-muted-foreground">Width</div>
            <div className="font-mono">{ballast.tankDimensions.width.toFixed(2)}m</div>
          </div>
          <div>
            <div className="text-muted-foreground">Height</div>
            <div className="font-mono">{(ballast.tankDimensions.height * 100).toFixed(0)}cm</div>
          </div>
        </div>
        <div className="text-[9px] text-muted-foreground mt-1">
          Positioned {(ballast.tankCentreHeight * 100).toFixed(0)}cm above keel (as low as possible)
        </div>
      </div>

      {/* Stability comparison */}
      <div className="mb-3">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
          Stability Effect
        </div>
        <ComparisonBar
          label="Metacentric Height (GM)"
          emptyValue={ballast.emptyGM}
          floodedValue={ballast.floodedGM}
          unit="m"
          higherIsBetter={true}
        />
        <div className="bg-safe/10 border border-safe/30 rounded px-2 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-safe">GM Increase</span>
          <span className="font-mono text-safe">+{ballast.gmIncrease.toFixed(0)}%</span>
        </div>
      </div>

      {/* Draft/freeboard comparison */}
      <div className="mb-3">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
          Displacement Effect
        </div>
        <ComparisonBar
          label="Draft"
          emptyValue={ballast.emptyDraft}
          floodedValue={ballast.floodedDraft}
          unit="m"
          higherIsBetter={false}
        />
        <ComparisonBar
          label="Freeboard"
          emptyValue={ballast.emptyFreeboard}
          floodedValue={ballast.floodedFreeboard}
          unit="m"
          higherIsBetter={true}
        />
        <div className="text-[9px] text-muted-foreground">
          Adds {ballast.addedDisplacement}kg displacement when flooded
        </div>
      </div>

      {/* Fill/drain times */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-muted-foreground/5 rounded p-2">
          <div className="text-[8px] text-muted-foreground uppercase">Fill Time</div>
          <div className="font-mono text-sm">{ballast.fillTime.toFixed(0)} min</div>
          <div className="text-[8px] text-muted-foreground">@ 20 L/min pump</div>
        </div>
        <div className="bg-muted-foreground/5 rounded p-2">
          <div className="text-[8px] text-muted-foreground uppercase">Drain Time</div>
          <div className="font-mono text-sm">{ballast.drainTime.toFixed(0)} min</div>
          <div className="text-[8px] text-muted-foreground">gravity drain</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-auto">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
          When to Flood
        </div>
        <div className="space-y-0.5">
          {ballast.recommendedUse.map((use, i) => (
            <div key={i} className="text-[9px] flex items-start gap-1">
              <span className="text-safe">*</span>
              <span>{use}</span>
            </div>
          ))}
        </div>

        {ballast.warnings.length > 0 && (
          <div className="mt-2 pt-2 border-t border-muted-foreground/10">
            {ballast.warnings.map((warning, i) => (
              <div key={i} className="text-[9px] text-warning flex items-start gap-1">
                <span>!</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
