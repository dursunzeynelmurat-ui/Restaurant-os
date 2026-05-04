import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useWhatCanICook } from '@hooks/useWhatCanICook';
import { usePantry } from '@hooks/usePantry';
import { useSubscription } from '@hooks/useSubscription';
import { EmptyState } from '@components/ui/EmptyState';

export default function WhatCanICookScreen() {
  const { data: pantryItems } = usePantry();
  const { data: suggestions, isLoading, refetch, isRefetching } = useWhatCanICook();
  const { isPlus } = useSubscription();

  if (!isPlus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <EmptyState
          emoji="🔒"
          title="Plus Feature"
          description="Upgrade to Plus or Pro to get AI-powered recipe suggestions based on your pantry"
          actionLabel="Upgrade Now"
          onAction={() => router.push('/paywall')}
        />
      </SafeAreaView>
    );
  }

  if ((pantryItems?.length ?? 0) === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <EmptyState
          emoji="🥕"
          title="Your pantry is empty"
          description="Add ingredients to your pantry first, then come back here for suggestions"
          actionLabel="Add to Pantry"
          onAction={() => router.replace('/(tabs)/pantry')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>What can I cook?</Text>
        <Pressable onPress={() => refetch()}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Based on {pantryItems?.length ?? 0} pantry items
      </Text>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding recipe ideas...</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <View style={styles.suggestionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <View style={[styles.matchBadge, { backgroundColor: item.match_percentage >= 80 ? Colors.successLight : Colors.warningLight }]}>
                  <Text style={[styles.matchText, { color: item.match_percentage >= 80 ? Colors.success : Colors.warning }]}>
                    {item.match_percentage}% match
                  </Text>
                </View>
              </View>

              <Text style={styles.suggestionDesc}>{item.description}</Text>

              {item.missing_ingredients.length > 0 && (
                <View style={styles.missingSection}>
                  <Text style={styles.missingLabel}>Missing: </Text>
                  <Text style={styles.missingItems}>{item.missing_ingredients.join(', ')}</Text>
                </View>
              )}

              <View style={styles.cardMeta}>
                {item.estimated_time_minutes && (
                  <Text style={styles.metaText}>⏱ {item.estimated_time_minutes} min</Text>
                )}
                <Text style={styles.metaText}>📊 {item.difficulty}</Text>
                {item.cuisine && <Text style={styles.metaText}>🌍 {item.cuisine}</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🤔"
              title="No suggestions yet"
              description="Try adding more ingredients to your pantry"
            />
          }
        />
      )}
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
  title: { ...Typography.h4, color: Colors.textPrimary },
  refreshText: { ...Typography.bodySmall, color: Colors.primary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  suggestionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  suggestionTitle: { ...Typography.h4, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  matchBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, flexShrink: 0 },
  matchText: { ...Typography.captionMedium },
  suggestionDesc: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  missingSection: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.sm },
  missingLabel: { ...Typography.bodySmall, color: Colors.warning, fontWeight: '600' },
  missingItems: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  cardMeta: { flexDirection: 'row', gap: Spacing.md },
  metaText: { ...Typography.caption, color: Colors.textMuted },
});
