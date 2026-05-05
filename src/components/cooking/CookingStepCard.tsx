import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';
import { TimerWidget } from './TimerWidget';

interface CookingStepCardProps {
  instruction: string;
  timerRemaining: number | null;
  timerRunning: boolean;
  onToggleTimer: () => void;
}

export function CookingStepCard({
  instruction,
  timerRemaining,
  timerRunning,
  onToggleTimer,
}: CookingStepCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{instruction}</Text>
      {timerRemaining !== null && (
        <TimerWidget
          remaining={timerRemaining}
          isRunning={timerRunning}
          onToggle={onToggleTimer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  instruction: {
    ...Typography.cookingStep,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
  },
});
