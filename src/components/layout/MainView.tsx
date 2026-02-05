'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { StabilitySection } from '@/components/visualisations/StabilitySection';
import { RightingCurve } from '@/components/visualisations/RightingCurve';
import { DesignSpaceMap } from '@/components/visualisations/DesignSpaceMap';
import { SpeedResistanceCurve } from '@/components/visualisations/SpeedResistanceCurve';
import { ParetoFrontier } from '@/components/visualisations/ParetoFrontier';
import { SensitivityChart } from '@/components/visualisations/SensitivityChart';
import { EvolutionaryOptimizer } from '@/components/visualisations/EvolutionaryOptimizer';
import { MonteCarloSeakeeping } from '@/components/visualisations/MonteCarloSeakeeping';
import { PracticalAnalysis } from '@/components/visualisations/PracticalAnalysis';
import { StructureAnalysis } from '@/components/visualisations/StructureAnalysis';
import { ElectricAnalysis } from '@/components/visualisations/ElectricAnalysis';
import { OperationsPanel } from '@/components/layout/OperationsPanel';
import { FuelRangeAnalysis } from '@/components/visualisations/FuelRangeAnalysis';
import { VoyageCalculator } from '@/components/visualisations/VoyageCalculator';
import { AnchorSizing } from '@/components/visualisations/AnchorSizing';
import { WaterBallast } from '@/components/visualisations/WaterBallast';
import { SafetyEquipment } from '@/components/visualisations/SafetyEquipment';
import { useWorkspace } from '@/state/useHullStore';

// Dynamically import 3D stability landscape to avoid SSR issues
const StabilityLandscape = dynamic(
  () => import('@/components/visualisations/StabilityLandscape').then((mod) => mod.StabilityLandscape),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-muted-foreground/5">
        <span className="text-sm text-muted-foreground">Loading landscape...</span>
      </div>
    ),
  }
);

// Dynamically import 3D views to avoid SSR issues with Three.js
const HullView3D = dynamic(
  () => import('@/components/visualisations/HullView3D').then((mod) => mod.HullView3D),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-muted-foreground/5">
        <span className="text-sm text-muted-foreground">Loading 3D view...</span>
      </div>
    ),
  }
);

const KelvinWake = dynamic(
  () => import('@/components/visualisations/KelvinWake').then((mod) => mod.KelvinWake),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-muted-foreground/5">
        <span className="text-sm text-muted-foreground">Loading wake...</span>
      </div>
    ),
  }
);

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

function Panel({ title, children, className = '', stagger = 0 }: PanelProps) {
  const staggerClass = stagger > 0 ? `stagger-${stagger}` : '';

  return (
    <div
      className={`border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col animate-slide-up panel-hover transition-shadow ${staggerClass} ${className}`}
    >
      <div className="px-3 py-1.5 border-b border-muted-foreground/20 bg-muted-foreground/5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex-1 min-h-0 relative">{children}</div>
    </div>
  );
}

interface TabbedPanelProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  className?: string;
  stagger?: number;
}

function TabbedPanel({ tabs, className = '', stagger = 0 }: TabbedPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  const staggerClass = stagger > 0 ? `stagger-${stagger}` : '';

  return (
    <div
      className={`border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col animate-slide-up panel-hover transition-shadow ${staggerClass} ${className}`}
    >
      <div className="px-2 py-1 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 relative">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

// Full-size panel wrapper for focused views
function FocusedPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 p-4 min-h-0">
      <div className="h-full border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col animate-slide-up">
        <div className="px-3 py-2 border-b border-muted-foreground/20 bg-muted-foreground/5">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex-1 min-h-0 relative">{children}</div>
      </div>
    </div>
  );
}

