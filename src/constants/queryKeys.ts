import type { RecipeFilters } from '@app-types/recipe';

export const queryKeys = {
  user: {
    profile: () => ['user', 'profile'] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    list: (filters?: RecipeFilters) => ['recipes', 'list', filters ?? {}] as const,
    detail: (id: string) => ['recipes', 'detail', id] as const,
    favorites: () => ['recipes', 'favorites'] as const,
    recent: (limit?: number) => ['recipes', 'recent', limit ?? 10] as const,
  },
  collections: {
    all: ['collections'] as const,
    detail: (id: string) => ['collections', 'detail', id] as const,
  },
  pantry: {
    all: ['pantry'] as const,
  },
  grocery: {
    all: ['grocery'] as const,
    detail: (id: string) => ['grocery', 'detail', id] as const,
  },
  mealPlan: {
    week: (weekStart: string) => ['mealPlan', weekStart] as const,
  },
  whatCanICook: (pantryHash: string) => ['whatCanICook', pantryHash] as const,
} as const;
