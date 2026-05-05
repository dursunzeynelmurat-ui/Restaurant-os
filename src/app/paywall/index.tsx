import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { SUBSCRIPTION_TIERS } from '@app-types/subscription';
import { useSubscription } from '@hooks/useSubscription';

export default function PaywallScreen() {
  const { status } = useSubscription();

  function handleUpgrade(tierId: string) {
    // RevenueCat integration: Purchases.purchasePackage(...)
    // For now, show a placeholder
    alert(`RevenueCat purchase flow for ${tierId} — configure in lib/revenuecat.ts`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>✕ Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Unlock Your Full Recipe Collection</Text>
        <Text style={styles.subheadline}>
          Import recipes from anywhere, organize automatically, and cook with less effort.
        </Text>

        {SUBSCRIPTION_TIERS.filter((t) => t.id !== 'free').map((tier) => {
          const isCurrent = status === tier.id;
          const isHighlighted = tier.id === 'plus';

          return (
            <View
              key={tier.id}
              style={[styles.tierCard, isHighlighted && styles.tierCardHighlighted]}
            >
              {isHighlighted && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierPrice}>{tier.price}</Text>
              <View style={styles.features}>
                {tier.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                style={[
                  styles.upgradeButton,
                  isCurrent && styles.currentButton,
                  isHighlighted && styles.upgradeButtonHighlighted,
                ]}
                onPress={() => !isCurrent && handleUpgrade(tier.id)}
                disabled={isCurrent}
              >
                <Text style={[styles.upgradeButtonText, isHighlighted && { color: '#fff' }]}>
                  {isCurrent ? 'Current Plan' : `Get ${tier.name}`}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Pressable style={styles.restoreButton} onPress={() => alert('Restore purchases')}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Subscriptions auto-renew until cancelled. Manage in your App Store settings. No AI image generation — just practical cooking tools.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'flex-end' },
  backText: { ...Typography.body, color: Colors.textSecondary },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  headline: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subheadline: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  tierCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  tierCardHighlighted: { borderColor: Colors.primary, backgroundColor: '#FFFAF8' },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  popularText: { ...Typography.captionMedium, color: '#fff' },
  tierName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  tierPrice: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.md },
  features: { gap: Spacing.xs, marginBottom: Spacing.lg },
  featureRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  featureCheck: { color: Colors.success, fontWeight: '700', fontSize: 14, marginTop: 2 },
  featureText: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  upgradeButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  upgradeButtonHighlighted: { backgroundColor: Colors.primary },
  currentButton: { borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  upgradeButtonText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  restoreButton: { alignItems: 'center', paddingVertical: Spacing.md },
  restoreText: { ...Typography.bodySmall, color: Colors.textSecondary },
  disclaimer: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
