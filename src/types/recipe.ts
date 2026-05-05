import type { Database } from './database';

export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
export type RecipeStep = Database['public']['Tables']['recipe_steps']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  collections: Collection[];
}

export interface RecipeFilters {
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxTotalMinutes?: number;
  isFavorite?: boolean;
  collectionId?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'title' | 'total_time_minutes';
  searchQuery?: string;
}

export interface ExtractedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

export interface ExtractedStep {
  instruction: string;
  duration_minutes: number | null;
}

export interface ExtractedRecipe {
  title: string;
  description: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  cuisine: string | null;
  language: string | null;
  tags: string[];
  dietary_info: string[];
  ingredients: ExtractedIngredient[];
  steps: ExtractedStep[];
  missing_info_warnings: string[];
}

export type ImportSourceType = 'url' | 'text' | 'screenshot_base64' | 'manual';

export interface RecipeSuggestion {
  title: string;
  description: string;
  match_percentage: number;
  available_ingredients: string[];
  missing_ingredients: string[];
  estimated_time_minutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string | null;
  is_ai_generated: true;
}
