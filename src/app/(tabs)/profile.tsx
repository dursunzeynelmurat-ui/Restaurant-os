import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';
import { useSubscription } from '@hooks/useSubscription';
import { signOut } from '@lib/api/auth';
import { useAuthStore } from '@stores/authStore';
import { SUBSCRIPTION_TIERS } from '@types/subscription';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { status, remaining, limit } = useSubscription();
  const signOutStore = useAuthStore((s) => s.signOut);

  const currentTier = SUBSCRIPTION_TIERS.find((t) => t.id === status);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          signOutStore();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.user_metadata?.full_name ?? user?.email ?? '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.user_metadata?.full_name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Subscription */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Subscription</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{currentTier?.name ?? 'Free'}</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            {remaining} / {limit} AI imports remaining this month
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(remaining / limit) * 100}%` }]} />
          </View>
          {status === 'free' && (
            <Pressable style={styles.upgradeButton} onPress={() => router.push('/paywall')}>
              <Text style={styles.upgradeButtonText}>Upgrade to Plus</Text>
            </Pressable>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {[
            { label: 'Language', value: 'English', onPress: () => {} },
            { label: 'Notifications', value: 'On', onPress: () => {} },
          ].map((item) => (
            <Pressable key={item.label} style={styles.settingRow} onPress={item.onPress}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{item.value}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={styles.settingRow} onPress={() => {}}>
            <Text style={styles.settingLabel}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => {}}>
            <Text style={[styles.settingLabel, { color: Colors.error }]}>Delete Account</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Recipe Organizer v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  userSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { ...Typography.h2, color: '#fff' },
  name: { ...Typography.h3, color: Colors.textPrimary },
  email: { ...Typography.body, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  cardTitle: { ...Typography.h4, color: Colors.textPrimary },
  planBadge: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  planBadgeText: { ...Typography.captionMedium, color: Colors.primaryDark },
  cardSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  progressBar: { height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.md },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  upgradeButtonText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '600' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.bodySmallMedium, color: Colors.textMuted, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    ...Shadow.sm,
  },
  settingLabel: { ...Typography.body, color: Colors.textPrimary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingValue: { ...Typography.body, color: Colors.textSecondary },
  chevron: { fontSize: 18, color: Colors.textMuted },
  signOutButton: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  signOutText: { ...Typography.bodyMedium, color: Colors.error, fontWeight: '600' },
  version: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
});
