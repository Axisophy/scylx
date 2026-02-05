'use client';

import { Slider } from '@/components/ui/Slider';
import {
  useSavedConfigA,
  useSavedConfigB,
  useMorphPosition,
  useMorphEnabled,
  useSaveConfigA,
  useSaveConfigB,
  useClearSavedConfigs,
  useSetMorphPosition,
  useSetMorphEnabled,
  useHullStore,
} from '@/state/useHullStore';
import { formatNumber } from '@/lib/utils';

export function MorphControls() {
  const savedConfigA = useSavedConfigA();
  const savedConfigB = useSavedConfigB();
  const morphPosition = useMorphPosition();
  const morphEnabled = useMorphEnabled();
  const saveConfigA = useSaveConfigA();
  const saveConfigB = useSaveConfigB();
  const clearSavedConfigs = useClearSavedConfigs();
  const setMorphPosition = useSetMorphPosition();
  const setMorphEnabled = useSetMorphEnabled();
  const setParams = useHullStore((state) => state.setParams);

  const canMorph = savedConfigA && savedConfigB;

  const handleLoadA = () => {
    if (savedConfigA) {
      setMorphEnabled(false);
      setParams(savedConfigA.params);
    }
  };

  const handleLoadB = () => {
    if (savedConfigB) {
      setMorphEnabled(false);
      setParams(savedConfigB.params);
    }
  };

  return (
    <div className="space-y-3">
      {/* Save buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => saveConfigA()}
          className={`px-2 py-1.5 text-xs rounded border transition-colors ${
            savedConfigA
              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
              : 'border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground'
          }`}
        >
          {savedConfigA ? 'Update A' : 'Save as A'}
        </button>
        <button
          onClick={() => saveConfigB()}
          className={`px-2 py-1.5 text-xs rounded border transition-colors ${
            savedConfigB
              ? 'border-accent-secondary bg-accent-secondary/10 text-accent-secondary'
              : 'border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground'
          }`}
        >
          {savedConfigB ? 'Update B' : 'Save as B'}
        </button>
      </div>

      {/* Config summaries */}
      {(savedConfigA || savedConfigB) && (
        <div className="space-y-2 text-xs">
          {savedConfigA && (
            <div
              className="p-2 rounded bg-accent-primary/5 border border-accent-primary/20 cursor-pointer hover:bg-accent-primary/10 transition-colors"
              onClick={handleLoadA}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-accent-primary">Config A</span>
                <span className="text-muted-foreground">click to load</span>
              </div>
              <div className="font-mono text-muted-foreground">
                {formatNumber(savedConfigA.params.lwl, 2)}m x {formatNumber(savedConfigA.params.beam, 2)}m
                <span className="mx-1">|</span>
                {savedConfigA.params.hullType}
              </div>
            </div>
          )}
          {savedConfigB && (
            <div
              className="p-2 rounded bg-accent-secondary/5 border border-accent-secondary/20 cursor-pointer hover:bg-accent-secondary/10 transition-colors"
              onClick={handleLoadB}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-accent-secondary">Config B</span>
                <span className="text-muted-foreground">click to load</span>
              </div>
              <div className="font-mono text-muted-foreground">
                {formatNumber(savedConfigB.params.lwl, 2)}m x {formatNumber(savedConfigB.params.beam, 2)}m
                <span className="mx-1">|</span>
                {savedConfigB.params.hullType}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Morph controls */}
      {canMorph && (
        <div className="space-y-2 pt-2 border-t border-muted-foreground/20">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={morphEnabled}
              onChange={(e) => setMorphEnabled(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-sm">Enable morphing</span>
          </label>

          {morphEnabled && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-accent-primary">A</span>
                <span className="text-accent-secondary">B</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={morphPosition}
                onChange={(e) => setMorphPosition(parseFloat(e.target.value))}
                className="w-full h-4"
              />
              <div className="text-center text-xs font-mono text-muted-foreground">
                {(morphPosition * 100).toFixed(0)}% toward B
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear button */}
      {(savedConfigA || savedConfigB) && (
        <button
          onClick={clearSavedConfigs}
          className="w-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear saved configs
        </button>
      )}
    </div>
  );
}
