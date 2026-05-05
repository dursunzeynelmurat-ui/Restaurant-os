import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        (disabled || isLoading) && styles.disabled,
        pressed && !disabled && !isLoading && styles.pressed,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : Colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.primary, ...Shadow.sm },
  secondary: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: Colors.error },
  size_sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
  size_md: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  text: { fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_secondary: { color: Colors.textPrimary },
  text_ghost: { color: Colors.primary },
  text_destructive: { color: '#fff' },
  textSize_sm: { ...Typography.bodySmallMedium },
  textSize_md: { ...Typography.bodyMedium },
  textSize_lg: { ...Typography.bodyMedium, fontSize: 17 },
});
