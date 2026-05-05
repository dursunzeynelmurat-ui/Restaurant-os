import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as KeepAwake from 'expo-keep-awake';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { useRecipeDetail } from '@hooks/useRecipes';
import { useCookingStore } from '@stores/cookingStore';
import { StepProgressBar } from '@components/cooking/StepProgressBar';
import { CookingStepCard } from '@components/cooking/CookingStepCard';

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

  function handleFinish() {
    endCooking();
    router.replace(`/recipe/${id}`);
  }

  if (!recipe || steps.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleFinish}>
          <Text style={styles.exitText}>✕ Exit</Text>
        </Pressable>
        <Text style={styles.recipeName} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.servingsText}>{scaledServings} servings</Text>
      </View>

      <StepProgressBar currentIndex={currentStepIndex} total={steps.length} />

      <CookingStepCard
        instruction={currentStep?.instruction ?? ''}
        timerRemaining={timerRemaining}
        timerRunning={timerRunning}
        onToggleTimer={() => setTimerRunning((r) => !r)}
      />

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
  loadingText: { ...Typography.body, color: '#fff', padding: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  exitText: { ...Typography.body, color: 'rgba(255,255,255,0.6)' },
  recipeName: {
    ...Typography.bodySmallMedium,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  servingsText: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.6)' },
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
