import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useRecipeDetail, useDeleteRecipe, useToggleFavorite } from '@hooks/useRecipes';
import { useCookingStore } from '@stores/cookingStore';
import { IngredientList } from '@components/recipe/IngredientList';
import { StepList } from '@components/recipe/StepList';
import { RecipeMetaBar } from '@components/recipe/RecipeMetaBar';
import { ServingScaler } from '@components/recipe/ServingScaler';
import { useServingScaler } from '@hooks/useServingScaler';
import { Skeleton } from '@components/ui/Skeleton';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipeDetail(id);
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const startCooking = useCookingStore((s) => s.startCooking);
  const { currentServings, scaleFactor, increment, decrement } = useServingScaler(recipe?.servings);

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
          />

          {/* Steps */}
          <Text style={styles.sectionTitle}>Instructions</Text>
          <StepList steps={recipe.steps} />

          {/* Actions */}
          <Pressable style={styles.cookButton} onPress={handleStartCooking}>
            <Text style={styles.cookButtonText}>🍳 Start Cooking</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  cookButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  cookButtonText: { ...Typography.h4, color: '#fff' },
});
