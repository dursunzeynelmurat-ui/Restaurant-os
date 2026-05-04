import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing } from '@constants/theme';

// Edit screen reuses the same form pattern as manual.tsx but pre-fills with existing data.
// Full implementation mirrors ManualRecipeScreen with useRecipeDetail pre-fill + useUpdateRecipe mutation.
export default function RecipeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Edit Recipe</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Edit form — mirrors ManualRecipeScreen with pre-filled data from recipe ID: {id}
        </Text>
        <Text style={styles.noteText}>
          Wire up useRecipeDetail(id) to pre-fill and useUpdateRecipe(id) to save.
        </Text>
      </View>
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
  title: { ...Typography.h4, color: Colors.textPrimary },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  placeholderText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  noteText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
});
