import { create } from 'zustand';
import type { ExtractedRecipe, ImportSourceType } from '@app-types/recipe';

type ImportStatus = 'idle' | 'extracting' | 'done' | 'error';

interface ImportState {
  status: ImportStatus;
  extracted: ExtractedRecipe | null;
  error: string | null;
  sourceType: ImportSourceType | null;
  sourceUrl: string | null;
  startExtraction: (sourceType: ImportSourceType, sourceUrl?: string) => void;
  setExtracted: (recipe: ExtractedRecipe) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set) => ({
  status: 'idle',
  extracted: null,
  error: null,
  sourceType: null,
  sourceUrl: null,
  startExtraction: (sourceType, sourceUrl) =>
    set({ status: 'extracting', sourceType, sourceUrl: sourceUrl ?? null, error: null }),
  setExtracted: (recipe) => set({ status: 'done', extracted: recipe }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', extracted: null, error: null, sourceType: null, sourceUrl: null }),
}));
