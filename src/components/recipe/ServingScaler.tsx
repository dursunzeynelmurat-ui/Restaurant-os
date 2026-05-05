import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

interface ServingScalerProps {
  currentServings: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ServingScaler({ currentServings, onIncrement, onDecrement }: ServingScalerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Servings</Text>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={onDecrement} disabled={currentServings <= 1}>
          <Text style={[styles.buttonText, currentServings <= 1 && styles.disabled]}>−</Text>
        </Pressable>
        <Text style={styles.count}>{currentServings}</Text>
        <Pressable style={styles.button} onPress={onIncrement} disabled={currentServings >= 100}>
          <Text style={[styles.buttonText, currentServings >= 100 && styles.disabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  label: { ...Typography.bodyMedium, color: Colors.textPrimary },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { ...Typography.h3, color: Colors.textPrimary, lineHeight: 22 },
  disabled: { color: Colors.textMuted },
  count: { ...Typography.h4, color: Colors.textPrimary, minWidth: 28, textAlign: 'center' },
});
