export function scaleQuantity(
  quantity: number | null | undefined,
  scaleFactor: number
): number | null {
  if (quantity == null) return null;
  return Math.round(quantity * scaleFactor * 100) / 100;
}

export function computeScaleFactor(
  currentServings: number,
  originalServings: number | null | undefined
): number {
  if (!originalServings || originalServings === 0) return 1;
  return currentServings / originalServings;
}
