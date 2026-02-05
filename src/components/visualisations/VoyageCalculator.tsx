'use client';

import { useState, useMemo } from 'react';
import { useHullStore } from '@/state/useHullStore';
import { calculateFuelAnalysis, calculateVoyage, type SeaCondition } from '@/engine/operations';

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function VoyageCalculator() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const [distance, setDistance] = useState(25);
  const [conditions, setConditions] = useState<SeaCondition>('calm');

  const fuelAnalysis = useMemo(
    () => calculateFuelAnalysis(params, results.displacement),
    [params, results.displacement]
  );

  const voyage = useMemo(
    () => calculateVoyage(distance, conditions, params, fuelAnalysis),
    [distance, conditions, params, fuelAnalysis]
  );

  // Common routes for reference
  const commonRoutes = [
    { name: 'Day trip', distance: 15 },
    { name: 'Dover-Calais', distance: 21 },
    { name: 'Solent crossing', distance: 8 },
    { name: 'Weekend cruise', distance: 40 },
  ];

  const fuelPercentage = Math.min(100, (voyage.fuelWithReserve / params.fuelCapacity) * 100);

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto custom-scrollbar">
      {/* Input Section */}
      <div className="space-y-3">
        {/* Distance input */}
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
            Distance (nm)
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(Math.max(1, Number(e.target.value)))}
            className="w-full bg-muted-foreground/10 border border-muted-foreground/20 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-accent-primary"
          />
          <div className="flex gap-1 mt-1">
            {commonRoutes.map((route) => (
              <button
                key={route.name}
                onClick={() => setDistance(route.distance)}
                className={`px-2 py-0.5 text-[8px] rounded transition-colors ${
                  distance === route.distance
                    ? 'bg-accent-primary text-background'
                    : 'bg-muted-foreground/10 hover:bg-muted-foreground/20'
                }`}
              >
                {route.name}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions select */}
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
            Sea Conditions
          </label>
          <div className="flex gap-1">
            {(['calm', 'moderate', 'rough'] as SeaCondition[]).map((cond) => (
              <button
                key={cond}
                onClick={() => setConditions(cond)}
                className={`flex-1 px-2 py-1.5 text-[10px] rounded capitalize transition-colors ${
                  conditions === cond
                    ? 'bg-accent-primary text-background'
                    : 'bg-muted-foreground/10 hover:bg-muted-foreground/20'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 pt-3 border-t border-muted-foreground/10">
        {/* Can make it indicator */}
        <div
          className={`p-3 rounded mb-3 ${
            voyage.canMakeIt ? 'bg-safe/10 border border-safe/30' : 'bg-danger/10 border border-danger/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${voyage.canMakeIt ? 'text-safe' : 'text-danger'}`}>
              {voyage.canMakeIt ? 'Can make it' : 'Insufficient fuel'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {voyage.refuelStops > 0 && `${voyage.refuelStops} refuel stop${voyage.refuelStops > 1 ? 's' : ''} needed`}
            </span>
          </div>
        </div>

        {/* Fuel gauge */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
            <span>Fuel required (incl. 20% reserve)</span>
            <span>
              {voyage.fuelWithReserve.toFixed(1)}L / {params.fuelCapacity}L
            </span>
          </div>
          <div className="h-4 bg-muted-foreground/20 rounded overflow-hidden relative">
            <div
              className={`h-full transition-all ${
                fuelPercentage > 100 ? 'bg-danger' : fuelPercentage > 80 ? 'bg-warning' : 'bg-safe'
              }`}
              style={{ width: `${Math.min(100, fuelPercentage)}%` }}
            />
            {/* Tank capacity marker */}
            {fuelPercentage < 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                style={{ left: `${fuelPercentage}%` }}
              />
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted-foreground/5 rounded p-2">
            <div className="text-[8px] text-muted-foreground uppercase">Cruise Speed</div>
            <div className="font-mono text-sm">
              {voyage.cruiseSpeed.toFixed(1)} <span className="text-[10px] text-muted-foreground">kn</span>
            </div>
          </div>
          <div className="bg-muted-foreground/5 rounded p-2">
            <div className="text-[8px] text-muted-foreground uppercase">Time Underway</div>
            <div className="font-mono text-sm">{formatTime(voyage.timeUnderway)}</div>
          </div>
          <div className="bg-muted-foreground/5 rounded p-2">
            <div className="text-[8px] text-muted-foreground uppercase">Fuel Required</div>
            <div className="font-mono text-sm">
              {voyage.fuelRequired.toFixed(1)} <span className="text-[10px] text-muted-foreground">L</span>
            </div>
          </div>
          <div className="bg-muted-foreground/5 rounded p-2">
            <div className="text-[8px] text-muted-foreground uppercase">Fuel Remaining</div>
            <div className={`font-mono text-sm ${voyage.fuelRemaining < 10 ? 'text-danger' : ''}`}>
              {voyage.fuelRemaining.toFixed(1)} <span className="text-[10px] text-muted-foreground">L</span>
            </div>
          </div>
        </div>

        {/* Consumption note */}
        <div className="mt-3 text-[9px] text-muted-foreground">
          Average consumption: {voyage.averageConsumption.toFixed(1)} L/hr at cruise speed
          {conditions !== 'calm' && (
            <span className="text-warning">
              {' '}
              (+{Math.round((conditions === 'moderate' ? 15 : 35))}% for {conditions} conditions)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
