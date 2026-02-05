'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS, DEADRISE_VARIATION_OPTIONS } from '@/types/hull';
import type { DeadriseVariation } from '@/types/hull';

export function HullFormControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  // Only show chine controls for chined hull types
  const showChineControls = params.hullType === 'single-chine' || params.hullType === 'multi-chine';

  return (
    <div className="space-y-4">
      <Slider
        label="Prismatic Coeff"
        value={params.prismaticCoefficient}
        min={PARAM_BOUNDS.prismaticCoefficient.min}
        max={PARAM_BOUNDS.prismaticCoefficient.max}
        step={PARAM_BOUNDS.prismaticCoefficient.step}
        unit={PARAM_BOUNDS.prismaticCoefficient.unit}
        decimals={2}
        onChange={(v) => setParam('prismaticCoefficient', v)}
      />
      <Slider
        label="LCB Position"
        value={params.lcb}
        min={PARAM_BOUNDS.lcb.min}
        max={PARAM_BOUNDS.lcb.max}
        step={PARAM_BOUNDS.lcb.step}
        unit={PARAM_BOUNDS.lcb.unit}
        decimals={1}
        onChange={(v) => setParam('lcb', v)}
      />
      <Slider
        label="Rocker"
        value={params.rocker}
        min={PARAM_BOUNDS.rocker.min}
        max={PARAM_BOUNDS.rocker.max}
        step={PARAM_BOUNDS.rocker.step}
        unit={PARAM_BOUNDS.rocker.unit}
        decimals={2}
        onChange={(v) => setParam('rocker', v)}
      />
      <Select<DeadriseVariation>
        label="Deadrise Variation"
        value={params.deadriseVariation}
        options={DEADRISE_VARIATION_OPTIONS}
        onChange={(v) => setParam('deadriseVariation', v)}
      />

      {showChineControls && (
        <>
          <Slider
            label="Chine Height"
            value={params.chineHeight}
            min={PARAM_BOUNDS.chineHeight.min}
            max={PARAM_BOUNDS.chineHeight.max}
            step={PARAM_BOUNDS.chineHeight.step}
            unit={PARAM_BOUNDS.chineHeight.unit}
            decimals={2}
            onChange={(v) => setParam('chineHeight', v)}
          />
          <Slider
            label="Chine Angle"
            value={params.chineAngle}
            min={PARAM_BOUNDS.chineAngle.min}
            max={PARAM_BOUNDS.chineAngle.max}
            step={PARAM_BOUNDS.chineAngle.step}
            unit={PARAM_BOUNDS.chineAngle.unit}
            decimals={0}
            onChange={(v) => setParam('chineAngle', v)}
          />
        </>
      )}
    </div>
  );
}
