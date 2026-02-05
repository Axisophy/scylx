'use client';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as T);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm text-foreground block">{label}</label>
      <select
        value={value}
        onChange={handleChange}
        className="w-full h-8 px-2 text-sm bg-background border border-muted-foreground/30 rounded focus:outline-none focus:border-foreground transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
