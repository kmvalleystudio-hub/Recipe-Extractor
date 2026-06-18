import { Platform } from 'react-native';

// NativeWind: use pre-built CSS on web (see scripts/prebuild-css.mjs), runtime on native
if (Platform.OS === 'web') {
  require('../node_modules/.cache/nativewind/global.css.web.css');
} else {
  require('../global.css');
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PhonePreview } from '@/components/web/PhonePreview';

export default function RootLayout() {
  return (
    <PhonePreview>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A1A',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </PhonePreview>
  );
}
