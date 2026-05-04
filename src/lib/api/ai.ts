import { supabase } from '@lib/supabase';
import type { ExtractedRecipe, RecipeSuggestion } from '@types/recipe';
import type { GroceryItem } from '@types/grocery';

interface ExtractRecipeInput {
  content: string;
  type: 'url' | 'text' | 'screenshot_base64';
}

interface AILimitError {
  error: 'AI_LIMIT_REACHED';
  current: number;
  limit: number;
}

export async function extractRecipe(input: ExtractRecipeInput): Promise<ExtractedRecipe> {
  const { data, error } = await supabase.functions.invoke<ExtractedRecipe | AILimitError>(
    'extract-recipe',
    { body: input }
  );

  if (error) throw error;
  if (data && 'error' in data) {
    if (data.error === 'AI_LIMIT_REACHED') {
      throw Object.assign(new Error('AI import limit reached'), { code: 'AI_LIMIT_REACHED', ...data });
    }
    throw new Error(data.error);
  }
  return data as ExtractedRecipe;
}

interface SuggestRecipesInput {
  pantry_items: string[];
  preferences?: { cuisine?: string; max_time?: number; dietary?: string[] };
}

export async function suggestRecipes(
  input: SuggestRecipesInput
): Promise<RecipeSuggestion[]> {
  const { data, error } = await supabase.functions.invoke<{ suggestions: RecipeSuggestion[] }>(
    'suggest-recipes',
    { body: input }
  );
  if (error) throw error;
  return data?.suggestions ?? [];
}

interface GenerateGroceryListInput {
  recipe_ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  pantry_items?: string[];
}

export async function generateGroceryList(
  input: GenerateGroceryListInput
): Promise<Omit<GroceryItem, 'id' | 'grocery_list_id' | 'is_checked' | 'order_index'>[]> {
  const { data, error } = await supabase.functions.invoke<{
    items: Omit<GroceryItem, 'id' | 'grocery_list_id' | 'is_checked' | 'order_index'>[];
  }>('generate-grocery-list', { body: input });
  if (error) throw error;
  return data?.items ?? [];
}
