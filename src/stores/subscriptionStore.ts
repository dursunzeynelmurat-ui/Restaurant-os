import { create } from 'zustand';
import type { SubscriptionStatus } from '@types/subscription';

interface SubscriptionState {
  status: SubscriptionStatus;
  monthlyAiUsage: number;
  setStatus: (status: SubscriptionStatus) => void;
  setMonthlyAiUsage: (usage: number) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: 'free',
  monthlyAiUsage: 0,
  setStatus: (status) => set({ status }),
  setMonthlyAiUsage: (monthlyAiUsage) => set({ monthlyAiUsage }),
}));
