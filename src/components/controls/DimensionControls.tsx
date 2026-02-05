'use client';

import { Slider } from '@/components/ui/Slider';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS } from '@/types/hull';

export function DimensionControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  return (
    <div className="space-y-4">
      <Slider
        label="Waterline Length (LWL)"
        value={params.lwl}
        min={PARAM_BOUNDS.lwl.min}
        max={PARAM_BOUNDS.lwl.max}
        step={PARAM_BOUNDS.lwl.step}
        unit={PARAM_BOUNDS.lwl.unit}
        onChange={(v) => setParam('lwl', v)}
      />
      <Slider
        label="Beam"
        value={params.beam}
        min={PARAM_BOUNDS.beam.min}
        max={PARAM_BOUNDS.beam.max}
        step={PARAM_BOUNDS.beam.step}
        unit={PARAM_BOUNDS.beam.unit}
        onChange={(v) => setParam('beam', v)}
      />
      <Slider
        label="Hull Depth"
        value={params.depth}
        min={PARAM_BOUNDS.depth.min}
        max={PARAM_BOUNDS.depth.max}
        step={PARAM_BOUNDS.depth.step}
        unit={PARAM_BOUNDS.depth.unit}
        onChange={(v) => setParam('depth', v)}
      />
    </div>
  );
}
