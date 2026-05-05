import type { Database } from './database';

export type GroceryList = Database['public']['Tables']['grocery_lists']['Row'];
export type GroceryItem = Database['public']['Tables']['grocery_items']['Row'];

export type GroceryCategory =
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'bakery'
  | 'dry_goods'
  | 'spices'
  | 'frozen'
  | 'beverages'
  | 'other';

export interface GroceryListWithItems extends GroceryList {
  items: GroceryItem[];
}

export const GROCERY_CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: 'Fruits & Vegetables',
  meat: 'Meat & Seafood',
  dairy: 'Dairy & Eggs',
  bakery: 'Bakery & Bread',
  dry_goods: 'Dry Goods & Pasta',
  spices: 'Spices & Condiments',
  frozen: 'Frozen Foods',
  beverages: 'Beverages',
  other: 'Other',
};
