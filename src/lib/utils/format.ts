export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function formatQuantity(quantity: number | null | undefined): string {
  if (quantity == null) return '';
  if (Number.isInteger(quantity)) return String(quantity);
  // Convert to simple fraction if possible
  const fractions: Record<number, string> = {
    0.25: '¼',
    0.5: '½',
    0.75: '¾',
    0.33: '⅓',
    0.67: '⅔',
  };
  const rounded = Math.round(quantity * 100) / 100;
  const wholePart = Math.floor(rounded);
  const fracPart = Math.round((rounded - wholePart) * 100) / 100;
  const fracStr = fractions[fracPart] ?? (fracPart > 0 ? fracPart.toString() : '');
  if (wholePart === 0) return fracStr || String(rounded);
  return fracStr ? `${wholePart} ${fracStr}` : String(rounded);
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDifficulty(difficulty: string | null): string {
  if (!difficulty) return '';
  return capitalizeFirst(difficulty);
}
