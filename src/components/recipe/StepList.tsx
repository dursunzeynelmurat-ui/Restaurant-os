import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { formatMinutes } from '@lib/utils/format';
import type { RecipeStep } from '@types/recipe';

interface StepListProps {
  steps: RecipeStep[];
  highlightIndex?: number;
}

export function StepList({ steps, highlightIndex }: StepListProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View
          key={step.id}
          style={[styles.step, highlightIndex === index && styles.highlighted]}
        >
          <View style={styles.numberBadge}>
            <Text style={styles.number}>{step.order_index + 1}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.instruction}>{step.instruction}</Text>
            {step.duration_minutes && (
              <Text style={styles.duration}>⏱ {formatMinutes(step.duration_minutes)}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  step: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  highlighted: {
    backgroundColor: Colors.primaryLight,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  number: { ...Typography.captionMedium, color: '#fff' },
  content: { flex: 1, gap: Spacing.xs },
  instruction: { ...Typography.body, color: Colors.textPrimary, lineHeight: 24 },
  duration: { ...Typography.bodySmall, color: Colors.textSecondary },
});
