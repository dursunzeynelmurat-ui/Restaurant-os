import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

interface TimerWidgetProps {
  remaining: number;
  isRunning: boolean;
  onToggle: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimerWidget({ remaining, isRunning, onToggle }: TimerWidgetProps) {
  const isFinished = remaining === 0;
  return (
    <View style={styles.container}>
      <Text style={[styles.time, isFinished && styles.timeFinished]}>
        {formatTime(remaining)}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isRunning && styles.buttonActive,
          isFinished && styles.buttonFinished,
          pressed && { opacity: 0.8 },
        ]}
        onPress={onToggle}
        disabled={isFinished}
      >
        <Text style={styles.buttonText}>
          {isFinished ? '✓ Done' : isRunning ? '⏸ Pause' : '▶ Start Timer'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.md },
  time: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timeFinished: { color: Colors.success },
  button: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonActive: { backgroundColor: Colors.primaryDark },
  buttonFinished: { backgroundColor: 'rgba(16,185,129,0.25)' },
  buttonText: { ...Typography.bodyMedium, color: '#fff' },
});