// Focused tabbed panel for full-size views
function FocusedTabbedPanel({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div className="flex-1 p-4 min-h-0">
      <div className="h-full border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col animate-slide-up">
        <div className="px-3 py-2 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 relative">
          {tabs.find((t) => t.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
}

export function MainView() {
  const [experimentalOpen, setExperimentalOpen] = useState(false);
  const workspace = useWorkspace();

  // Render focused views for non-dashboard workspaces
  if (workspace === 'hull-3d') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FocusedTabbedPanel
          tabs={[
            { id: 'hull', label: 'Hull 3D', content: <HullView3D /> },
            { id: 'wake', label: 'Kelvin Wake', content: <KelvinWake /> },
          ]}
        />
      </div>
    );
  }

  if (workspace === 'stability') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FocusedTabbedPanel
          tabs={[
            { id: 'section', label: 'Cross Section', content: <StabilitySection /> },
            { id: 'righting', label: 'Righting Curve', content: <RightingCurve /> },
            { id: 'landscape', label: '3D Landscape', content: <StabilityLandscape /> },
          ]}
        />
      </div>
    );
  }

  if (workspace === 'design-space') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FocusedTabbedPanel
          tabs={[
            { id: 'space', label: 'Design Space', content: <DesignSpaceMap /> },
            { id: 'pareto', label: 'Pareto Front', content: <ParetoFrontier /> },
            { id: 'sensitivity', label: 'Sensitivity', content: <SensitivityChart /> },
          ]}
        />
      </div>
    );
  }

  if (workspace === 'performance') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FocusedTabbedPanel
          tabs={[
            { id: 'speed', label: 'Speed Curve', content: <SpeedResistanceCurve /> },
            { id: 'sensitivity', label: 'Sensitivity', content: <SensitivityChart /> },
          ]}
        />
      </div>
    );
  }

  if (workspace === 'build') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FocusedTabbedPanel
          tabs={[
            { id: 'practical', label: 'Practical', content: <PracticalAnalysis /> },
            { id: 'structure', label: 'Structure', content: <StructureAnalysis /> },
            { id: 'electric', label: 'Electric', content: <ElectricAnalysis /> },
          ]}
        />
      </div>
    );
  }

  if (workspace === 'operations') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FocusedTabbedPanel
          tabs={[
            { id: 'fuel', label: 'Fuel & Range', content: <FuelRangeAnalysis /> },
            { id: 'voyage', label: 'Voyage', content: <VoyageCalculator /> },
            { id: 'anchor', label: 'Anchor', content: <AnchorSizing /> },
            { id: 'ballast', label: 'Water Ballast', content: <WaterBallast /> },
            { id: 'safety', label: 'Safety', content: <SafetyEquipment /> },
          ]}
        />
      </div>
    );
  }

  // Default: Dashboard view with all panels
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Main Grid */}
      <main className="flex-1 p-4 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0">
        {/* Top Left: Hull View with Wake option */}
        <TabbedPanel
          tabs={[
            { id: 'hull', label: 'Hull 3D', content: <HullView3D /> },
            { id: 'wake', label: 'Kelvin Wake', content: <KelvinWake /> },
          ]}
          className="row-span-1"
          stagger={1}
        />

        {/* Top Right: Stability Analysis */}
        <Panel title="Stability Analysis" className="row-span-1" stagger={2}>
          <StabilitySection />
        </Panel>

        {/* Bottom Left: Design Space / Pareto */}
        <TabbedPanel
          tabs={[
            { id: 'space', label: 'Design Space', content: <DesignSpaceMap /> },
            { id: 'pareto', label: 'Pareto Front', content: <ParetoFrontier /> },
          ]}
          className="row-span-1"
          stagger={3}
        />

        {/* Bottom Right: Performance / Sensitivity / Practical */}
        <TabbedPanel
          tabs={[
            { id: 'speed', label: 'Speed Curve', content: <SpeedResistanceCurve /> },
            { id: 'sensitivity', label: 'Sensitivity', content: <SensitivityChart /> },
            { id: 'practical', label: 'Practical', content: <PracticalAnalysis /> },
            { id: 'structure', label: 'Structure', content: <StructureAnalysis /> },
            { id: 'electric', label: 'Electric', content: <ElectricAnalysis /> },
          ]}
          className="row-span-1"
          stagger={4}
        />
      </main>

      {/* Operations Panel */}
      <OperationsPanel />

      {/* Experimental Section Toggle */}
      <button
        onClick={() => setExperimentalOpen(!experimentalOpen)}
        className="mx-4 mb-2 px-4 py-2 border border-muted-foreground/20 rounded bg-muted-foreground/5 hover:bg-muted-foreground/10 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Experimental Features
          </span>
          <span className="px-1.5 py-0.5 text-[8px] bg-warning/20 text-warning rounded">
            BETA
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted transition-transform ${experimentalOpen ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Experimental Section */}
      {experimentalOpen && (
        <div className="mx-4 mb-4 p-4 border border-warning/30 rounded bg-warning/5 animate-slide-up">
          <div className="grid grid-cols-3 gap-4" style={{ height: '280px' }}>
            {/* Evolutionary Optimizer */}
            <div className="border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-2">
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
                  Evolutionary Optimizer
                </h3>
                <span className="px-1 py-0.5 text-[7px] bg-warning/20 text-warning rounded">
                  EXPERIMENTAL
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <EvolutionaryOptimizer />
              </div>
            </div>

            {/* Monte Carlo Seakeeping */}
            <div className="border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-2">
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
                  Monte Carlo Seakeeping
                </h3>
                <span className="px-1 py-0.5 text-[7px] bg-warning/20 text-warning rounded">
                  EXPERIMENTAL
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <MonteCarloSeakeeping />
              </div>
            </div>

            {/* Stability Landscape */}
            <div className="border border-muted-foreground/20 rounded bg-background overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-2">
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
                  3D Stability Landscape
                </h3>
                <span className="px-1 py-0.5 text-[7px] bg-warning/20 text-warning rounded">
                  EXPERIMENTAL
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <StabilityLandscape />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-warning/20 text-[9px] text-muted-foreground">
            <strong>Note:</strong> Experimental features demonstrate advanced capabilities enabled by the neural surrogate.
            These features run entirely in the browser using TensorFlow.js.
          </div>
        </div>
      )}
    </div>
  );
}
