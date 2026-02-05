'use client';

import { useMemo } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateSafetyEquipment, type SafetyItem } from '@/engine/operations';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function ChecklistItem({ item }: { item: SafetyItem }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <div
        className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
          item.required
            ? 'border-safe bg-safe/20'
            : 'border-muted-foreground/30 bg-muted-foreground/5'
        }`}
      >
        {item.required && (
          <svg className="w-2 h-2 text-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <span className={`text-[10px] ${item.required ? '' : 'text-muted-foreground'}`}>
            {item.item}
            {item.quantity > 1 && <span className="text-muted-foreground"> ×{item.quantity}</span>}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">{formatCurrency(item.cost)}</span>
        </div>
        {item.notes && (
          <div className="text-[8px] text-muted-foreground">{item.notes}</div>
        )}
      </div>
    </div>
  );
}

function CategorySection({
  title,
  items,
}: {
  title: string;
  items: SafetyItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1 pb-0.5 border-b border-muted-foreground/10">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <ChecklistItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

export function SafetyEquipment() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const safety = useMemo(
    () => calculateSafetyEquipment(params, results.displacement),
    [params, results.displacement]
  );

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto custom-scrollbar">
      {/* CE Category badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`px-2 py-1 rounded text-sm font-medium ${
              safety.ceCategory === 'C'
                ? 'bg-safe/20 text-safe border border-safe/30'
                : 'bg-warning/20 text-warning border border-warning/30'
            }`}
          >
            CE Category {safety.ceCategory}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {safety.ceCategory === 'C' ? 'Inshore waters' : 'Sheltered waters'}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Max {safety.maxPersons} persons
        </div>
      </div>

      {/* Equipment categories */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <CategorySection title="Lifesaving" items={safety.lifesaving} />
        <CategorySection title="Firefighting" items={safety.firefighting} />
        <CategorySection title="Navigation" items={safety.navigation} />
        <CategorySection title="Communication" items={safety.communication} />
        <CategorySection title="General" items={safety.general} />
      </div>

      {/* Cost summary */}
      <div className="mt-3 pt-3 border-t border-muted-foreground/20">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Required equipment</span>
          <span className="font-mono">{formatCurrency(safety.totalRequiredCost)}</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Recommended extras</span>
          <span className="font-mono">{formatCurrency(safety.totalRecommendedCost)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium pt-1 border-t border-muted-foreground/10">
          <span>Total</span>
          <span className="font-mono text-accent-primary">{formatCurrency(safety.totalCost)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[8px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded border border-safe bg-safe/20" />
          <span>Required</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded border border-muted-foreground/30 bg-muted-foreground/5" />
          <span>Recommended</span>
        </div>
      </div>
    </div>
  );
}
