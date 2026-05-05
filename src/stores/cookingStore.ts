import { create } from 'zustand';

interface CookingState {
  recipeId: string | null;
  currentStepIndex: number;
  scaledServings: number;
  isActive: boolean;
  startCooking: (recipeId: string, servings: number) => void;
  nextStep: () => void;
  prevStep: (totalSteps: number) => void;
  setServings: (servings: number) => void;
  endCooking: () => void;
}

export const useCookingStore = create<CookingState>((set) => ({
  recipeId: null,
  currentStepIndex: 0,
  scaledServings: 1,
  isActive: false,
  startCooking: (recipeId, servings) =>
    set({ recipeId, scaledServings: servings, currentStepIndex: 0, isActive: true }),
  nextStep: () => set((s) => ({ currentStepIndex: s.currentStepIndex + 1 })),
  prevStep: () => set((s) => ({ currentStepIndex: Math.max(0, s.currentStepIndex - 1) })),
  setServings: (servings) => set({ scaledServings: servings }),
  endCooking: () => set({ recipeId: null, currentStepIndex: 0, isActive: false }),
}));
