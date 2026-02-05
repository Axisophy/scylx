'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS, ENGINE_TYPE_OPTIONS } from '@/types/hull';
import type { EngineType } from '@/types/hull';

export function PowerControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  return (
    <div className="space-y-4">
      <Select<EngineType>
        label="Engine Type"
        value={params.engineType}
        options={ENGINE_TYPE_OPTIONS}
        onChange={(v) => setParam('engineType', v)}
      />
      <Slider
        label="Engine Power"
        value={params.engineHP}
        min={PARAM_BOUNDS.engineHP.min}
        max={PARAM_BOUNDS.engineHP.max}
        step={PARAM_BOUNDS.engineHP.step}
        unit={PARAM_BOUNDS.engineHP.unit}
        decimals={0}
        onChange={(v) => setParam('engineHP', v)}
      />
      <Slider
        label="Propeller Diameter"
        value={params.propellerDiameter}
        min={PARAM_BOUNDS.propellerDiameter.min}
        max={PARAM_BOUNDS.propellerDiameter.max}
        step={PARAM_BOUNDS.propellerDiameter.step}
        unit={PARAM_BOUNDS.propellerDiameter.unit}
        decimals={1}
        onChange={(v) => setParam('propellerDiameter', v)}
      />
      <Slider
        label="Propeller Pitch"
        value={params.propellerPitch}
        min={PARAM_BOUNDS.propellerPitch.min}
        max={PARAM_BOUNDS.propellerPitch.max}
        step={PARAM_BOUNDS.propellerPitch.step}
        unit={PARAM_BOUNDS.propellerPitch.unit}
        decimals={1}
        onChange={(v) => setParam('propellerPitch', v)}
      />
    </div>
  );
}
