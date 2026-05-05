import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@constants/theme';

export function AIExtractionLoader() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.title}>Extracting Recipe…</Text>
        <Text style={styles.subtitle}>AI is parsing ingredients and steps</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
