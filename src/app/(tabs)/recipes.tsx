import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useRecipes } from '@hooks/useRecipes';
import { useCollections, useCreateCollection } from '@hooks/useCollections';
import { useUIStore } from '@stores/uiStore';
import { RecipeCard, RecipeListItem } from '@components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '@components/ui/Skeleton';
import { EmptyState } from '@components/ui/EmptyState';
import { router } from 'expo-router';

export default function RecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { recipeViewMode, setRecipeViewMode } = useUIStore();
  const { data: recipes, isLoading, refetch, isRefetching } = useRecipes({
    searchQuery: searchQuery.length >= 2 ? searchQuery : undefined,
  });
  const { data: collections } = useCollections();
  const { mutate: createCollection } = useCreateCollection();

  function handleNewCollection() {
    Alert.prompt(
      'New Collection',
      'Enter a name for this collection',
      (name) => {
        if (name?.trim()) createCollection(name.trim());
      },
      'plain-text',
      '',
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Recipes</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.viewToggle, recipeViewMode === 'grid' && styles.viewToggleActive]}
            onPress={() => setRecipeViewMode('grid')}
          >
            <Text>⊞</Text>
          </Pressable>
          <Pressable
            style={[styles.viewToggle, recipeViewMode === 'list' && styles.viewToggleActive]}
            onPress={() => setRecipeViewMode('list')}
          >
            <Text>☰</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Collections row */}
      {(collections?.length ?? 0) > 0 && (
        <View style={styles.collectionsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsScroll}>
            <Pressable style={styles.newCollectionChip} onPress={handleNewCollection}>
              <Text style={styles.newCollectionChipText}>+ New</Text>
            </Pressable>
            {collections!.map((col) => (
              <Pressable
                key={col.id}
                style={styles.collectionChip}
                onPress={() => router.push(`/collection/${col.id}`)}
              >
                <Text style={styles.collectionChipText}>📂 {col.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {(collections?.length ?? 0) === 0 && (
        <View style={styles.collectionsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsScroll}>
            <Pressable style={styles.newCollectionChip} onPress={handleNewCollection}>
              <Text style={styles.newCollectionChipText}>+ New Collection</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => <RecipeCardSkeleton key={i} />)}
        </View>
      ) : (recipes?.length ?? 0) === 0 ? (
        <EmptyState
          emoji="📖"
          title={searchQuery ? 'No recipes found' : 'No recipes yet'}
          description={searchQuery ? 'Try a different search term' : 'Import or create your first recipe'}
          actionLabel={searchQuery ? undefined : 'Import Recipe'}
          onAction={searchQuery ? undefined : () => router.push('/(tabs)/import')}
        />
      ) : (
        <FlatList
          key={recipeViewMode}
          data={recipes}
          numColumns={recipeViewMode === 'grid' ? 2 : 1}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={recipeViewMode === 'grid' ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) =>
            recipeViewMode === 'grid' ? (
              <View style={styles.gridItem}>
                <RecipeCard recipe={item} />
              </View>
            ) : (
              <RecipeListItem recipe={item} />
            )
          }
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/import/manual')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  viewToggle: {
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  viewToggleActive: { backgroundColor: Colors.primaryLight },
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs },
  searchInput: {
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
  collectionsRow: { marginBottom: Spacing.sm },
  collectionsScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.xs },
  collectionChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  collectionChipText: { ...Typography.bodySmall, color: Colors.textPrimary },
  newCollectionChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  newCollectionChipText: { ...Typography.bodySmall, color: Colors.primaryDark, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  gridItem: { flex: 1, maxWidth: '50%' },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.lg,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
