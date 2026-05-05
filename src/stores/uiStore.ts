import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecipeFilters } from '@app-types/recipe';

interface UIState {
  recipeViewMode: 'grid' | 'list';
  activeFilters: RecipeFilters;
  setRecipeViewMode: (mode: 'grid' | 'list') => void;
  setActiveFilters: (filters: RecipeFilters) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      recipeViewMode: 'grid',
      activeFilters: {},
      setRecipeViewMode: (mode) => set({ recipeViewMode: mode }),
      setActiveFilters: (filters) => set({ activeFilters: filters }),
      clearFilters: () => set({ activeFilters: {} }),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recipeViewMode: state.recipeViewMode }),
    }
  )
);
