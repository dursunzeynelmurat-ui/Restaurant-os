import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { useCreateRecipe } from '@hooks/useRecipes';

interface IngredientField { name: string; quantity: string; unit: string; notes: string; }
interface StepField { instruction: string; }

export default function ManualRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  const [ingredients, setIngredients] = useState<IngredientField[]>([{ name: '', quantity: '', unit: '', notes: '' }]);
  const [steps, setSteps] = useState<StepField[]>([{ instruction: '' }]);

  const { mutate: createRecipe, isPending } = useCreateRecipe();

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '', notes: '' }]);
  }

  function updateIngredient(index: number, field: keyof IngredientField, value: string) {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps((prev) => [...prev, { instruction: '' }]);
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((step, i) => i === index ? { instruction: value } : step));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title.');
      return;
    }
    const validIngredients = ingredients.filter((i) => i.name.trim());
    const validSteps = steps.filter((s) => s.instruction.trim());

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
          difficulty: difficulty || null,
          source_type: 'manual',
          source_url: null,
          language: 'en',
          tags: [],
          dietary_info: [],
        },
        ingredients: validIngredients.map((ing, i) => ({
          name: ing.name.trim(),
          normalized_name: ing.name.trim().toLowerCase(),
          quantity: parseFloat(ing.quantity) || null,
          unit: ing.unit || null,
          notes: ing.notes || null,
          order_index: i,
        })),
        steps: validSteps.map((step, i) => ({
          instruction: step.instruction.trim(),
          duration_minutes: null,
          notes: null,
          order_index: i,
        })),
      },
      {
        onSuccess: (recipe) => {
          router.replace(`/recipe/${recipe.id}`);
        },
      }
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>New Recipe</Text>
        <Pressable
          style={[styles.saveButton, isPending && styles.disabledButton]}
          onPress={handleSave}
          disabled={isPending}
        >
          <Text style={styles.saveButtonText}>{isPending ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Basic Info */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Recipe name" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Brief description" multiline numberOfLines={3} />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Cuisine</Text>
            <TextInput style={styles.input} value={cuisine} onChangeText={setCuisine} placeholder="Italian" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Servings</Text>
            <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" placeholder="4" />
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

        {/* Difficulty */}
        <View style={styles.field}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <Pressable
                key={d}
                style={[styles.difficultyChip, difficulty === d && styles.difficultyChipActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.difficultyChipText, difficulty === d && styles.difficultyChipTextActive]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <Text style={styles.sectionHeader}>Ingredients</Text>
        {ingredients.map((ing, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput style={[styles.input, { width: 60 }]} value={ing.quantity} onChangeText={(v) => updateIngredient(index, 'quantity', v)} placeholder="Qty" keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { width: 60 }]} value={ing.unit} onChangeText={(v) => updateIngredient(index, 'unit', v)} placeholder="Unit" />
            <TextInput style={[styles.input, { flex: 1 }]} value={ing.name} onChangeText={(v) => updateIngredient(index, 'name', v)} placeholder="Ingredient" />
            {ingredients.length > 1 && (
              <Pressable onPress={() => removeIngredient(index)}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}
        <Pressable style={styles.addRowButton} onPress={addIngredient}>
          <Text style={styles.addRowText}>+ Add Ingredient</Text>
        </Pressable>

        {/* Steps */}
        <Text style={styles.sectionHeader}>Steps</Text>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{index + 1}</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1, textAlignVertical: 'top' }]}
              value={step.instruction}
              onChangeText={(v) => updateStep(index, v)}
              placeholder={`Step ${index + 1}...`}
              multiline
              numberOfLines={3}
            />
            {steps.length > 1 && (
              <Pressable onPress={() => removeStep(index)}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}
        <Pressable style={styles.addRowButton} onPress={addStep}>
          <Text style={styles.addRowText}>+ Add Step</Text>
        </Pressable>
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
  field: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  label: { ...Typography.bodySmallMedium, color: Colors.textPrimary, marginBottom: 4 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 4,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  difficultyRow: { flexDirection: 'row', gap: Spacing.sm },
  difficultyChip: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  difficultyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  difficultyChipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  difficultyChipTextActive: { color: '#fff', fontWeight: '600' },
  sectionHeader: { ...Typography.h4, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: Spacing.xs,
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  removeText: { ...Typography.bodySmall, color: Colors.textMuted, padding: Spacing.xs },
  addRowButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  addRowText: { ...Typography.bodySmall, color: Colors.primary },
});
