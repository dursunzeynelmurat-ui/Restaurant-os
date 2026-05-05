import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { useCollectionDetail, useUpdateCollection, useDeleteCollection } from '@hooks/useCollections';
import { RecipeCard } from '@components/recipe/RecipeCard';
import { EmptyState } from '@components/ui/EmptyState';
import type { Recipe } from '@app-types/recipe';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: collection, isLoading } = useCollectionDetail(id);
  const { mutate: updateCollection } = useUpdateCollection(id);
  const { mutate: deleteCollection } = useDeleteCollection();

  const recipes = (collection?.recipes ?? []) as Recipe[];

  function handleRename() {
    Alert.prompt(
      'Rename Collection',
      'Enter a new name',
      (name) => { if (name?.trim()) updateCollection(name.trim()); },
      'plain-text',
      collection?.name ?? '',
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete Collection',
      `Delete "${collection?.name ?? 'this collection'}"? Recipes will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection(id, { onSuccess: () => router.back() });
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{collection?.name ?? 'Collection'}</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={handleRename}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleDelete}>
            <Text style={styles.iconBtnText}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      {recipes.length === 0 && !isLoading ? (
        <EmptyState
          emoji="📂"
          title="Empty collection"
          description="Add recipes to this collection from the recipe detail screen"
        />
      ) : (
        <FlatList
          data={recipes}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <RecipeCard recipe={item} />
            </View>
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
  title: { ...Typography.h3, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  iconBtnText: { fontSize: 18 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  cardWrapper: { flex: 1, maxWidth: '50%' },
});
