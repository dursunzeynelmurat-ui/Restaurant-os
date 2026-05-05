import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, Modal, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useRecipeDetail, useDeleteRecipe, useToggleFavorite } from '@hooks/useRecipes';
import { useCollections, useAddToCollection, useRemoveFromCollection, useCreateCollection } from '@hooks/useCollections';
import { useCookingStore } from '@stores/cookingStore';
import { IngredientList } from '@components/recipe/IngredientList';
import { StepList } from '@components/recipe/StepList';
import { RecipeMetaBar } from '@components/recipe/RecipeMetaBar';
import { ServingScaler } from '@components/recipe/ServingScaler';
import { useServingScaler } from '@hooks/useServingScaler';
import { Skeleton } from '@components/ui/Skeleton';
import type { Collection } from '@app-types/recipe';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipeDetail(id);
  const { data: allCollections } = useCollections();
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: addToCollection } = useAddToCollection();
  const { mutate: removeFromCollection } = useRemoveFromCollection();
  const { mutate: createCollection, isPending: isCreating } = useCreateCollection();
  const startCooking = useCookingStore((s) => s.startCooking);
  const { currentServings, scaleFactor, increment, decrement } = useServingScaler(recipe?.servings);

  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const recipeCollectionIds = new Set((recipe?.collections ?? []).map((c: Collection) => c.id));

  function handleDelete() {
    Alert.alert('Delete Recipe', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRecipe(id, { onSuccess: () => router.replace('/(tabs)/recipes') });
        },
      },
    ]);
  }

  function handleStartCooking() {
    startCooking(id, currentServings);
    router.push(`/cooking/${id}`);
  }

  function toggleCollection(collectionId: string) {
    if (recipeCollectionIds.has(collectionId)) {
      removeFromCollection({ recipeId: id, collectionId });
    } else {
      addToCollection({ recipeId: id, collectionId });
    }
  }

  function handleCreateCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name, {
      onSuccess: (newCol) => {
        if (newCol) addToCollection({ recipeId: id, collectionId: newCol.id });
        setNewCollectionName('');
      },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
          <Skeleton height={200} borderRadius={16} />
          <Skeleton height={24} width="70%" />
          <Skeleton height={16} width="50%" />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ ...Typography.body, color: Colors.textSecondary }}>Recipe not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => toggleFavorite({ id, isFavorite: !recipe.is_favorite })}
          >
            <Text style={{ fontSize: 20, color: recipe.is_favorite ? Colors.error : Colors.textMuted }}>
              {recipe.is_favorite ? '♥' : '♡'}
            </Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push(`/recipe/${id}/edit`)}>
            <Text style={styles.iconButtonText}>✏️</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleDelete}>
            <Text style={styles.iconButtonText}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {recipe.cover_image_url ? (
          <Image source={{ uri: recipe.cover_image_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={{ fontSize: 64 }}>🍽️</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
          {recipe.source_url && (
            <Text style={styles.source} numberOfLines={1}>Source: {recipe.source_url}</Text>
          )}

          {/* Meta Bar */}
          <RecipeMetaBar recipe={recipe} />

          {/* Serving Scaler */}
          {recipe.servings && (
            <ServingScaler
              currentServings={currentServings}
              onIncrement={increment}
              onDecrement={decrement}
            />
          )}

          {/* Ingredients */}
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <IngredientList
            ingredients={recipe.ingredients}
            scaleFactor={scaleFactor}
            checkable
            recipeTitle={recipe.title}
          />

          {/* Steps */}
          <Text style={styles.sectionTitle}>Instructions</Text>
          <StepList steps={recipe.steps} />

          {/* Collections */}
          <View style={styles.collectionsSection}>
            <View style={styles.collectionsSectionHeader}>
              <Text style={styles.sectionTitle}>Collections</Text>
              <Pressable onPress={() => setShowCollectionModal(true)}>
                <Text style={styles.manageCollections}>Manage</Text>
              </Pressable>
            </View>
            {recipe.collections.length === 0 ? (
              <Pressable style={styles.addCollectionHint} onPress={() => setShowCollectionModal(true)}>
                <Text style={styles.addCollectionHintText}>+ Add to a collection</Text>
              </Pressable>
            ) : (
              <View style={styles.collectionChips}>
                {recipe.collections.map((col: Collection) => (
                  <Pressable
                    key={col.id}
                    style={styles.collectionChip}
                    onPress={() => router.push(`/collection/${col.id}`)}
                  >
                    <Text style={styles.collectionChipText}>📂 {col.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Cook Button */}
          <Pressable style={styles.cookButton} onPress={handleStartCooking}>
            <Text style={styles.cookButtonText}>🍳 Start Cooking</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Collection Picker Modal */}
      <Modal visible={showCollectionModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowCollectionModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Collections</Text>
            <Pressable onPress={() => setShowCollectionModal(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>

          <FlatList
            data={allCollections ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <Text style={styles.modalEmpty}>No collections yet. Create one below.</Text>
            }
            renderItem={({ item }) => {
              const inCollection = recipeCollectionIds.has(item.id);
              return (
                <Pressable style={styles.collectionRow} onPress={() => toggleCollection(item.id)}>
                  <Text style={styles.collectionRowName}>📂 {item.name}</Text>
                  <View style={[styles.checkbox, inCollection && styles.checkboxChecked]}>
                    {inCollection && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              <View style={styles.newCollectionRow}>
                <TextInput
                  style={styles.newCollectionInput}
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  placeholder="New collection name..."
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateCollection}
                />
                <Pressable
                  style={[styles.createButton, (!newCollectionName.trim() || isCreating) && styles.createButtonDisabled]}
                  onPress={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isCreating}
                >
                  <Text style={styles.createButtonText}>{isCreating ? '...' : 'Create'}</Text>
                </Pressable>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backText: { ...Typography.body, color: Colors.textSecondary },
  topActions: { flexDirection: 'row', gap: Spacing.xs },
  iconButton: { padding: Spacing.xs + 2 },
  iconButtonText: { fontSize: 18 },
  coverImage: { width: '100%', height: 220 },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { paddingBottom: Spacing.xxl },
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { ...Typography.h2, color: Colors.textPrimary },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 26 },
  source: { ...Typography.caption, color: Colors.textMuted },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginTop: Spacing.sm },
  collectionsSection: { gap: Spacing.sm },
  collectionsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manageCollections: { ...Typography.bodySmall, color: Colors.primary },
  addCollectionHint: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addCollectionHintText: { ...Typography.bodySmall, color: Colors.primary },
  collectionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  collectionChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  collectionChipText: { ...Typography.bodySmall, color: Colors.textPrimary },
  cookButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  cookButtonText: { ...Typography.h4, color: '#fff' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary },
  modalDone: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  modalList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  modalEmpty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
  collectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  collectionRowName: { ...Typography.body, color: Colors.textPrimary },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs + 2,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  newCollectionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  newCollectionInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { ...Typography.bodySmallMedium, color: '#fff' },
});
