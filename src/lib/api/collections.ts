import { supabase } from '@lib/supabase';

export async function fetchCollections(userId: string) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function fetchCollectionById(id: string) {
  const [collectionRes, recipesRes] = await Promise.all([
    supabase.from('collections').select('*').eq('id', id).single(),
    supabase
      .from('recipe_collections')
      .select('recipes(*)')
      .eq('collection_id', id),
  ]);
  if (collectionRes.error) throw collectionRes.error;
  return {
    ...collectionRes.data,
    recipes: recipesRes.data?.map((rc) => (rc as { recipes: unknown }).recipes).flat().filter(Boolean) ?? [],
  };
}

export async function createCollection(userId: string, name: string) {
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCollection(id: string, name: string) {
  const { error } = await supabase.from('collections').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteCollection(id: string) {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function addRecipeToCollection(recipeId: string, collectionId: string) {
  const { error } = await supabase
    .from('recipe_collections')
    .upsert({ recipe_id: recipeId, collection_id: collectionId });
  if (error) throw error;
}

export async function removeRecipeFromCollection(recipeId: string, collectionId: string) {
  const { error } = await supabase
    .from('recipe_collections')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('collection_id', collectionId);
  if (error) throw error;
}
