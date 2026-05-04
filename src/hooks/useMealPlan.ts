import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import { fetchMealPlan, upsertMealPlan, addMealPlanItem, removeMealPlanItem } from '@lib/api/mealPlan';
import { useAuth } from './useAuth';
import { format, startOfWeek } from 'date-fns';

export function useCurrentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function useMealPlan(weekStartDate: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.mealPlan.week(weekStartDate),
    queryFn: () => fetchMealPlan(user!.id, weekStartDate),
    enabled: !!user && !!weekStartDate,
  });
}

export function useAddMealPlanItem(weekStartDate: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      date,
      mealType,
      recipeId,
      notes,
    }: {
      date: string;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      recipeId: string;
      notes?: string;
    }) => {
      const plan = await upsertMealPlan(user!.id, weekStartDate);
      return addMealPlanItem(plan.id, date, mealType, recipeId, notes);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mealPlan.week(weekStartDate) }),
  });
}

export function useRemoveMealPlanItem(weekStartDate: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeMealPlanItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mealPlan.week(weekStartDate) }),
  });
}
