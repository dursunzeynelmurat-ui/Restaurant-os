import { ScrollView, RefreshControl, ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@constants/theme';

interface SafeScrollViewProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  contentStyle?: ViewStyle;
  paddingHorizontal?: number;
}

export function SafeScrollView({
  children,
  onRefresh,
  isRefreshing = false,
  contentStyle,
  paddingHorizontal = Spacing.lg,
}: SafeScrollViewProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[{ paddingHorizontal, paddingBottom: Spacing.xl }, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
});
