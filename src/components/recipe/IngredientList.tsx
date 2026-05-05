import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { useState } from 'react';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { formatQuantity } from '@lib/utils/format';
import { scaleQuantity } from '@lib/utils/scale';
import { useIngredientSubstitution } from '@hooks/useIngredientSubstitution';
import type { RecipeIngredient } from '@app-types/recipe';
import type { IngredientSubstitute } from '@lib/api/ai';

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  scaleFactor?: number;
  checkable?: boolean;
  recipeTitle?: string;
}

export function IngredientList({ ingredients, scaleFactor = 1, checkable = false, recipeTitle }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [substituting, setSubstituting] = useState<RecipeIngredient | null>(null);
  const [substitutes, setSubstitutes] = useState<IngredientSubstitute[]>([]);
  const { mutate: fetchSubstitutes, isPending } = useIngredientSubstitution();

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openSubstitution(ingredient: RecipeIngredient) {
    setSubstituting(ingredient);
    setSubstitutes([]);
    fetchSubstitutes(
      { ingredient, recipeTitle },
      { onSuccess: (results) => setSubstitutes(results) },
    );
  }

  return (
    <View style={styles.container}>
      {ingredients.map((ingredient) => {
        const scaledQty = scaleQuantity(ingredient.quantity, scaleFactor);
        const isChecked = checked.has(ingredient.id);

        return (
          <View key={ingredient.id} style={styles.rowWrapper}>
            <Pressable
              style={[styles.row, isChecked && styles.checkedRow]}
              onPress={checkable ? () => toggle(ingredient.id) : undefined}
              disabled={!checkable}
            >
              {checkable && (
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              )}
              <Text style={[styles.quantity, isChecked && styles.checkedText]}>
                {scaledQty != null ? formatQuantity(scaledQty) : ''}{' '}
                {ingredient.unit ?? ''}
              </Text>
              <Text style={[styles.name, isChecked && styles.checkedText]} numberOfLines={2}>
                {ingredient.name}
                {ingredient.notes ? (
                  <Text style={styles.notes}>, {ingredient.notes}</Text>
                ) : null}
              </Text>
            </Pressable>
            <Pressable style={styles.subBtn} onPress={() => openSubstitution(ingredient)}>
              <Text style={styles.subBtnText}>?</Text>
            </Pressable>
          </View>
        );
      })}

      <Modal
        visible={substituting !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSubstituting(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Substitutes for{' '}
                <Text style={styles.modalIngredientName}>{substituting?.name}</Text>
              </Text>
              <Pressable onPress={() => setSubstituting(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {isPending ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Finding substitutes…</Text>
              </View>
            ) : substitutes.length === 0 ? (
              <Text style={styles.noSubText}>No substitutes found for this ingredient.</Text>
            ) : (
              <ScrollView style={styles.substitutesList}>
                {substitutes.map((sub, i) => (
                  <View key={i} style={styles.substituteCard}>
                    <Text style={styles.substituteName}>{sub.quantity} {sub.ingredient}</Text>
                    {sub.notes ? <Text style={styles.substituteNotes}>{sub.notes}</Text> : null}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  rowWrapper: { flexDirection: 'row', alignItems: 'center' },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  checkedRow: { opacity: 0.5 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  quantity: { ...Typography.bodySmallMedium, color: Colors.textPrimary, minWidth: 50 },
  name: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  notes: { ...Typography.bodySmall, color: Colors.textSecondary },
  checkedText: { textDecorationLine: 'line-through', color: Colors.textMuted },
  subBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
    flexShrink: 0,
  },
  subBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '60%',
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, flex: 1 },
  modalIngredientName: { color: Colors.primary },
  modalClose: { fontSize: 18, color: Colors.textSecondary, paddingLeft: Spacing.sm },
  modalLoading: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  noSubText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
  substitutesList: { flex: 1 },
  substituteCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  substituteName: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: 4 },
  substituteNotes: { ...Typography.bodySmall, color: Colors.textSecondary },
});
