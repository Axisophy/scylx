'use client';

import { useState } from 'react';
import { FuelRangeAnalysis } from '@/components/visualisations/FuelRangeAnalysis';
import { VoyageCalculator } from '@/components/visualisations/VoyageCalculator';
import { AnchorSizing } from '@/components/visualisations/AnchorSizing';
import { WaterBallast } from '@/components/visualisations/WaterBallast';
import { SafetyEquipment } from '@/components/visualisations/SafetyEquipment';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function OperationsPanel() {
  const tabs: Tab[] = [
    { id: 'fuel', label: 'Fuel & Range', content: <FuelRangeAnalysis /> },
    { id: 'voyage', label: 'Voyage', content: <VoyageCalculator /> },
    { id: 'anchor', label: 'Anchor', content: <AnchorSizing /> },
    { id: 'ballast', label: 'Water Ballast', content: <WaterBallast /> },
    { id: 'safety', label: 'Safety', content: <SafetyEquipment /> },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="mx-4 mb-4 border border-muted-foreground/20 rounded bg-background overflow-hidden animate-slide-up">
      {/* Header with tabs */}
      <div className="px-3 py-2 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-3">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
          Operations
        </h3>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 text-[10px] rounded transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="h-[280px]">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
