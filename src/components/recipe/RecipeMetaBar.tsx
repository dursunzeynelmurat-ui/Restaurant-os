import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { formatMinutes } from '@lib/utils/format';
import type { Recipe } from '@app-types/recipe';

interface RecipeMetaBarProps {
  recipe: Pick<Recipe, 'prep_time_minutes' | 'cook_time_minutes' | 'total_time_minutes' | 'difficulty' | 'servings'>;
}

export function RecipeMetaBar({ recipe }: RecipeMetaBarProps) {
  const items = [
    recipe.prep_time_minutes && { icon: '🥄', label: 'Prep', value: formatMinutes(recipe.prep_time_minutes) },
    recipe.cook_time_minutes && { icon: '🔥', label: 'Cook', value: formatMinutes(recipe.cook_time_minutes) },
    recipe.total_time_minutes && { icon: '⏱', label: 'Total', value: formatMinutes(recipe.total_time_minutes) },
    recipe.servings && { icon: '👥', label: 'Serves', value: String(recipe.servings) },
    recipe.difficulty && { icon: '📊', label: 'Level', value: recipe.difficulty },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  icon: { fontSize: 18 },
  value: { ...Typography.bodySmallMedium, color: Colors.textPrimary },
  label: { ...Typography.caption, color: Colors.textMuted },
});
