import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { typography, useAppTheme } from '@/theme';

export default function RootLayout() {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.brand,
          headerTitleStyle: { ...typography.bodyStrong, color: colors.text },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="capture" options={{ title: 'Scan label' }} />
        <Stack.Screen name="analyzing" options={{ title: 'Analyzing label' }} />
        <Stack.Screen name="result" options={{ title: 'Label result' }} />
        <Stack.Screen name="about" options={{ title: 'About ScanLabel' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
