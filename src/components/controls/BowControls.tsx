'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS, BOW_TYPE_OPTIONS } from '@/types/hull';
import type { BowType } from '@/types/hull';

export function BowControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  return (
    <div className="space-y-4">
      <Select<BowType>
        label="Bow Type"
        value={params.bowType}
        options={BOW_TYPE_OPTIONS}
        onChange={(v) => setParam('bowType', v)}
      />
      <Slider
        label="Bow Rake"
        value={params.bowRake}
        min={PARAM_BOUNDS.bowRake.min}
        max={PARAM_BOUNDS.bowRake.max}
        step={PARAM_BOUNDS.bowRake.step}
        unit={PARAM_BOUNDS.bowRake.unit}
        decimals={0}
        onChange={(v) => setParam('bowRake', v)}
      />
      <Slider
        label="Bow Flare"
        value={params.bowFlare}
        min={PARAM_BOUNDS.bowFlare.min}
        max={PARAM_BOUNDS.bowFlare.max}
        step={PARAM_BOUNDS.bowFlare.step}
        unit={PARAM_BOUNDS.bowFlare.unit}
        decimals={0}
        onChange={(v) => setParam('bowFlare', v)}
      />
    </div>
  );
}
