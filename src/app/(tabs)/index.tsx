import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useRecipes } from '@hooks/useRecipes';
import { useAuth } from '@hooks/useAuth';
import { useSubscription } from '@hooks/useSubscription';
import { RecipeCard } from '@components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '@components/ui/Skeleton';

const IMPORT_ACTIONS = [
  { emoji: '🔗', label: 'URL', action: () => router.push('/(tabs)/import') },
  { emoji: '📷', label: 'Screenshot', action: () => router.push('/(tabs)/import') },
  { emoji: '📝', label: 'Text', action: () => router.push('/(tabs)/import') },
  { emoji: '✍️', label: 'Manual', action: () => router.push('/import/manual') },
] as const;

export default function HomeScreen() {
  const { user } = useAuth();
  const { canUseAI } = useSubscription();
  const { data: recentRecipes, isLoading: isLoadingRecent } = useRecipes({ limit: 10, orderBy: 'created_at' });
  const { data: favoriteRecipes } = useRecipes({ isFavorite: true, limit: 10 });

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>What are you cooking today?</Text>
          </View>
        </View>

        {/* Search Bar */}
        <Pressable
          style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarPressed]}
          onPress={() => router.push('/(tabs)/recipes')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search your recipes...</Text>
        </Pressable>

        {/* Quick Import */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Import</Text>
          <View style={styles.importGrid}>
            {IMPORT_ACTIONS.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.importCard, pressed && styles.importCardPressed]}
                onPress={item.action}
              >
                <Text style={styles.importEmoji}>{item.emoji}</Text>
                <Text style={styles.importLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {!canUseAI && (
            <Pressable style={styles.upgradeBar} onPress={() => router.push('/paywall')}>
              <Text style={styles.upgradeText}>
                🔒 AI limit reached — Upgrade to import more
              </Text>
            </Pressable>
          )}
        </View>

        {/* What Can I Cook */}
        <Pressable
          style={({ pressed }) => [styles.whatCard, pressed && styles.whatCardPressed]}
          onPress={() => router.push('/what-can-i-cook/')}
        >
          <View style={styles.whatIconWrap}>
            <Text style={styles.whatEmoji}>🧑‍🍳</Text>
          </View>
          <View style={styles.whatInfo}>
            <Text style={styles.whatTitle}>What can I cook?</Text>
            <Text style={styles.whatSubtitle}>Suggestions based on your pantry</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Recently Saved */}
        {(recentRecipes?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Saved</Text>
              <Pressable onPress={() => router.push('/(tabs)/recipes')}>
                <Text style={styles.seeAll}>See all →</Text>
              </Pressable>
            </View>
            {isLoadingRecent ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.recipeRow}>
                  {[1, 2].map((i) => (
                    <View key={i} style={styles.cardWrapper}>
                      <RecipeCardSkeleton />
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.recipeRow}>
                  {(recentRecipes ?? []).map((recipe) => (
                    <View key={recipe.id} style={styles.cardWrapper}>
                      <RecipeCard recipe={recipe} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* Favorites */}
        {(favoriteRecipes?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites ♥</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recipeRow}>
                {(favoriteRecipes ?? []).map((recipe) => (
                  <View key={recipe.id} style={styles.cardWrapper}>
                    <RecipeCard recipe={recipe} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Empty state */}
        {!isLoadingRecent && (recentRecipes?.length ?? 0) === 0 && (
          <View style={styles.emptyHero}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>Your recipe collection is empty</Text>
            <Text style={styles.emptySubtitle}>Import your first recipe to get started</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
              onPress={() => router.push('/(tabs)/import')}
            >
              <Text style={styles.emptyButtonText}>Import a Recipe</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xl },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  greeting: { ...Typography.h2, color: Colors.textPrimary },
  subGreeting: { ...Typography.body, color: Colors.textSecondary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchBarPressed: { backgroundColor: Colors.surfaceAlt },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { ...Typography.body, color: Colors.textMuted },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  seeAll: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600', marginBottom: Spacing.sm },
  importGrid: { flexDirection: 'row', gap: Spacing.sm },
  importCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  importCardPressed: { backgroundColor: Colors.surfaceAlt, transform: [{ scale: 0.96 }] },
  importEmoji: { fontSize: 24 },
  importLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontWeight: '500' },
  upgradeBar: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  upgradeText: { ...Typography.bodySmall, color: Colors.primaryDark, textAlign: 'center', fontWeight: '500' },
  whatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  whatCardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  whatIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatEmoji: { fontSize: 26 },
  whatInfo: { flex: 1 },
  whatTitle: { ...Typography.h4, color: '#fff' },
  whatSubtitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.75)' },
  chevron: { fontSize: 24, color: 'rgba(255,255,255,0.7)', fontWeight: '300' },
  horizontalScroll: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  recipeRow: { flexDirection: 'row', gap: Spacing.sm },
  cardWrapper: { width: 164 },
  emptyHero: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.xs },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  emptyButtonText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '700' },
});
