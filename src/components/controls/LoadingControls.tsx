'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { useHullStore } from '@/state/useHullStore';
import { PARAM_BOUNDS, BALLAST_TYPE_OPTIONS } from '@/types/hull';
import type { BallastType } from '@/types/hull';

export function LoadingControls() {
  const params = useHullStore((state) => state.params);
  const setParam = useHullStore((state) => state.setParam);

  const showBallastWeight = params.ballastType !== 'none';

  return (
    <div className="space-y-4">
      <Slider
        label="Crew Weight"
        value={params.crewWeight}
        min={PARAM_BOUNDS.crewWeight.min}
        max={PARAM_BOUNDS.crewWeight.max}
        step={PARAM_BOUNDS.crewWeight.step}
        unit={PARAM_BOUNDS.crewWeight.unit}
        decimals={0}
        onChange={(v) => setParam('crewWeight', v)}
      />
      <Slider
        label="Cargo Weight"
        value={params.cargoWeight}
        min={PARAM_BOUNDS.cargoWeight.min}
        max={PARAM_BOUNDS.cargoWeight.max}
        step={PARAM_BOUNDS.cargoWeight.step}
        unit={PARAM_BOUNDS.cargoWeight.unit}
        decimals={0}
        onChange={(v) => setParam('cargoWeight', v)}
      />
      <Select<BallastType>
        label="Ballast Type"
        value={params.ballastType}
        options={BALLAST_TYPE_OPTIONS}
        onChange={(v) => {
          setParam('ballastType', v);
          // Reset ballast weight when disabling ballast
          if (v === 'none') {
            setParam('ballastWeight', 0);
          }
        }}
      />
      {showBallastWeight && (
        <>
          <Slider
            label="Ballast Weight"
            value={params.ballastWeight}
            min={PARAM_BOUNDS.ballastWeight.min}
            max={PARAM_BOUNDS.ballastWeight.max}
            step={PARAM_BOUNDS.ballastWeight.step}
            unit={PARAM_BOUNDS.ballastWeight.unit}
            decimals={0}
            onChange={(v) => setParam('ballastWeight', v)}
          />
          <Slider
            label="Ballast Height"
            value={params.ballastHeight}
            min={PARAM_BOUNDS.ballastHeight.min}
            max={PARAM_BOUNDS.ballastHeight.max}
            step={PARAM_BOUNDS.ballastHeight.step}
            unit={PARAM_BOUNDS.ballastHeight.unit}
            onChange={(v) => setParam('ballastHeight', v)}
          />
        </>
      )}

      <div className="pt-2 border-t border-muted-foreground/10">
        <Slider
          label="Fuel Capacity"
          value={params.fuelCapacity}
          min={PARAM_BOUNDS.fuelCapacity.min}
          max={PARAM_BOUNDS.fuelCapacity.max}
          step={PARAM_BOUNDS.fuelCapacity.step}
          unit={PARAM_BOUNDS.fuelCapacity.unit}
          decimals={0}
          onChange={(v) => setParam('fuelCapacity', v)}
        />
      </div>
      <Slider
        label="Water Capacity"
        value={params.waterCapacity}
        min={PARAM_BOUNDS.waterCapacity.min}
        max={PARAM_BOUNDS.waterCapacity.max}
        step={PARAM_BOUNDS.waterCapacity.step}
        unit={PARAM_BOUNDS.waterCapacity.unit}
        decimals={0}
        onChange={(v) => setParam('waterCapacity', v)}
      />
    </div>
  );
}
