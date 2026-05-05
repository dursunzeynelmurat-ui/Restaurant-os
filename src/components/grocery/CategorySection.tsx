import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';
import { GroceryItem } from './GroceryItem';
import { GROCERY_CATEGORY_LABELS } from '@app-types/grocery';
import type { GroceryItem as GroceryItemType, GroceryCategory } from '@app-types/grocery';

interface CategorySectionProps {
  category: string;
  items: GroceryItemType[];
  onToggle: (id: string, isChecked: boolean) => void;
}

export function CategorySection({ category, items, onToggle }: CategorySectionProps) {
  const label =
    GROCERY_CATEGORY_LABELS[category as GroceryCategory] ??
    category.replace(/_/g, ' ');

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{label}</Text>
      {items.map((item) => (
        <GroceryItem key={item.id} item={item} onToggle={onToggle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.lg },
  title: {
    ...Typography.bodySmallMedium,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
