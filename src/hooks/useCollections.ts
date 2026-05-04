import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import {
  fetchCollections,
  fetchCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
} from '@lib/api/collections';
import { useAuth } from './useAuth';

export function useCollections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.collections.all,
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
  });
}

export function useCollectionDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.collections.detail(id),
    queryFn: () => fetchCollectionById(id),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (name: string) => createCollection(user!.id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.collections.all }),
  });
}

export function useUpdateCollection(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateCollection(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
      qc.invalidateQueries({ queryKey: queryKeys.collections.detail(id) });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.collections.all }),
  });
}

export function useAddToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, collectionId }: { recipeId: string; collectionId: string }) =>
      addRecipeToCollection(recipeId, collectionId),
    onSuccess: (_data, { collectionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.detail(collectionId) });
    },
  });
}

export function useRemoveFromCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, collectionId }: { recipeId: string; collectionId: string }) =>
      removeRecipeFromCollection(recipeId, collectionId),
    onSuccess: (_data, { collectionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.detail(collectionId) });
    },
  });
}
