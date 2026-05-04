import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useImportStore } from '@stores/importStore';
import { useCreateRecipe } from '@hooks/useRecipes';

export default function ImportReviewScreen() {
  const { extracted, sourceType, sourceUrl, reset } = useImportStore();
  const { mutate: createRecipe, isPending } = useCreateRecipe();

  const [title, setTitle] = useState(extracted?.title ?? '');
  const [description, setDescription] = useState(extracted?.description ?? '');
  const [servings, setServings] = useState(String(extracted?.servings ?? ''));
  const [prepTime, setPrepTime] = useState(String(extracted?.prep_time_minutes ?? ''));
  const [cookTime, setCookTime] = useState(String(extracted?.cook_time_minutes ?? ''));
  const [cuisine, setCuisine] = useState(extracted?.cuisine ?? '');

  if (!extracted) {
    router.replace('/(tabs)/import');
    return null;
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title.');
      return;
    }

    createRecipe(
      {
        recipe: {
          title: title.trim(),
          description: description || null,
          servings: parseInt(servings) || null,
          prep_time_minutes: parseInt(prepTime) || null,
          cook_time_minutes: parseInt(cookTime) || null,
          total_time_minutes: (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0) || null,
          cuisine: cuisine || null,
          difficulty: extracted.difficulty,
          source_type: sourceType === 'screenshot_base64' ? 'screenshot' : (sourceType as 'url' | 'text' | 'manual') ?? 'text',
          source_url: sourceUrl ?? null,
          language: extracted.language ?? 'en',
          tags: extracted.tags ?? [],
          dietary_info: extracted.dietary_info ?? [],
        },
        ingredients: extracted.ingredients.map((ing, i) => ({
          name: ing.name,
          normalized_name: ing.name.toLowerCase(),
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          order_index: i,
        })),
        steps: extracted.steps.map((step, i) => ({
          instruction: step.instruction,
          duration_minutes: step.duration_minutes,
          notes: null,
          order_index: i,
        })),
      },
      {
        onSuccess: (recipe) => {
          reset();
          router.replace(`/recipe/${recipe.id}`);
        },
      }
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Edit</Text>
        </Pressable>
        <Text style={styles.topTitle}>Review Recipe</Text>
        <Pressable
          style={[styles.saveButton, isPending && styles.disabledButton]}
          onPress={handleSave}
          disabled={isPending}
        >
          <Text style={styles.saveButtonText}>{isPending ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {extracted.missing_info_warnings?.length > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Review these fields:</Text>
            {extracted.missing_info_warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>• {w}</Text>
            ))}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Recipe title" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Short description" multiline numberOfLines={3} />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Servings</Text>
            <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" placeholder="4" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Cuisine</Text>
            <TextInput style={styles.input} value={cuisine} onChangeText={setCuisine} placeholder="Italian" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Prep (min)</Text>
            <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="15" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Cook (min)</Text>
            <TextInput style={styles.input} value={cookTime} onChangeText={setCookTime} keyboardType="numeric" placeholder="30" />
          </View>
        </View>

        <Text style={styles.sectionHeader}>Ingredients ({extracted.ingredients.length})</Text>
        {extracted.ingredients.map((ing, i) => (
          <View key={i} style={styles.previewRow}>
            <Text style={styles.previewQty}>{ing.quantity != null ? `${ing.quantity} ${ing.unit ?? ''}`.trim() : ''}</Text>
            <Text style={styles.previewName}>{ing.name}{ing.notes ? `, ${ing.notes}` : ''}</Text>
          </View>
        ))}

        <Text style={styles.sectionHeader}>Steps ({extracted.steps.length})</Text>
        {extracted.steps.map((step, i) => (
          <View key={i} style={styles.stepPreview}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <Text style={styles.stepText}>{step.instruction}</Text>
          </View>
        ))}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { ...Typography.body, color: Colors.textSecondary },
  topTitle: { ...Typography.h4, color: Colors.textPrimary },
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  disabledButton: { opacity: 0.5 },
  saveButtonText: { ...Typography.bodySmallMedium, color: '#fff' },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  warningBox: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  warningTitle: { ...Typography.bodySmallMedium, color: Colors.warning, marginBottom: Spacing.xs },
  warningText: { ...Typography.bodySmall, color: Colors.textSecondary },
  field: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  label: { ...Typography.bodySmallMedium, color: Colors.textPrimary, marginBottom: 4 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  sectionHeader: { ...Typography.h4, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  previewRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  previewQty: { ...Typography.bodySmallMedium, color: Colors.textSecondary, minWidth: 60 },
  previewName: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
  stepPreview: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
  stepText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1, lineHeight: 22 },
});
