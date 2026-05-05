import { supabase } from '@lib/supabase';
import type { Database } from '@app-types/database';

type PantryInsert = Database['public']['Tables']['pantry_items']['Insert'];

export async function fetchPantryItems(userId: string) {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function addPantryItem(userId: string, item: Omit<PantryInsert, 'user_id'>) {
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({ ...item, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePantryItem(
  id: string,
  updates: Database['public']['Tables']['pantry_items']['Update']
) {
  const { error } = await supabase.from('pantry_items').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePantryItem(id: string) {
  const { error } = await supabase.from('pantry_items').delete().eq('id', id);
  if (error) throw error;
}

export async function clearPantry(userId: string) {
  const { error } = await supabase.from('pantry_items').delete().eq('user_id', userId);
  if (error) throw error;
}
