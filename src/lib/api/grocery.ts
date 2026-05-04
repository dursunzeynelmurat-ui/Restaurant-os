import { supabase } from '@lib/supabase';
import type { Database } from '@types/database';

type GroceryItemInsert = Database['public']['Tables']['grocery_items']['Insert'];

export async function fetchGroceryLists(userId: string) {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchGroceryListById(id: string) {
  const [listRes, itemsRes] = await Promise.all([
    supabase.from('grocery_lists').select('*').eq('id', id).single(),
    supabase.from('grocery_items').select('*').eq('grocery_list_id', id).order('category').order('name'),
  ]);
  if (listRes.error) throw listRes.error;
  return { ...listRes.data, items: itemsRes.data ?? [] };
}

export async function createGroceryList(userId: string, name: string) {
  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addGroceryItems(listId: string, items: Omit<GroceryItemInsert, 'grocery_list_id'>[]) {
  const { error } = await supabase
    .from('grocery_items')
    .insert(items.map((item) => ({ ...item, grocery_list_id: listId })));
  if (error) throw error;
}

export async function toggleGroceryItem(id: string, isChecked: boolean) {
  const { error } = await supabase.from('grocery_items').update({ is_checked: isChecked }).eq('id', id);
  if (error) throw error;
}

export async function deleteGroceryItem(id: string) {
  const { error } = await supabase.from('grocery_items').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteGroceryList(id: string) {
  const { error } = await supabase.from('grocery_lists').delete().eq('id', id);
  if (error) throw error;
}

export async function archiveGroceryList(id: string) {
  const { error } = await supabase.from('grocery_lists').update({ status: 'archived' }).eq('id', id);
  if (error) throw error;
}
