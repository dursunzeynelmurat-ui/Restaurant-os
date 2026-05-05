-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "pg_cron";

-- ─── Users ──────────────────────────────────────────────────────────────────
-- Mirrors auth.users with app-specific subscription and usage fields.
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  preferred_language text default 'en',
  subscription_status text default 'free'
    check (subscription_status in ('free', 'plus', 'pro')),
  subscription_plan text,
  monthly_ai_usage integer default 0,
  created_at timestamptz default now()
);

-- ─── Recipes ────────────────────────────────────────────────────────────────
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  servings integer,
  prep_time_minutes integer,
  cook_time_minutes integer,
  total_time_minutes integer,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  cuisine text,
  source_type text check (source_type in ('manual', 'url', 'text', 'screenshot')),
  source_url text,
  original_text text,
  language text default 'en',
  cover_image_url text,
  is_favorite boolean default false,
  tags text[] default '{}',
  dietary_info text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(cuisine, '')
    )
  ) stored
);

create index recipes_user_id_idx on public.recipes(user_id);
create index recipes_search_idx on public.recipes using gin(search_vector);
create index recipes_created_at_idx on public.recipes(created_at desc);
create index recipes_is_favorite_idx on public.recipes(user_id, is_favorite) where is_favorite = true;

-- ─── Recipe Ingredients ─────────────────────────────────────────────────────
create table public.recipe_ingredients (
  id uuid default uuid_generate_v4() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  name text not null,
  normalized_name text,
  quantity numeric,
  unit text,
  notes text,
  order_index integer not null
);

create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients(recipe_id, order_index);

-- ─── Recipe Steps ───────────────────────────────────────────────────────────
create table public.recipe_steps (
  id uuid default uuid_generate_v4() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  order_index integer not null,
  instruction text not null,
  duration_minutes integer,
  notes text
);

create index recipe_steps_recipe_id_idx on public.recipe_steps(recipe_id, order_index);

-- ─── Collections ────────────────────────────────────────────────────────────
create table public.collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  cover_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index collections_user_id_idx on public.collections(user_id);

-- ─── Recipe ↔ Collection (join) ─────────────────────────────────────────────
create table public.recipe_collections (
  recipe_id uuid references public.recipes(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,
  primary key (recipe_id, collection_id)
);

-- ─── Pantry Items ───────────────────────────────────────────────────────────
create table public.pantry_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  normalized_name text,
  quantity numeric,
  unit text,
  expiry_date date,
  created_at timestamptz default now()
);

create index pantry_items_user_id_idx on public.pantry_items(user_id);

-- ─── Grocery Lists ──────────────────────────────────────────────────────────
create table public.grocery_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index grocery_lists_user_id_idx on public.grocery_lists(user_id);

-- ─── Grocery Items ──────────────────────────────────────────────────────────
create table public.grocery_items (
  id uuid default uuid_generate_v4() primary key,
  grocery_list_id uuid references public.grocery_lists(id) on delete cascade not null,
  name text not null,
  quantity numeric,
  unit text,
  category text,
  is_checked boolean default false,
  order_index integer default 0
);

create index grocery_items_list_idx on public.grocery_items(grocery_list_id);

-- ─── Meal Plans ─────────────────────────────────────────────────────────────
create table public.meal_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  week_start_date date not null,
  created_at timestamptz default now(),
  unique(user_id, week_start_date)
);

-- ─── Meal Plan Items ────────────────────────────────────────────────────────
create table public.meal_plan_items (
  id uuid default uuid_generate_v4() primary key,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade not null,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid references public.recipes(id) on delete set null,
  notes text
);

create index meal_plan_items_plan_idx on public.meal_plan_items(meal_plan_id, date);

-- ─── AI Usage Logs ──────────────────────────────────────────────────────────
create table public.ai_usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  feature text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  cost_estimate numeric(10, 6),
  created_at timestamptz default now()
);

create index ai_usage_logs_user_month_idx on public.ai_usage_logs(user_id, created_at);

-- ─── Triggers ───────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.handle_updated_at();

create trigger collections_updated_at
  before update on public.collections
  for each row execute procedure public.handle_updated_at();

create trigger grocery_lists_updated_at
  before update on public.grocery_lists
  for each row execute procedure public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Monthly reset of AI usage counters (requires pg_cron)
select cron.schedule(
  'reset-monthly-ai-usage',
  '0 0 1 * *',
  'update public.users set monthly_ai_usage = 0'
);
