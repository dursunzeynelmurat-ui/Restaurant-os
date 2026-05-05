import { supabase } from '@lib/supabase';
import type { Database } from '@app-types/database';

type MealPlanItemRow = Database['public']['Tables']['meal_plan_items']['Row'];
export type MealPlanItemWithRecipe = MealPlanItemRow & {
  recipes?: {
    id: string;
    title: string;
    cover_image_url: string | null;
    total_time_minutes: number | null;
  } | null;
};

export async function fetchMealPlan(userId: string, weekStartDate: string) {
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .single();

  if (!plan) return null;

  const { data: rawItems, error } = await supabase
    .from('meal_plan_items')
    .select('*, recipes(id, title, cover_image_url, total_time_minutes)')
    .eq('meal_plan_id', plan.id)
    .order('date')
    .order('meal_type');

  if (error) throw error;
  const items = (rawItems ?? []) as MealPlanItemWithRecipe[];
  return { ...plan, items };
}

export async function upsertMealPlan(userId: string, weekStartDate: string) {
  const { data, error } = await supabase
    .from('meal_plans')
    .upsert({ user_id: userId, week_start_date: weekStartDate })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addMealPlanItem(
  mealPlanId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  recipeId: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('meal_plan_items')
    .insert({ meal_plan_id: mealPlanId, date, meal_type: mealType, recipe_id: recipeId, notes })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeMealPlanItem(id: string) {
  const { error } = await supabase.from('meal_plan_items').delete().eq('id', id);
  if (error) throw error;
}
