import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as never, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={120} borderRadius={12} style={{ marginBottom: 8 }} />
      <Skeleton height={16} width="80%" borderRadius={6} style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="50%" borderRadius={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: Colors.border },
  card: { padding: 8 },
});
