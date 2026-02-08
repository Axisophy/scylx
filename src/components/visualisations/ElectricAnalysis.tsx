'use client';

import { useMemo, useState } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateElectricSystem, type ClimateZone } from '@/engine/electric';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricRow({
  label,
  value,
  unit = '',
  highlight = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline py-0.5">
      <span className="text-muted-foreground text-[10px]">{label}</span>
      <span className={`font-mono text-[10px] ${highlight ? 'text-accent-primary font-medium' : ''}`}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-muted-foreground/60 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted-foreground/5 rounded p-2">
      <h4 className="text-[9px] font-medium text-muted uppercase tracking-wider mb-1.5">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ClimateSelector({
  value,
  onChange,
}: {
  value: ClimateZone;
  onChange: (v: ClimateZone) => void;
}) {
  const options: { value: ClimateZone; label: string }[] = [
    { value: 'tropical', label: 'Tropical' },
    { value: 'temperate', label: 'Temperate' },
    { value: 'nordic', label: 'Nordic' },
  ];

  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 text-[9px] rounded transition-colors ${
            value === opt.value
              ? 'bg-accent-primary text-background'
              : 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ElectricAnalysis() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const [climate, setClimate] = useState<ClimateZone>('temperate');

  const electric = useMemo(
    () => calculateElectricSystem(params, results.displacement, 4),
    [params, results.displacement]
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3 relative">
      <div className="absolute top-2 right-2 z-10">
        <InfoTooltip title="Electric Propulsion">
          <p>
            Sizing calculations for an <strong>electric propulsion</strong> system with solar charging capability.
          </p>
          <p>
            <strong>Solar panels:</strong> Based on available deck area. Daily harvest varies significantly by climate zone - tropical gets ~5x more usable sun hours than nordic winter.
          </p>
          <p>
            <strong>Motor sizing:</strong> Matched to hull resistance curve for efficient operation. Electric motors are most efficient at partial throttle.
          </p>
          <p>
            <strong>LiFePO4 vs AGM:</strong> Lithium iron phosphate batteries offer 2-3x the energy density and much longer cycle life, making them the preferred choice despite higher upfront cost.
          </p>
          <p>
            <strong>Range:</strong> Combines battery capacity with solar input for realistic daily cruising range estimates.
          </p>
        </InfoTooltip>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Climate zone:</span>
        <ClimateSelector value={climate} onChange={setClimate} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Solar */}
        <SectionCard title="Solar Panels">
          <MetricRow label="Available area" value={electric.solar.availableArea} unit="m2" />
          <MetricRow label="Panel capacity" value={electric.solar.maxPanelWatts} unit="Wp" highlight />
          <MetricRow
            label="Daily harvest"
            value={electric.solar.dailyHarvest[climate] / 1000}
            unit="kWh"
          />
          <MetricRow
            label="Propulsion hours"
            value={electric.solar.effectiveRange[climate]}
            unit="hrs/day"
          />
          <MetricRow
            label="Full charge time"
            value={electric.solar.chargeTime[climate]}
            unit="days"
          />
        </SectionCard>

        {/* Motor */}
        <SectionCard title="Electric Motor">
          <MetricRow label="Motor size" value={electric.propulsion.motorKw} unit="kW" highlight />
          <MetricRow label="Propeller" value={electric.propulsion.propDiameter} unit="in" />
          <MetricRow label="Thrust" value={electric.propulsion.thrustKg} unit="kg" />
          <MetricRow label="Cruise speed" value={electric.propulsion.cruiseSpeed} unit="kn" />
          <MetricRow label="Max speed" value={electric.propulsion.maxSpeed} unit="kn" />
          <MetricRow label="Efficiency" value={electric.propulsion.efficiencyAtSpeed * 100} unit="%" />
        </SectionCard>

        {/* LiFePO4 Battery */}
        <SectionCard title="LiFePO4 Battery">
          <MetricRow
            label="Capacity"
            value={electric.batteryLiFeP04.capacityKwh}
            unit="kWh"
            highlight
          />
          <MetricRow label="Weight" value={electric.batteryLiFeP04.weight} unit="kg" />
          <MetricRow label="Volume" value={electric.batteryLiFeP04.volume} unit="L" />
          <MetricRow label="Cycle life" value={electric.batteryLiFeP04.cycles} unit="cycles" />
          <MetricRow label="Range (cruise)" value={electric.batteryLiFeP04.rangeAtCruise} unit="hrs" />
          <MetricRow label="Range (hull spd)" value={electric.batteryLiFeP04.rangeAtHull} unit="hrs" />
          <MetricRow label="Cost" value={formatCurrency(electric.batteryLiFeP04.cost)} />
        </SectionCard>

        {/* AGM Comparison */}
        <SectionCard title="AGM Battery (Comparison)">
          <MetricRow
            label="Capacity"
            value={electric.batteryAGM.capacityKwh}
            unit="kWh"
            highlight
          />
          <MetricRow label="Weight" value={electric.batteryAGM.weight} unit="kg" />
          <MetricRow label="Volume" value={electric.batteryAGM.volume} unit="L" />
          <MetricRow label="Cycle life" value={electric.batteryAGM.cycles} unit="cycles" />
          <MetricRow label="Range (cruise)" value={electric.batteryAGM.rangeAtCruise} unit="hrs" />
          <MetricRow label="Cost" value={formatCurrency(electric.batteryAGM.cost)} />
          <div className="mt-1 text-[8px] text-warning">
            Note: AGM is 2-3x heavier for same capacity
          </div>
        </SectionCard>

        {/* Range Summary */}
        <div className="col-span-2">
          <SectionCard title="Daily Range Summary">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center bg-background/50 rounded p-1.5">
                <div className="text-[8px] text-muted-foreground">Solar Only</div>
                <div className="font-mono text-sm text-accent-primary">
                  {electric.rangeComparison.solarOnly[climate].toFixed(1)} nm
                </div>
                <div className="text-[8px] text-muted-foreground">per day</div>
              </div>
              <div className="text-center bg-background/50 rounded p-1.5">
                <div className="text-[8px] text-muted-foreground">Battery Only</div>
                <div className="font-mono text-sm text-accent-primary">
                  {electric.rangeComparison.batteryOnly.toFixed(1)} nm
                </div>
                <div className="text-[8px] text-muted-foreground">per charge</div>
              </div>
              <div className="text-center bg-background/50 rounded p-1.5">
                <div className="text-[8px] text-muted-foreground">Combined</div>
                <div className="font-mono text-sm text-safe">
                  {electric.rangeComparison.combined[climate].toFixed(1)} nm
                </div>
                <div className="text-[8px] text-muted-foreground">per day</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricRow
                label="Energy at cruise"
                value={electric.energyAtCruise}
                unit="Wh/nm"
              />
              <MetricRow
                label="Payback period"
                value={electric.paybackYears}
                unit="years"
              />
            </div>
          </SectionCard>
        </div>

        {/* Economics */}
        <div className="col-span-2">
          <SectionCard title="Economics (vs Petrol Outboard)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <MetricRow label="Annual fuel savings" value={formatCurrency(electric.annualSavings)} />
                <div className="text-[8px] text-muted-foreground mt-0.5">
                  Based on 50 hours/year usage
                </div>
              </div>
              <div>
                <MetricRow
                  label="System payback"
                  value={electric.paybackYears}
                  unit="years"
                  highlight
                />
                <div className="text-[8px] text-muted-foreground mt-0.5">
                  Includes battery, solar, motor
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-3 text-[8px] text-muted-foreground">
        <strong>Note:</strong> Calculations assume optimal conditions. Real-world performance
        varies with weather, loading, and sea state. LiFePO4 recommended for marine use due to
        safety and cycle life.
      </div>
    </div>
  );
}
