'use client';

import { useMemo } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateMaterialsEstimate } from '@/engine/practical';
import {
  calculateStructuralAnalysis,
  calculatePayloadAnalysis,
  calculateFlotationAnalysis,
  calculateCockpitDrainage,
} from '@/engine/structure';

function StatusBadge({ status }: { status: 'safe' | 'marginal' | 'reinforce' | 'optimal' | 'acceptable' | 'overloaded' | 'trimmed' }) {
  const colors = {
    safe: 'bg-safe/20 text-safe',
    optimal: 'bg-safe/20 text-safe',
    marginal: 'bg-warning/20 text-warning',
    acceptable: 'bg-warning/20 text-warning',
    trimmed: 'bg-warning/20 text-warning',
    reinforce: 'bg-danger/20 text-danger',
    overloaded: 'bg-danger/20 text-danger',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium uppercase ${colors[status]}`}>
      {status}
    </span>
  );
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

function SectionCard({ title, children, status }: { title: string; children: React.ReactNode; status?: 'safe' | 'marginal' | 'reinforce' | 'optimal' | 'acceptable' | 'overloaded' | 'trimmed' }) {
  return (
    <div className="bg-muted-foreground/5 rounded p-2">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-[9px] font-medium text-muted uppercase tracking-wider">
          {title}
        </h4>
        {status && <StatusBadge status={status} />}
      </div>
      {children}
    </div>
  );
}

export function StructureAnalysis() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const materials = useMemo(() => calculateMaterialsEstimate(params), [params]);
  const structure = useMemo(
    () => calculateStructuralAnalysis(params, results.displacement),
    [params, results.displacement]
  );
  const payload = useMemo(
    () => calculatePayloadAnalysis(params, results.displacement, materials.structureWeight),
    [params, results.displacement, materials.structureWeight]
  );
  const flotation = useMemo(
    () => calculateFlotationAnalysis(params, results.displacement, materials.structureWeight),
    [params, results.displacement, materials.structureWeight]
  );
  const drainage = useMemo(
    () => calculateCockpitDrainage(params, results.draft),
    [params, results.draft]
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Panel Analysis */}
        <SectionCard title="Panel Stiffness" status={structure.overallStatus}>
          <div className="space-y-1.5">
            {structure.panels.map((panel) => (
              <div key={panel.panelName} className="bg-background/50 rounded px-1.5 py-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-medium">{panel.panelName}</span>
                  <StatusBadge status={panel.status} />
                </div>
                <div className="grid grid-cols-3 gap-1 mt-0.5">
                  <div className="text-center">
                    <div className="text-[8px] text-muted-foreground">Pressure</div>
                    <div className="font-mono text-[9px]">{panel.designPressure.toFixed(1)} kPa</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-muted-foreground">Deflection</div>
                    <div className="font-mono text-[9px]">{panel.deflection.toFixed(1)} mm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-muted-foreground">SF</div>
                    <div className={`font-mono text-[9px] ${panel.safetyFactor > 2 ? 'text-safe' : panel.safetyFactor > 1.5 ? 'text-warning' : 'text-danger'}`}>
                      {panel.safetyFactor.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-muted-foreground/10">
            <MetricRow label="Frame spacing" value={structure.recommendedFrameSpacing * 1000} unit="mm" />
            <MetricRow label="Min thickness" value={structure.minimumThickness} unit="mm" />
          </div>
        </SectionCard>

        {/* Payload Analysis */}
        <SectionCard title="Payload Analysis" status={payload.status}>
          <MetricRow label="Max payload" value={payload.maxPayload} unit="kg" />
          <MetricRow label="Current payload" value={payload.currentPayload} unit="kg" />
          <div className="my-1.5">
            <div className="flex justify-between text-[8px] text-muted-foreground mb-0.5">
              <span>Payload capacity</span>
              <span>{(payload.payloadRatio * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted-foreground/20 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  payload.payloadRatio > 1 ? 'bg-danger' :
                  payload.payloadRatio > 0.8 ? 'bg-warning' : 'bg-safe'
                }`}
                style={{ width: `${Math.min(100, payload.payloadRatio * 100)}%` }}
              />
            </div>
          </div>
          <MetricRow label="Payload center" value={payload.centerOfPayload} unit="m from stern" />
          <MetricRow label="Trim angle" value={payload.trimAngle} unit="deg" />
        </SectionCard>

        {/* Flotation */}
        <SectionCard title="Flotation (ISO 12217)">
          <MetricRow label="Hull volume" value={flotation.hullVolume * 1000} unit="L" />
          <MetricRow label="Foam required" value={flotation.foamRequired} unit="L" highlight />
          <div className="mt-1.5 space-y-0.5">
            {flotation.foamLocations.map((loc) => (
              <div key={loc.location} className="flex justify-between text-[9px]">
                <span className="text-muted-foreground">{loc.location}</span>
                <span className="font-mono">{loc.volume.toFixed(0)} L</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-muted-foreground/10">
            <MetricRow label="Swamped freeboard" value={flotation.swampedFreeboard * 100} unit="cm" />
            <div className="flex justify-between items-center py-0.5">
              <span className="text-muted-foreground text-[10px]">ISO compliant</span>
              <span className={`text-[10px] ${flotation.iso12217Compliant ? 'text-safe' : 'text-danger'}`}>
                {flotation.iso12217Compliant ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Cockpit Drainage */}
        <SectionCard title="Cockpit Drainage">
          <MetricRow label="Cockpit area" value={drainage.cockpitArea} unit="m2" />
          <MetricRow label="Flooded volume" value={drainage.cockpitVolume} unit="L" />
          <MetricRow label="Drain diameter" value={drainage.drainDiameter} unit="mm" highlight />
          <MetricRow label="Number of drains" value={drainage.drainCount} />
          <MetricRow label="Drain time" value={drainage.drainTime} unit="sec" />
          <div className="mt-1.5 pt-1.5 border-t border-muted-foreground/10">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-muted-foreground text-[10px]">Self-draining</span>
              <span className={`text-[10px] font-medium ${drainage.selfDraining ? 'text-safe' : 'text-warning'}`}>
                {drainage.selfDraining ? 'Yes' : 'No'}
              </span>
            </div>
            {!drainage.selfDraining && (
              <div className="text-[8px] text-warning mt-0.5">
                Cockpit floor below waterline - manual pump required
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 text-[8px] text-muted-foreground">
        <strong>Note:</strong> Structural analysis based on simplified ISO 12215-5 calculations.
        Professional naval architect review recommended for actual construction.
      </div>
    </div>
  );
}
