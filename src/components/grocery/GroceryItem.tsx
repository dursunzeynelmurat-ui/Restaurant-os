import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import type { GroceryItem as GroceryItemType } from '@app-types/grocery';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (id: string, isChecked: boolean) => void;
}

export function GroceryItem({ item, onToggle }: GroceryItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={() => onToggle(item.id, !item.is_checked)}
    >
      <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
        {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.name, item.is_checked && styles.nameChecked]}>
        {item.quantity != null ? `${item.quantity}${item.unit ? ' ' + item.unit : ''} ` : ''}
        {item.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs + 2,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  name: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  nameChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
});
