import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import type { MealPlanItemWithRecipe } from '@lib/api/mealPlan';

const MEAL_LABELS: Record<string, string> = {
  breakfast: '☀️ Breakfast',
  lunch: '🌤️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
};

interface MealSlotProps {
  mealType: string;
  items: MealPlanItemWithRecipe[];
  onRemoveItem: (id: string) => void;
}

export function MealSlot({ mealType, items, onRemoveItem }: MealSlotProps) {
  return (
    <View style={styles.slot}>
      <Text style={styles.label}>{MEAL_LABELS[mealType] ?? mealType}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>+ Add</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
            onLongPress={() => onRemoveItem(item.id)}
          >
            <Text style={styles.cardText} numberOfLines={2}>
              {item.recipes?.title ?? 'Recipe'}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs + 2,
    marginBottom: Spacing.xs,
    minHeight: 64,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  label: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  empty: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xs,
    padding: Spacing.xs,
    marginTop: 4,
  },
  cardText: { ...Typography.caption, color: Colors.primaryDark },
});
