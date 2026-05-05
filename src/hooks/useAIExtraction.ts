import { useMutation } from '@tanstack/react-query';
import { extractRecipe } from '@lib/api/ai';
import { useImportStore } from '@stores/importStore';
import { router } from 'expo-router';
import type { ImportSourceType } from '@app-types/recipe';

export function useAIExtraction() {
  const { startExtraction, setExtracted, setError } = useImportStore();

  return useMutation({
    mutationFn: ({
      content,
      type,
    }: {
      content: string;
      type: Exclude<ImportSourceType, 'manual'>;
      sourceUrl?: string;
    }) => extractRecipe({ content, type }),
    onMutate: ({ type, sourceUrl }) => {
      startExtraction(type, sourceUrl);
    },
    onSuccess: (data) => {
      setExtracted(data);
      router.push('/import/review');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}
