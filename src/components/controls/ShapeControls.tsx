'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS, HULL_TYPE_OPTIONS } from '@/types/hull';
import type { HullType } from '@/types/hull';

export function ShapeControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  return (
    <div className="space-y-4">
      <Select<HullType>
        label="Hull Type"
        value={params.hullType}
        options={HULL_TYPE_OPTIONS}
        onChange={(v) => setParam('hullType', v)}
      />
      <Slider
        label="Deadrise Angle"
        value={params.deadrise}
        min={PARAM_BOUNDS.deadrise.min}
        max={PARAM_BOUNDS.deadrise.max}
        step={PARAM_BOUNDS.deadrise.step}
        unit={PARAM_BOUNDS.deadrise.unit}
        decimals={0}
        onChange={(v) => setParam('deadrise', v)}
      />
    </div>
  );
}
