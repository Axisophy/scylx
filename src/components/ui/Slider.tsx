'use client';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  decimals?: number;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  decimals = 2,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const displayValue = decimals === 0 ? value.toString() : value.toFixed(decimals);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground">{label}</label>
        <span className="font-mono text-sm text-foreground tabular-nums">
          {displayValue}
          <span className="text-muted-foreground ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-4"
      />
    </div>
  );
}
