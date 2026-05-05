import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import { suggestRecipes } from '@lib/api/ai';
import { usePantry } from './usePantry';
import { useSubscriptionStore } from '@stores/subscriptionStore';

function hashPantryItems(names: string[]): string {
  return [...names].sort().join('|');
}

export function useWhatCanICook(preferences?: { cuisine?: string; max_time?: number; dietary?: string[] }) {
  const { data: pantryItems } = usePantry();
  const status = useSubscriptionStore((s) => s.status);
  const pantryNames = (pantryItems ?? []).map((i) => i.name);
  const pantryHash = hashPantryItems(pantryNames);

  return useQuery({
    queryKey: queryKeys.whatCanICook(pantryHash),
    queryFn: () => suggestRecipes({ pantry_items: pantryNames, preferences }),
    enabled: pantryNames.length > 0 && status !== 'free',
    staleTime: 1000 * 60 * 30,
  });
}
