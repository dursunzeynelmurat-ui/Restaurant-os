import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { useGroceryList, useToggleGroceryItem, useAddGroceryItems } from '@hooks/useGroceryLists';
import { CategorySection } from '@components/grocery/CategorySection';

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
          <CategorySection
            category={category}
            items={categoryItems}
            onToggle={(itemId, isChecked) => toggleItem({ id: itemId, isChecked })}
          />
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
});
