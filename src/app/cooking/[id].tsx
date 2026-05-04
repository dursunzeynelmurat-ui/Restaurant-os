import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as KeepAwake from 'expo-keep-awake';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { useRecipeDetail } from '@hooks/useRecipes';
import { useCookingStore } from '@stores/cookingStore';
import { formatMinutes } from '@lib/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe } = useRecipeDetail(id);
  const { currentStepIndex, scaledServings, nextStep, prevStep, endCooking } = useCookingStore();
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  KeepAwake.useKeepAwake();

  const steps = recipe?.steps ?? [];
  const currentStep = steps[currentStepIndex];
  const isLast = currentStepIndex >= steps.length - 1;
  const isFirst = currentStepIndex === 0;

  useEffect(() => {
    if (currentStep?.duration_minutes) {
      setTimerRemaining(currentStep.duration_minutes * 60);
      setTimerRunning(false);
    } else {
      setTimerRemaining(null);
    }
    clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [currentStepIndex, currentStep?.duration_minutes]);

  useEffect(() => {
    if (timerRunning && timerRemaining !== null) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((t) => {
          if (t === null || t <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerRemaining]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleFinish() {
    endCooking();
    router.replace(`/recipe/${id}`);
  }

  if (!recipe || steps.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ ...Typography.body, color: '#fff', padding: Spacing.lg }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleFinish}>
          <Text style={styles.exitText}>✕ Exit</Text>
        </Pressable>
        <Text style={styles.recipeName} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.servingsText}>{scaledServings} servings</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${((currentStepIndex + 1) / steps.length) * 100}%` }]} />
      </View>
      <Text style={styles.stepCounter}>Step {currentStepIndex + 1} of {steps.length}</Text>

      {/* Step Content */}
      <View style={styles.stepContainer}>
        <Text style={styles.stepInstruction}>{currentStep?.instruction}</Text>

        {timerRemaining !== null && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timerRemaining)}</Text>
            <Pressable
              style={[styles.timerButton, timerRunning && styles.timerButtonActive]}
              onPress={() => setTimerRunning((r) => !r)}
            >
              <Text style={styles.timerButtonText}>{timerRunning ? '⏸ Pause' : '▶ Start Timer'}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.navContainer}>
        <Pressable
          style={[styles.navButton, isFirst && styles.navButtonDisabled]}
          onPress={() => prevStep(steps.length)}
          disabled={isFirst}
        >
          <Text style={styles.navButtonText}>← Prev</Text>
        </Pressable>

        {isLast ? (
          <Pressable style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>🎉 Done!</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.nextButton} onPress={() => nextStep()}>
            <Text style={styles.nextButtonText}>Next →</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  exitText: { ...Typography.body, color: 'rgba(255,255,255,0.6)' },
  recipeName: { ...Typography.bodySmallMedium, color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  servingsText: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.6)' },
  progressContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: Spacing.lg, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  stepCounter: { ...Typography.caption, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.lg },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  stepInstruction: {
    ...Typography.cookingStep,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
  },
  timerContainer: { alignItems: 'center', gap: Spacing.md },
  timerText: { fontSize: 48, fontWeight: '700', color: Colors.primary, fontVariant: ['tabular-nums'] },
  timerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  timerButtonActive: { backgroundColor: Colors.primaryDark },
  timerButtonText: { ...Typography.bodyMedium, color: '#fff' },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  navButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  navButtonDisabled: { opacity: 0.3 },
  navButtonText: { ...Typography.bodyMedium, color: '#fff' },
  nextButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nextButtonText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '700' },
  finishButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
    alignItems: 'center',
  },
  finishButtonText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '700' },
});
