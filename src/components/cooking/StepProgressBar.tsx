import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

interface StepProgressBarProps {
  currentIndex: number;
  total: number;
}

export function StepProgressBar({ currentIndex, total }: StepProgressBarProps) {
  const pct = ((currentIndex + 1) / total) * 100;
  return (
    <>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as `${number}%` }]} />
      </View>
      <Text style={styles.label}>Step {currentIndex + 1} of {total}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
  },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  label: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
});
