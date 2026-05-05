import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { formatQuantity } from '@lib/utils/format';
import { scaleQuantity } from '@lib/utils/scale';
import type { RecipeIngredient } from '@app-types/recipe';

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  scaleFactor?: number;
  checkable?: boolean;
}

export function IngredientList({ ingredients, scaleFactor = 1, checkable = false }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <View style={styles.container}>
      {ingredients.map((ingredient) => {
        const scaledQty = scaleQuantity(ingredient.quantity, scaleFactor);
        const isChecked = checked.has(ingredient.id);

        return (
          <Pressable
            key={ingredient.id}
            style={[styles.row, isChecked && styles.checkedRow]}
            onPress={checkable ? () => toggle(ingredient.id) : undefined}
            disabled={!checkable}
          >
            {checkable && (
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
            )}
            <Text style={[styles.quantity, isChecked && styles.checkedText]}>
              {scaledQty != null ? formatQuantity(scaledQty) : ''}{' '}
              {ingredient.unit ?? ''}
            </Text>
            <Text style={[styles.name, isChecked && styles.checkedText]} numberOfLines={2}>
              {ingredient.name}
              {ingredient.notes ? (
                <Text style={styles.notes}>, {ingredient.notes}</Text>
              ) : null}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  checkedRow: { opacity: 0.5 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  quantity: { ...Typography.bodySmallMedium, color: Colors.textPrimary, minWidth: 50 },
  name: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  notes: { ...Typography.bodySmall, color: Colors.textSecondary },
  checkedText: { textDecorationLine: 'line-through', color: Colors.textMuted },
});
