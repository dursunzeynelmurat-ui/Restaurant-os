import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';
import { useSubscription } from '@hooks/useSubscription';
import { signOut } from '@lib/api/auth';
import { useAuthStore } from '@stores/authStore';
import { SUBSCRIPTION_TIERS } from '@app-types/subscription';
import { supabase } from '@lib/supabase';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const { status, remaining, limit } = useSubscription();
  const signOutStore = useAuthStore((s) => s.signOut);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

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

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully.');
    }
  }

  function handleLanguage() {
    const options = LANGUAGES.map((l) => ({
      text: l.label + (currentLanguage === l.code ? ' ✓' : ''),
      onPress: async () => {
        if (!user) return;
        await supabase.from('users').update({ preferred_language: l.code }).eq('id', user.id);
        setCurrentLanguage(l.code);
      },
    }));
    Alert.alert('Select Language', undefined, [
      ...options,
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your recipes. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await supabase.rpc('delete_user' as never);
                    if (error) {
                      Alert.alert('Error', 'Could not delete account. Please contact support.');
                    }
                    // onAuthStateChange will fire and redirect to welcome
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  const langLabel = LANGUAGES.find((l) => l.code === currentLanguage)?.label ?? 'English';

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
            <View style={[styles.progressFill, { width: `${Math.min((remaining / limit) * 100, 100)}%` }]} />
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
          <Pressable style={styles.settingRow} onPress={handleLanguage}>
            <Text style={styles.settingLabel}>Language</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{langLabel}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={styles.settingRow} onPress={() => setShowPasswordModal(true)}>
            <Text style={styles.settingLabel}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={handleDeleteAccount}>
            <Text style={[styles.settingLabel, { color: Colors.error }]}>Delete Account</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Recipe Organizer v1.0.0</Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowPasswordModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Pressable onPress={handleChangePassword} disabled={isUpdatingPassword}>
              <Text style={[styles.modalSave, isUpdatingPassword && { opacity: 0.5 }]}>
                {isUpdatingPassword ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoFocus
            />
            <Text style={styles.modalLabel}>Confirm Password</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              secureTextEntry
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  modalCancel: { ...Typography.body, color: Colors.textSecondary },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary },
  modalSave: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  modalBody: { padding: Spacing.lg, gap: Spacing.sm },
  modalLabel: { ...Typography.bodySmallMedium, color: Colors.textPrimary, marginBottom: 4, marginTop: Spacing.sm },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
  },
});
