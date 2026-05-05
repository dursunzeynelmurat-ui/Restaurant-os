import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { Badge } from '@components/ui/Badge';
import { formatMinutes } from '@lib/utils/format';
import type { Recipe } from '@app-types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onLongPress?: () => void;
}

const DIFFICULTY_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

export function RecipeCard({ recipe, onLongPress }: RecipeCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
        <View style={styles.imageOverlay} />

        {recipe.is_favorite && (
          <View style={styles.favoriteBadge}>
            <Text style={{ fontSize: 11, color: Colors.error }}>♥</Text>
          </View>
        )}

        {recipe.total_time_minutes != null && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>⏱ {formatMinutes(recipe.total_time_minutes)}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.meta}>
          {recipe.cuisine && <Text style={styles.metaText}>{recipe.cuisine}</Text>}
          {recipe.difficulty && (
            <Badge label={recipe.difficulty} variant={DIFFICULTY_VARIANT[recipe.difficulty] ?? 'default'} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function RecipeListItem({ recipe }: RecipeCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listItem, pressed && styles.listPressed]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
    >
      <View style={styles.listImageContainer}>
        {recipe.cover_image_url ? (
          <Image source={{ uri: recipe.cover_image_url }} style={styles.listImage} resizeMode="cover" />
        ) : (
          <View style={[styles.listImage, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 26 }}>🍽️</Text>
          </View>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.listMeta}>
          {recipe.cuisine && <Text style={styles.metaText}>{recipe.cuisine}</Text>}
          {recipe.total_time_minutes != null && (
            <Text style={styles.metaText}>⏱ {formatMinutes(recipe.total_time_minutes)}</Text>
          )}
          {recipe.difficulty && (
            <Badge label={recipe.difficulty} variant={DIFFICULTY_VARIANT[recipe.difficulty] ?? 'default'} />
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
    ...Shadow.md,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 136, backgroundColor: Colors.surfaceAlt },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 36 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 7,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  timeBadgeText: { ...Typography.caption, color: '#fff', fontWeight: '600' },
  info: { padding: Spacing.sm },
  title: { ...Typography.bodySmallMedium, color: Colors.textPrimary, marginBottom: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
    marginBottom: Spacing.xs + 2,
  },
  listPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  listImageContainer: { flexShrink: 0 },
  listImage: { width: 72, height: 72, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
  listInfo: { flex: 1, gap: 4 },
  listTitle: { ...Typography.bodySmallMedium, color: Colors.textPrimary },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  favIcon: { color: Colors.error, fontSize: 18, paddingRight: Spacing.xs },
});
