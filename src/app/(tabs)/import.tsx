import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useAIExtraction } from '@hooks/useAIExtraction';
import { useSubscription } from '@hooks/useSubscription';
import { ImportOptionCard, ImportRowCard } from '@components/import/ImportOptionCard';
import { AIExtractionLoader } from '@components/import/AIExtractionLoader';

type ImportMode = 'url' | 'text' | null;

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
    extract({ content: inputValue.trim(), type: mode === 'url' ? 'url' : 'text', sourceUrl: mode === 'url' ? inputValue.trim() : undefined });
  }

  if (isPending) return <AIExtractionLoader />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Import Recipe</Text>
        <Text style={styles.subtitle}>
          Paste a link, text, or upload a screenshot. We'll turn it into a clean recipe.
        </Text>

        <View style={styles.usageBar}>
          <Text style={styles.usageText}>
            {status === 'free'
              ? `Free: ${remaining} AI imports left this week`
              : `AI imports remaining: ${remaining}`}
          </Text>
        </View>

        {/* Primary options: URL / Text */}
        <View style={styles.optionsGrid}>
          <ImportOptionCard
            emoji="🔗"
            title="Paste URL"
            desc="From any website"
            isActive={mode === 'url'}
            onPress={() => { setMode('url'); setInputValue(''); }}
          />
          <ImportOptionCard
            emoji="📝"
            title="Paste Text"
            desc="Recipe text or caption"
            isActive={mode === 'text'}
            onPress={() => { setMode('text'); setInputValue(''); }}
          />
        </View>

        {/* Secondary options: Screenshot / Manual */}
        <View style={styles.rowOptions}>
          <ImportRowCard
            emoji="📷"
            title="Upload Screenshot"
            desc="Photo or screenshot of a recipe"
            onPress={handlePickScreenshot}
          />
          <ImportRowCard
            emoji="✍️"
            title="Enter Manually"
            desc="Type a recipe yourself"
            onPress={() => router.push('/import/manual')}
          />
        </View>

        {/* Text input area */}
        {mode !== null && (
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
                <Text style={styles.submitButtonText}>Extract Recipe →</Text>
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
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  usageText: { ...Typography.bodySmall, color: Colors.primaryDark, textAlign: 'center', fontWeight: '500' },
  optionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  rowOptions: { gap: Spacing.sm, marginBottom: Spacing.lg },
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
  pasteButton: { paddingVertical: Spacing.sm, alignItems: 'center' },
  pasteButtonText: { ...Typography.bodySmall, color: Colors.primary },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '700' },
});
