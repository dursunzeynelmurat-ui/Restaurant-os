import { supabase } from '@lib/supabase';

export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  imageUri: string
): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const path = `${userId}/${recipeId}.jpg`;

  const { error } = await supabase.storage.from('recipe-images').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteRecipeImage(userId: string, recipeId: string): Promise<void> {
  const path = `${userId}/${recipeId}.jpg`;
  const { error } = await supabase.storage.from('recipe-images').remove([path]);
  if (error) throw error;
}
