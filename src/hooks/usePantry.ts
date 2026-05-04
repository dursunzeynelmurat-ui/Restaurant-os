import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import { fetchPantryItems, addPantryItem, updatePantryItem, deletePantryItem, clearPantry } from '@lib/api/pantry';
import { useAuth } from './useAuth';
import type { Database } from '@types/database';

type PantryInsert = Omit<Database['public']['Tables']['pantry_items']['Insert'], 'user_id'>;

export function usePantry() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.pantry.all,
    queryFn: () => fetchPantryItems(user!.id),
    enabled: !!user,
  });
}

export function useAddPantryItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (item: PantryInsert) => addPantryItem(user!.id, item),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry.all }),
  });
}

export function useUpdatePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Database['public']['Tables']['pantry_items']['Update'] }) =>
      updatePantryItem(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry.all }),
  });
}

export function useDeletePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePantryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry.all }),
  });
}

export function useClearPantry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => clearPantry(user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry.all }),
  });
}
