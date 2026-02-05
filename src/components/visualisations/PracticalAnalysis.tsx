'use client';

import { useMemo } from 'react';
import { useHullStore } from '@/state/useHullStore';
import {
  calculateMaterialsEstimate,
  calculateBuildTime,
  calculateTrailerRequirements,
  calculateMooringCosts,
} from '@/engine/practical';

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

export function PracticalAnalysis() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const materials = useMemo(() => calculateMaterialsEstimate(params), [params]);
  const buildTime = useMemo(() => calculateBuildTime(params), [params]);
  const trailer = useMemo(
    () => calculateTrailerRequirements(params, results.displacement, materials.structureWeight),
    [params, results.displacement, materials.structureWeight]
  );
  const mooring = useMemo(() => calculateMooringCosts(params), [params]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Materials */}
        <SectionCard title="Materials (Stitch & Glue)">
          <MetricRow label="Plywood sheets (6mm)" value={materials.plywoodSheets} unit="sheets" />
          <MetricRow label="Plywood area" value={materials.plywoodArea} unit="m2" />
          <MetricRow label="Epoxy" value={materials.epoxyWeight} unit="kg" />
          <MetricRow label="Fibreglass cloth" value={materials.glassArea} unit="m2" />
          <MetricRow label="Antifouling" value={materials.copperPaintLitres} unit="L" />
          <div className="mt-1.5 pt-1.5 border-t border-muted-foreground/10">
            <MetricRow label="Structure weight" value={materials.structureWeight} unit="kg" highlight />
          </div>
        </SectionCard>

        {/* Costs */}
        <SectionCard title="Material Costs">
          <MetricRow label="Plywood" value={formatCurrency(materials.plywoodCost)} />
          <MetricRow label="Epoxy" value={formatCurrency(materials.epoxyCost)} />
          <MetricRow label="Fibreglass" value={formatCurrency(materials.glassCost)} />
          <MetricRow label="Paint" value={formatCurrency(materials.paintCost)} />
          <MetricRow label="Hardware" value={formatCurrency(materials.hardwareCost)} />
          <div className="mt-1.5 pt-1.5 border-t border-muted-foreground/10">
            <MetricRow label="Total materials" value={formatCurrency(materials.totalMaterialsCost)} highlight />
          </div>
        </SectionCard>

        {/* Build Time */}
        <SectionCard title="Build Time">
          <MetricRow label="Cutting & lofting" value={buildTime.cuttingHours} unit="hrs" />
          <MetricRow label="Stitching" value={buildTime.stitchingHours} unit="hrs" />
          <MetricRow label="Taping seams" value={buildTime.tapingHours} unit="hrs" />
          <MetricRow label="Glassing" value={buildTime.glassingHours} unit="hrs" />
          <MetricRow label="Fairing" value={buildTime.fairingHours} unit="hrs" />
          <MetricRow label="Painting" value={buildTime.paintingHours} unit="hrs" />
          <div className="mt-1.5 pt-1.5 border-t border-muted-foreground/10">
            <MetricRow label="Total hours" value={buildTime.totalHours} unit="hrs" highlight />
            <MetricRow label="Weekend builds" value={buildTime.weekends} unit="weekends" />
          </div>
        </SectionCard>

        {/* Trailer */}
        <SectionCard title="Trailer Requirements">
          <MetricRow label="Boat weight (dry)" value={trailer.boatWeight} unit="kg" />
          <MetricRow label="Loaded weight" value={trailer.loadedWeight} unit="kg" />
          <MetricRow label="Trailer capacity" value={trailer.trailerCapacity} unit="kg" highlight />
          <MetricRow label="Trailer length" value={trailer.trailerLength} unit="m" />
          <MetricRow label="Beam with trailer" value={trailer.beamWithTrailer} unit="m" />
          <MetricRow label="Max ramp grade" value={trailer.launchRampGrade} unit="deg" />
          <MetricRow label="Tow vehicle" value={trailer.towVehicleClass} />
          <MetricRow
            label="Registration"
            value={trailer.registrationRequired ? 'Required' : 'Not required'}
          />
        </SectionCard>

        {/* Mooring Costs */}
        <div className="col-span-2">
          <SectionCard title="Annual Mooring Costs (Estimates)">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="font-mono text-[11px] text-accent-primary">
                  {formatCurrency(mooring.swingingMooringAnnual)}
                </div>
                <div className="text-[8px] text-muted-foreground">Swing mooring</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[11px] text-accent-primary">
                  {formatCurrency(mooring.pileAnnual)}
                </div>
                <div className="text-[8px] text-muted-foreground">Pile mooring</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[11px] text-accent-primary">
                  {formatCurrency(mooring.marinaBerthAnnual)}
                </div>
                <div className="text-[8px] text-muted-foreground">Marina berth</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[11px] text-accent-primary">
                  {formatCurrency(mooring.drySailAnnual)}
                </div>
                <div className="text-[8px] text-muted-foreground">Dry sail</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-3 text-[8px] text-muted-foreground">
        <strong>Note:</strong> Estimates based on amateur build with marine-grade materials.
        Costs vary significantly by region. Build time assumes intermediate woodworking skills.
      </div>
    </div>
  );
}
