-- Public bucket for recipe cover images.
-- Files are stored as {userId}/{recipeId}.jpg so RLS checks the first path segment.
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true);

-- Only the owning user can upload/update/delete their images
create policy "recipe_images: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "recipe_images: update own"
  on storage.objects for update
  using (
    bucket_id = 'recipe-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "recipe_images: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read (public bucket for recipe thumbnails)
create policy "recipe_images: public read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');
