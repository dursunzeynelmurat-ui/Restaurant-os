import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { usePantry, useAddPantryItem, useDeletePantryItem } from '@hooks/usePantry';
import { EmptyState } from '@components/ui/EmptyState';
import { PantryItemRow } from '@components/pantry/PantryItemRow';

export default function PantryScreen() {
  const [newItem, setNewItem] = useState('');
  const { data: pantryItems, isLoading, refetch, isRefetching } = usePantry();
  const { mutate: addItem, isPending: isAdding } = useAddPantryItem();
  const { mutate: deleteItem } = useDeletePantryItem();

  function handleAdd() {
    const name = newItem.trim();
    if (!name) return;
    addItem({ name, normalized_name: name.toLowerCase() });
    setNewItem('');
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Remove Item', `Remove "${name}" from pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteItem(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <Text style={styles.subtitle}>{(pantryItems?.length ?? 0)} items</Text>
      </View>

      {/* Add Item Input */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add an ingredient (e.g. eggs, olive oil)..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <Pressable
          style={[styles.addButton, (!newItem.trim() || isAdding) && styles.disabledButton]}
          onPress={handleAdd}
          disabled={!newItem.trim() || isAdding}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {/* What can I cook CTA */}
      {(pantryItems?.length ?? 0) >= 3 && (
        <Pressable style={styles.cookCard} onPress={() => router.push('/what-can-i-cook/')}>
          <Text style={styles.cookEmoji}>🍳</Text>
          <Text style={styles.cookText}>What can I cook with these?</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}

      {(pantryItems?.length ?? 0) === 0 && !isLoading ? (
        <EmptyState
          emoji="🥕"
          title="Your pantry is empty"
          description="Add ingredients you have at home to get recipe suggestions"
        />
      ) : (
        <FlatList
          data={pantryItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <PantryItemRow item={item} onDelete={handleDelete} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary },
  addSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.5 },
  addButtonText: { fontSize: 24, color: '#fff' },
  cookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  cookEmoji: { fontSize: 20 },
  cookText: { ...Typography.bodyMedium, color: '#fff', flex: 1 },
  chevron: { fontSize: 20, color: 'rgba(255,255,255,0.8)' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
});
