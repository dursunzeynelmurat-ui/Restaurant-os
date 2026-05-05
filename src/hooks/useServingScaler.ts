import { useState, useCallback } from 'react';
import { computeScaleFactor, scaleQuantity } from '@lib/utils/scale';
import type { RecipeIngredient } from '@app-types/recipe';

export function useServingScaler(originalServings: number | null | undefined) {
  const [currentServings, setCurrentServings] = useState(originalServings ?? 2);

  const scaleFactor = computeScaleFactor(currentServings, originalServings);

  const scaleIngredient = useCallback(
    (ingredient: RecipeIngredient) => ({
      ...ingredient,
      quantity: scaleQuantity(ingredient.quantity, scaleFactor),
    }),
    [scaleFactor]
  );

  const increment = useCallback(() => setCurrentServings((s) => Math.min(s + 1, 100)), []);
  const decrement = useCallback(() => setCurrentServings((s) => Math.max(s - 1, 1)), []);
  const setServings = useCallback((n: number) => setCurrentServings(Math.max(1, Math.min(n, 100))), []);

  return { currentServings, scaleFactor, scaleIngredient, increment, decrement, setServings };
}
