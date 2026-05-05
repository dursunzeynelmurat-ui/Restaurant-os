import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import {
  fetchGroceryLists,
  fetchGroceryListById,
  createGroceryList,
  addGroceryItems,
  toggleGroceryItem,
  deleteGroceryItem,
  deleteGroceryList,
  archiveGroceryList,
  generateGroceryListFromRecipes,
} from '@lib/api/grocery';
import { useAuth } from './useAuth';
import type { Database } from '@app-types/database';

type GroceryItemInsert = Omit<
  Database['public']['Tables']['grocery_items']['Insert'],
  'grocery_list_id'
>;

export function useGroceryLists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.grocery.all,
    queryFn: () => fetchGroceryLists(user!.id),
    enabled: !!user,
  });
}

export function useGroceryList(id: string) {
  return useQuery({
    queryKey: queryKeys.grocery.detail(id),
    queryFn: () => fetchGroceryListById(id),
    enabled: !!id,
  });
}

export function useCreateGroceryList() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (name: string) => createGroceryList(user!.id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.grocery.all }),
  });
}

export function useAddGroceryItems(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: GroceryItemInsert[]) => addGroceryItems(listId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.grocery.detail(listId) }),
  });
}

export function useToggleGroceryItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isChecked }: { id: string; isChecked: boolean }) =>
      toggleGroceryItem(id, isChecked),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.grocery.detail(listId) }),
  });
}

export function useDeleteGroceryList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGroceryList,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.grocery.all }),
  });
}

export function useArchiveGroceryList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveGroceryList,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.grocery.all }),
  });
}

export function useGenerateGroceryFromPlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ recipeIds, weekLabel }: { recipeIds: string[]; weekLabel: string }) =>
      generateGroceryListFromRecipes(user!.id, recipeIds, weekLabel),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.grocery.all }),
  });
}
