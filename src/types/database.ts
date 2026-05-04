// Auto-generated Supabase types. Run `supabase gen types typescript` to refresh.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          preferred_language: string;
          subscription_status: 'free' | 'plus' | 'pro';
          subscription_plan: string | null;
          monthly_ai_usage: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          preferred_language?: string;
          subscription_status?: 'free' | 'plus' | 'pro';
          subscription_plan?: string | null;
          monthly_ai_usage?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          servings: number | null;
          prep_time_minutes: number | null;
          cook_time_minutes: number | null;
          total_time_minutes: number | null;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          cuisine: string | null;
          source_type: 'manual' | 'url' | 'text' | 'screenshot' | null;
          source_url: string | null;
          original_text: string | null;
          language: string;
          cover_image_url: string | null;
          is_favorite: boolean;
          tags: string[];
          dietary_info: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>;
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          name: string;
          normalized_name: string | null;
          quantity: number | null;
          unit: string | null;
          notes: string | null;
          order_index: number;
        };
        Insert: Omit<Database['public']['Tables']['recipe_ingredients']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['recipe_ingredients']['Insert']>;
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          order_index: number;
          instruction: string;
          duration_minutes: number | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['recipe_steps']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['recipe_steps']['Insert']>;
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['collections']['Insert']>;
      };
      recipe_collections: {
        Row: { recipe_id: string; collection_id: string };
        Insert: { recipe_id: string; collection_id: string };
        Update: { recipe_id?: string; collection_id?: string };
      };
      pantry_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          normalized_name: string | null;
          quantity: number | null;
          unit: string | null;
          expiry_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pantry_items']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pantry_items']['Insert']>;
      };
      grocery_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: 'active' | 'completed' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['grocery_lists']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['grocery_lists']['Insert']>;
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          quantity: number | null;
          unit: string | null;
          category: string | null;
          is_checked: boolean;
          order_index: number;
        };
        Insert: Omit<Database['public']['Tables']['grocery_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['grocery_items']['Insert']>;
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meal_plans']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['meal_plans']['Insert']>;
      };
      meal_plan_items: {
        Row: {
          id: string;
          meal_plan_id: string;
          date: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          recipe_id: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['meal_plan_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['meal_plan_items']['Insert']>;
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_estimate: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_usage_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ai_usage_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
