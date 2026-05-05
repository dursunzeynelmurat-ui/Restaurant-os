import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';

interface PantryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface PantryItemRowProps {
  item: PantryItem;
  onDelete: (id: string, name: string) => void;
}

export function PantryItemRow({ item, onDelete }: PantryItemRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>🥘</Text>
      <Text style={styles.name}>{item.name}</Text>
      {item.quantity != null && item.unit ? (
        <Text style={styles.qty}>{item.quantity} {item.unit}</Text>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
        onPress={() => onDelete(item.id, item.name)}
        hitSlop={8}
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginBottom: Spacing.xs,
    ...Shadow.sm,
  },
  emoji: { fontSize: 18 },
  name: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  qty: { ...Typography.bodySmall, color: Colors.textMuted },
  deleteBtn: { padding: Spacing.xs },
  deleteText: { ...Typography.bodySmall, color: Colors.textMuted },
});
