import { supabase } from '@lib/supabase';
import type { RecipeFilters, RecipeDetail, Collection } from '@app-types/recipe';
import type { Database } from '@app-types/database';

type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type IngredientInsert = Database['public']['Tables']['recipe_ingredients']['Insert'];
type StepInsert = Database['public']['Tables']['recipe_steps']['Insert'];

export interface CreateRecipeInput {
  recipe: Omit<RecipeInsert, 'user_id'>;
  ingredients: Omit<IngredientInsert, 'recipe_id'>[];
  steps: Omit<StepInsert, 'recipe_id'>[];
}

export async function fetchRecipes(userId: string, filters: RecipeFilters = {}) {
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order(filters.orderBy ?? 'created_at', { ascending: filters.orderBy === 'title' });

  if (filters.isFavorite) query = query.eq('is_favorite', true);
  if (filters.cuisine) query = query.eq('cuisine', filters.cuisine);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters.maxTotalMinutes) query = query.lte('total_time_minutes', filters.maxTotalMinutes);
  if (filters.searchQuery) {
    query = query.textSearch('search_vector', filters.searchQuery);
  }
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) query = query.range(filters.offset, (filters.offset ?? 0) + (filters.limit ?? 20) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchRecipeById(id: string): Promise<RecipeDetail> {
  const [recipeRes, ingredientsRes, stepsRes, collectionsRes] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', id).single(),
    supabase.from('recipe_ingredients').select('*').eq('recipe_id', id).order('order_index'),
    supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('order_index'),
    supabase
      .from('recipe_collections')
      .select('collections(*)')
      .eq('recipe_id', id),
  ]);

  if (recipeRes.error) throw recipeRes.error;

  return {
    ...recipeRes.data,
    ingredients: ingredientsRes.data ?? [],
    steps: stepsRes.data ?? [],
    collections: (collectionsRes.data?.map((rc) => (rc as { collections: unknown }).collections).flat().filter(Boolean) ?? []) as Collection[],
  };
}

export async function createRecipe(input: CreateRecipeInput & { userId: string }) {
  const { userId, recipe, ingredients, steps } = input;

  const { data: recipeRow, error: recipeError } = await supabase
    .from('recipes')
    .insert({ ...recipe, user_id: userId })
    .select()
    .single();

  if (recipeError || !recipeRow) throw recipeError;

  if (ingredients.length > 0) {
    const { error } = await supabase.from('recipe_ingredients').insert(
      ingredients.map((ing, i) => ({
        ...ing,
        recipe_id: recipeRow.id,
        order_index: ing.order_index ?? i,
      }))
    );
    if (error) throw error;
  }

  if (steps.length > 0) {
    const { error } = await supabase.from('recipe_steps').insert(
      steps.map((step, i) => ({
        ...step,
        recipe_id: recipeRow.id,
        order_index: step.order_index ?? i,
      }))
    );
    if (error) throw error;
  }

  return recipeRow;
}

export async function updateRecipe(
  id: string,
  data: {
    recipe?: Database['public']['Tables']['recipes']['Update'];
    ingredients?: Omit<IngredientInsert, 'recipe_id'>[];
    steps?: Omit<StepInsert, 'recipe_id'>[];
  }
) {
  if (data.recipe) {
    const { error } = await supabase.from('recipes').update(data.recipe).eq('id', id);
    if (error) throw error;
  }

  if (data.ingredients) {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
    if (data.ingredients.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(
        data.ingredients.map((ing, i) => ({ ...ing, recipe_id: id, order_index: i }))
      );
      if (error) throw error;
    }
  }

  if (data.steps) {
    await supabase.from('recipe_steps').delete().eq('recipe_id', id);
    if (data.steps.length > 0) {
      const { error } = await supabase.from('recipe_steps').insert(
        data.steps.map((step, i) => ({ ...step, recipe_id: id, order_index: i }))
      );
      if (error) throw error;
    }
  }
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  const { error } = await supabase.from('recipes').update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
}
