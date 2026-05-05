import { useMutation } from '@tanstack/react-query';
import { getIngredientSubstitution } from '@lib/api/ai';
import type { RecipeIngredient } from '@app-types/recipe';

export function useIngredientSubstitution() {
  return useMutation({
    mutationFn: ({
      ingredient,
      recipeTitle,
    }: {
      ingredient: RecipeIngredient;
      recipeTitle?: string;
    }) =>
      getIngredientSubstitution({
        ingredient_name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        recipe_title: recipeTitle,
      }),
  });
}
