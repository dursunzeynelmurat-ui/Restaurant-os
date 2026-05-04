import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useMealPlan, useCurrentWeekStart, useRemoveMealPlanItem } from '@hooks/useMealPlan';
import { EmptyState } from '@components/ui/EmptyState';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_LABELS = { breakfast: '☀️ Breakfast', lunch: '🌤️ Lunch', dinner: '🌙 Dinner' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerScreen() {
  const defaultWeekStart = useCurrentWeekStart();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = format(
    addWeeks(new Date(defaultWeekStart), weekOffset),
    'yyyy-MM-dd'
  );
  const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd');

  const { data: mealPlan, isLoading } = useMealPlan(weekStart);
  const { mutate: removeItem } = useRemoveMealPlanItem(weekStart);

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(weekStart), i), 'yyyy-MM-dd')
  );

  function getItemsForSlot(date: string, mealType: string) {
    return (mealPlan?.items ?? []).filter(
      (item) => item.date === date && item.meal_type === mealType
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <Pressable style={styles.navButton} onPress={() => setWeekOffset((o) => o - 1)}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.weekLabel}>
          {format(new Date(weekStart), 'MMM d')} – {format(new Date(weekEnd), 'MMM d, yyyy')}
        </Text>
        <Pressable style={styles.navButton} onPress={() => setWeekOffset((o) => o + 1)}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarScroll}
      >
        {weekDates.map((date, index) => (
          <View key={date} style={styles.dayColumn}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{DAYS[index]}</Text>
              <Text style={styles.dayNumber}>{format(new Date(date), 'd')}</Text>
            </View>

            {MEAL_TYPES.map((mealType) => {
              const items = getItemsForSlot(date, mealType);
              return (
                <View key={mealType} style={styles.mealSlot}>
                  <Text style={styles.mealLabel}>{MEAL_LABELS[mealType]}</Text>
                  {items.length === 0 ? (
                    <Text style={styles.emptySlot}>+ Add</Text>
                  ) : (
                    items.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.mealCard}
                        onLongPress={() => removeItem(item.id)}
                      >
                        <Text style={styles.mealCardText} numberOfLines={2}>
                          {(item as { recipes?: { title?: string } }).recipes?.title ?? 'Recipe'}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Text style={styles.hint}>Long press a meal to remove it</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: { fontSize: 20, color: Colors.textPrimary },
  weekLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  calendarScroll: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xl },
  dayColumn: {
    width: 140,
    marginHorizontal: Spacing.xs,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  dayName: { ...Typography.captionMedium, color: 'rgba(255,255,255,0.8)' },
  dayNumber: { ...Typography.h4, color: '#fff' },
  mealSlot: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs + 2,
    marginBottom: Spacing.xs,
    minHeight: 64,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  mealLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  emptySlot: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
  mealCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xs,
    padding: Spacing.xs,
    marginTop: 4,
  },
  mealCardText: { ...Typography.caption, color: Colors.primaryDark },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingBottom: Spacing.md,
  },
});
