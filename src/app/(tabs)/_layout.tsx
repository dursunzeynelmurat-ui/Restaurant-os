import { Text, View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Colors, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const isActive = color === Colors.primary;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={
          isActive
            ? {
                backgroundColor: Colors.primaryLight,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 3,
                marginBottom: 1,
              }
            : { paddingHorizontal: 10, paddingVertical: 3, marginBottom: 1 }
        }
      >
        <Text style={{ fontSize: 18, opacity: isActive ? 1 : 0.5 }}>{emoji}</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 4,
          height: 60,
          ...Shadow.md,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="import"
        options={{ title: 'Import', tabBarIcon: ({ color }) => <TabIcon emoji="📥" color={color} /> }}
      />
      <Tabs.Screen
        name="recipes"
        options={{ title: 'Recipes', tabBarIcon: ({ color }) => <TabIcon emoji="📖" color={color} /> }}
      />
      <Tabs.Screen
        name="pantry"
        options={{ title: 'Pantry', tabBarIcon: ({ color }) => <TabIcon emoji="🥕" color={color} /> }}
      />
      <Tabs.Screen
        name="planner"
        options={{ title: 'Planner', tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}
