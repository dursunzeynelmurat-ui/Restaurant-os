import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { Badge } from '@components/ui/Badge';
import { formatMinutes } from '@lib/utils/format';
import type { Recipe } from '@types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onLongPress?: () => void;
}

export function RecipeCard({ recipe, onLongPress }: RecipeCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      onLongPress={onLongPress}
    >
      <View style={styles.imageContainer}>
        {recipe.cover_image_url ? (
          <Image source={{ uri: recipe.cover_image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
        {recipe.is_favorite && (
          <View style={styles.favoriteBadge}>
            <Text style={{ fontSize: 12 }}>♥</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.meta}>
          {recipe.total_time_minutes && (
            <Text style={styles.metaText}>{formatMinutes(recipe.total_time_minutes)}</Text>
          )}
          {recipe.difficulty && (
            <Badge label={recipe.difficulty} variant="default" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function RecipeListItem({ recipe }: RecipeCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
    >
      <View style={styles.listImageContainer}>
        {recipe.cover_image_url ? (
          <Image source={{ uri: recipe.cover_image_url }} style={styles.listImage} resizeMode="cover" />
        ) : (
          <View style={[styles.listImage, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 22 }}>🍽️</Text>
          </View>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.meta}>
          {recipe.cuisine && <Text style={styles.metaText}>{recipe.cuisine}</Text>}
          {recipe.total_time_minutes && (
            <Text style={styles.metaText}>{formatMinutes(recipe.total_time_minutes)}</Text>
          )}
        </View>
      </View>
      {recipe.is_favorite && <Text style={styles.favIcon}>♥</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  pressed: { opacity: 0.85 },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 130, backgroundColor: Colors.surfaceAlt },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 36 },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: Spacing.sm },
  title: { ...Typography.bodySmallMedium, color: Colors.textPrimary, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
    marginBottom: Spacing.xs,
  },
  listImageContainer: { flexShrink: 0 },
  listImage: { width: 64, height: 64, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceAlt },
  listInfo: { flex: 1 },
  favIcon: { color: Colors.error, fontSize: 16 },
});
