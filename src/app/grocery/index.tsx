import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useGroceryLists, useCreateGroceryList, useDeleteGroceryList } from '@hooks/useGroceryLists';
import { EmptyState } from '@components/ui/EmptyState';
import { format } from 'date-fns';

export default function GroceryIndexScreen() {
  const { data: lists, isLoading, refetch, isRefetching } = useGroceryLists();
  const { mutate: createList, isPending } = useCreateGroceryList();
  const { mutate: deleteList } = useDeleteGroceryList();

  function handleCreate() {
    const name = `Shopping list – ${format(new Date(), 'MMM d')}`;
    createList(name, {
      onSuccess: (list) => router.push(`/grocery/${list.id}`),
    });
  }

  function handleDelete(id: string) {
    Alert.alert('Delete List', 'Delete this grocery list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteList(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Grocery Lists</Text>
        <Pressable style={styles.newButton} onPress={handleCreate} disabled={isPending}>
          <Text style={styles.newButtonText}>+ New</Text>
        </Pressable>
      </View>

      {(lists?.length ?? 0) === 0 && !isLoading ? (
        <EmptyState
          emoji="🛒"
          title="No grocery lists"
          description="Create a list or generate one from a recipe"
          actionLabel="Create List"
          onAction={handleCreate}
        />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <Pressable
              style={styles.listCard}
              onPress={() => router.push(`/grocery/${item.id}`)}
              onLongPress={() => handleDelete(item.id)}
            >
              <Text style={styles.listEmoji}>🛒</Text>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listDate}>{format(new Date(item.created_at), 'MMM d, yyyy')}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backText: { ...Typography.body, color: Colors.textSecondary },
  title: { ...Typography.h3, color: Colors.textPrimary },
  newButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  newButtonText: { ...Typography.bodySmallMedium, color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  listEmoji: { fontSize: 24 },
  listInfo: { flex: 1 },
  listName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  listDate: { ...Typography.caption, color: Colors.textMuted },
  chevron: { fontSize: 20, color: Colors.textMuted },
});
