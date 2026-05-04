-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.collections enable row level security;
alter table public.recipe_collections enable row level security;
alter table public.pantry_items enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.ai_usage_logs enable row level security;

-- ─── users ──────────────────────────────────────────────────────────────────
create policy "users: own row only"
  on public.users for all
  using (auth.uid() = id);

-- ─── recipes ────────────────────────────────────────────────────────────────
create policy "recipes: own data only"
  on public.recipes for all
  using (auth.uid() = user_id);

-- ─── recipe_ingredients ─────────────────────────────────────────────────────
create policy "recipe_ingredients: via recipe ownership"
  on public.recipe_ingredients for all
  using (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

-- ─── recipe_steps ───────────────────────────────────────────────────────────
create policy "recipe_steps: via recipe ownership"
  on public.recipe_steps for all
  using (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

-- ─── collections ────────────────────────────────────────────────────────────
create policy "collections: own data only"
  on public.collections for all
  using (auth.uid() = user_id);

-- ─── recipe_collections ─────────────────────────────────────────────────────
create policy "recipe_collections: via collection ownership"
  on public.recipe_collections for all
  using (
    exists (
      select 1 from public.collections
      where id = collection_id and user_id = auth.uid()
    )
  );

-- ─── pantry_items ───────────────────────────────────────────────────────────
create policy "pantry_items: own data only"
  on public.pantry_items for all
  using (auth.uid() = user_id);

-- ─── grocery_lists ──────────────────────────────────────────────────────────
create policy "grocery_lists: own data only"
  on public.grocery_lists for all
  using (auth.uid() = user_id);

-- ─── grocery_items ──────────────────────────────────────────────────────────
create policy "grocery_items: via list ownership"
  on public.grocery_items for all
  using (
    exists (
      select 1 from public.grocery_lists
      where id = grocery_list_id and user_id = auth.uid()
    )
  );

-- ─── meal_plans ─────────────────────────────────────────────────────────────
create policy "meal_plans: own data only"
  on public.meal_plans for all
  using (auth.uid() = user_id);

-- ─── meal_plan_items ────────────────────────────────────────────────────────
create policy "meal_plan_items: via plan ownership"
  on public.meal_plan_items for all
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_id and user_id = auth.uid()
    )
  );

-- ─── ai_usage_logs ──────────────────────────────────────────────────────────
create policy "ai_usage_logs: own data only"
  on public.ai_usage_logs for all
  using (auth.uid() = user_id);
