import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emoji: { fontSize: 48, marginBottom: Spacing.sm },
  title: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center' },
  description: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  button: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl },
});
