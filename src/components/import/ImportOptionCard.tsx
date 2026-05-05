import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';

interface ImportOptionCardProps {
  emoji: string;
  title: string;
  desc: string;
  isActive?: boolean;
  onPress: () => void;
}

export function ImportOptionCard({ emoji, title, desc, isActive = false, onPress }: ImportOptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, isActive && styles.titleActive]}>{title}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </Pressable>
  );
}

export function ImportRowCard({
  emoji,
  title,
  desc,
  onPress,
}: Omit<ImportOptionCardProps, 'isActive'>) {
  return (
    <Pressable
      style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
      onPress={onPress}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.xs,
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  emoji: { fontSize: 28 },
  title: { ...Typography.bodySmallMedium, color: Colors.textPrimary },
  titleActive: { color: Colors.primaryDark },
  desc: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  rowCardPressed: { backgroundColor: Colors.surfaceAlt },
  rowEmoji: { fontSize: 24 },
  rowInfo: { flex: 1 },
  rowTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  rowDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textMuted },
});
