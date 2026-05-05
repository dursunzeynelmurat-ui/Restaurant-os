import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View style={[styles.container, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  default: { backgroundColor: Colors.surfaceAlt },
  success: { backgroundColor: Colors.successLight },
  warning: { backgroundColor: Colors.warningLight },
  error: { backgroundColor: Colors.errorLight },
  primary: { backgroundColor: Colors.primaryLight },
  text: { ...Typography.captionMedium },
  text_default: { color: Colors.textSecondary },
  text_success: { color: Colors.success },
  text_warning: { color: Colors.warning },
  text_error: { color: Colors.error },
  text_primary: { color: Colors.primaryDark },
});
