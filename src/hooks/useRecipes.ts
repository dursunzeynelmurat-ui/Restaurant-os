import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import {
  fetchRecipes,
  fetchRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
  type CreateRecipeInput,
} from '@lib/api/recipes';
import { useAuth } from './useAuth';
import type { RecipeFilters } from '@app-types/recipe';
import type { Database } from '@app-types/database';

export function useRecipes(filters?: RecipeFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.recipes.list(filters),
    queryFn: () => fetchRecipes(user!.id, filters),
    enabled: !!user,
  });
}

export function useRecipeDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => fetchRecipeById(id),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: CreateRecipeInput) => createRecipe({ ...input, userId: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useUpdateRecipe(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateRecipe>[1]) => updateRecipe(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      await qc.cancelQueries({ queryKey: queryKeys.recipes.detail(id) });
      const prev = qc.getQueryData(queryKeys.recipes.detail(id));
      qc.setQueryData(queryKeys.recipes.detail(id), (old: Database['public']['Tables']['recipes']['Row'] | undefined) =>
        old ? { ...old, is_favorite: isFavorite } : old
      );
      return { prev };
    },
    onError: (_err, { id }, context) => {
      if (context?.prev) qc.setQueryData(queryKeys.recipes.detail(id), context.prev);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.detail(id) });
    },
  });
}
