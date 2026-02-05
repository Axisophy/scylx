// Format number with specified decimal places
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

// Format number with unit
export function formatWithUnit(value: number, unit: string, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}${unit}`;
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Map value from one range to another
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

// Generate array of numbers from start to end with step
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

// Stability rating color mapping
export function getStabilityColor(rating: string): string {
  switch (rating) {
    case 'stiff':
      return 'var(--safe)';
    case 'moderate':
      return 'var(--safe)';
    case 'tender':
      return 'var(--warning)';
    case 'dangerous':
      return 'var(--danger)';
    default:
      return 'var(--muted)';
  }
}

// Get CSS class for stability rating
export function getStabilityClass(rating: string): string {
  switch (rating) {
    case 'stiff':
    case 'moderate':
      return 'text-safe';
    case 'tender':
      return 'text-warning';
    case 'dangerous':
      return 'text-danger';
    default:
      return 'text-muted';
  }
}
