import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';

const FEATURES = [
  { icon: '🤖', text: 'AI extracts recipes from URLs, screenshots & text' },
  { icon: '📂', text: 'Organize into collections, search by ingredient' },
  { icon: '🍳', text: 'Step-by-step cooking mode with built-in timers' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Text style={styles.logoEmoji}>🍳</Text>
          </View>
        </View>

        <Text style={styles.appName}>RecipeOS</Text>
        <Text style={styles.title}>Your recipes,{'\n'}beautifully organised</Text>
        <Text style={styles.subtitle}>
          Save anything from anywhere. AI turns messy posts and screenshots into clean, structured recipes.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryButtonText}>Get Started — It's Free</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>No credit card required · Cancel anytime</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  logoEmoji: { fontSize: 44 },
  appName: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  features: {
    gap: Spacing.xs + 2,
    width: '100%',
    maxWidth: 340,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureIcon: { fontSize: 18 },
  featureText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  actions: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadow.md,
  },
  primaryButtonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  primaryButtonText: {
    ...Typography.bodyMedium,
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryButtonPressed: { backgroundColor: Colors.surfaceAlt },
  secondaryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingBottom: Spacing.md,
  },
});
