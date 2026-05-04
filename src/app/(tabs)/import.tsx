import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useAIExtraction } from '@hooks/useAIExtraction';
import { useSubscription } from '@hooks/useSubscription';

type ImportMode = 'url' | 'text' | 'screenshot' | null;

export default function ImportScreen() {
  const [mode, setMode] = useState<ImportMode>(null);
  const [inputValue, setInputValue] = useState('');
  const { mutate: extract, isPending } = useAIExtraction();
  const { canUseAI, remaining, status } = useSubscription();

  async function handlePasteFromClipboard() {
    const text = await Clipboard.getStringAsync();
    if (text) setInputValue(text);
  }

  async function handlePickScreenshot() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      if (!canUseAI) {
        Alert.alert('Import Limit Reached', 'Upgrade to Plus to import more recipes.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall') },
        ]);
        return;
      }
      extract({ content: result.assets[0].base64, type: 'screenshot_base64' });
    }
  }

  function handleSubmit() {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'Please enter a URL or paste recipe text.');
      return;
    }
    if (!canUseAI) {
      Alert.alert('Import Limit Reached', 'Upgrade to Plus to import more recipes.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    const type = mode === 'url' ? 'url' : 'text';
    extract({ content: inputValue.trim(), type, sourceUrl: mode === 'url' ? inputValue.trim() : undefined });
  }

  if (isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Extracting Recipe...</Text>
          <Text style={styles.loadingSubtitle}>AI is parsing ingredients and steps</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Import Recipe</Text>
        <Text style={styles.subtitle}>Paste a link, text, or upload a screenshot. We'll turn it into a clean recipe.</Text>

        {status !== 'free' && (
          <View style={styles.usageBar}>
            <Text style={styles.usageText}>AI imports remaining: {remaining}</Text>
          </View>
        )}
        {status === 'free' && (
          <View style={styles.usageBar}>
            <Text style={styles.usageText}>Free: {remaining} AI imports left this week</Text>
          </View>
        )}

        {/* Import Options */}
        <View style={styles.optionsGrid}>
          {[
            { key: 'url' as ImportMode, emoji: '🔗', title: 'Paste URL', desc: 'From any website' },
            { key: 'text' as ImportMode, emoji: '📝', title: 'Paste Text', desc: 'Recipe text or caption' },
          ].map((option) => (
            <Pressable
              key={option.key}
              style={[styles.optionCard, mode === option.key && styles.optionCardActive]}
              onPress={() => { setMode(option.key); setInputValue(''); }}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDesc}>{option.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Screenshot / Manual options */}
        <View style={styles.otherOptions}>
          <Pressable style={styles.otherCard} onPress={handlePickScreenshot}>
            <Text style={styles.otherEmoji}>📷</Text>
            <View style={styles.otherInfo}>
              <Text style={styles.otherTitle}>Upload Screenshot</Text>
              <Text style={styles.otherDesc}>Photo or screenshot of a recipe</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.otherCard} onPress={() => router.push('/import/manual')}>
            <Text style={styles.otherEmoji}>✍️</Text>
            <View style={styles.otherInfo}>
              <Text style={styles.otherTitle}>Enter Manually</Text>
              <Text style={styles.otherDesc}>Type a recipe yourself</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Text input area */}
        {(mode === 'url' || mode === 'text') && (
          <View style={styles.inputSection}>
            <TextInput
              style={[styles.textInput, mode === 'text' && styles.textArea]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={mode === 'url' ? 'https://...' : 'Paste recipe text, caption, or description here...'}
              placeholderTextColor={Colors.textMuted}
              multiline={mode === 'text'}
              numberOfLines={mode === 'text' ? 8 : 1}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={mode === 'url' ? 'url' : 'default'}
            />
            <View style={styles.inputActions}>
              <Pressable style={styles.pasteButton} onPress={handlePasteFromClipboard}>
                <Text style={styles.pasteButtonText}>Paste from clipboard</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, !inputValue.trim() && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!inputValue.trim()}
              >
                <Text style={styles.submitButtonText}>Extract Recipe</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  usageBar: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  usageText: { ...Typography.bodySmall, color: Colors.primaryDark, textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  optionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  optionTitle: { ...Typography.bodySmallMedium, color: Colors.textPrimary },
  optionDesc: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  otherOptions: { gap: Spacing.sm, marginBottom: Spacing.lg },
  otherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  otherEmoji: { fontSize: 24 },
  otherInfo: { flex: 1 },
  otherTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  otherDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textMuted },
  inputSection: { gap: Spacing.sm },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
  textArea: { height: 160, textAlignVertical: 'top' },
  inputActions: { gap: Spacing.sm },
  pasteButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  pasteButtonText: { ...Typography.bodySmall, color: Colors.primary },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  loadingTitle: { ...Typography.h3, color: Colors.textPrimary },
  loadingSubtitle: { ...Typography.body, color: Colors.textSecondary },
});
