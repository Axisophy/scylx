'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS, STERN_TYPE_OPTIONS } from '@/types/hull';
import type { SternType } from '@/types/hull';

export function SternControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  return (
    <div className="space-y-4">
      <Select<SternType>
        label="Stern Type"
        value={params.sternType}
        options={STERN_TYPE_OPTIONS}
        onChange={(v) => setParam('sternType', v)}
      />
      <Slider
        label="Transom Rake"
        value={params.transomRake}
        min={PARAM_BOUNDS.transomRake.min}
        max={PARAM_BOUNDS.transomRake.max}
        step={PARAM_BOUNDS.transomRake.step}
        unit={PARAM_BOUNDS.transomRake.unit}
        decimals={0}
        onChange={(v) => setParam('transomRake', v)}
      />
      <Slider
        label="Transom Immersion"
        value={params.transomImmersion}
        min={PARAM_BOUNDS.transomImmersion.min}
        max={PARAM_BOUNDS.transomImmersion.max}
        step={PARAM_BOUNDS.transomImmersion.step}
        unit={PARAM_BOUNDS.transomImmersion.unit}
        decimals={0}
        onChange={(v) => setParam('transomImmersion', v)}
      />
    </div>
  );
}
