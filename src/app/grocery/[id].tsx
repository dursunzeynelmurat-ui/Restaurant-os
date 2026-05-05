import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useGroceryList, useToggleGroceryItem, useAddGroceryItems } from '@hooks/useGroceryLists';
import { GROCERY_CATEGORY_LABELS } from '@app-types/grocery';
import { useState } from 'react';

export default function GroceryListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch, isRefetching } = useGroceryList(id);
  const { mutate: toggleItem } = useToggleGroceryItem(id);
  const { mutate: addItems } = useAddGroceryItems(id);
  const [newItemName, setNewItemName] = useState('');

  const items = data?.items ?? [];
  const checkedCount = items.filter((i) => i.is_checked).length;

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category ?? 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  function handleAddItem() {
    const name = newItemName.trim();
    if (!name) return;
    addItems([{ name, category: 'other', is_checked: false, order_index: items.length }]);
    setNewItemName('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{data?.name ?? 'Grocery List'}</Text>
          <Text style={styles.subtitle}>{checkedCount}/{items.length} checked</Text>
        </View>
      </View>

      {/* Add item */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Add item..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleAddItem}
        />
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([cat]) => cat}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        renderItem={({ item: [category, categoryItems] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {GROCERY_CATEGORY_LABELS[category as keyof typeof GROCERY_CATEGORY_LABELS] ?? category}
            </Text>
            {categoryItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.itemRow}
                onPress={() => toggleItem({ id: item.id, isChecked: !item.is_checked })}
              >
                <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
                  {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.itemName, item.is_checked && styles.itemChecked]}>
                  {item.quantity != null ? `${item.quantity} ${item.unit ?? ''}`.trim() + ' ' : ''}{item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backText: { ...Typography.body, color: Colors.textSecondary },
  headerInfo: { flex: 1 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textMuted },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { fontSize: 22, color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.bodySmallMedium, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 },
  itemRow: {
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
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  itemName: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  itemChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
});
