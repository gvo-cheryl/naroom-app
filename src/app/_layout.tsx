import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/auth/AuthContext';
import { registerNotificationResponseHandler } from '@/notifications/deepLink';
import { ThemePreferenceProvider, useThemePreference } from '@/settings/ThemePreferenceContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ NanumMyeongjo_400Regular, NanumMyeongjo_700Bold });

  useEffect(() => registerNotificationResponseHandler(), []);

  // 폰트가 준비되기 전에는 아무것도 마운트하지 않는다 — 네이티브 스플래시가 계속 떠 있는 채로
  // AnimatedSplashOverlay(스플래시 화면 자체)까지 세리프 폰트가 적용된 상태로 그려지게 한다.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemePreferenceProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}

// React Navigation 자체 크롬(헤더·배경 등)도 앱 화면과 같은 resolvedScheme을 따르도록
// ThemePreferenceProvider 안쪽에서 별도 컴포넌트로 분리한다.
function RootNavigation() {
  const { resolvedScheme } = useThemePreference();

  return (
    <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="record" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
        <Stack.Screen name="day" />
        <Stack.Screen name="quotes" />
        <Stack.Screen name="experiment" />
        <Stack.Screen name="period-reflection" />
        <Stack.Screen name="entry" />
        <Stack.Screen name="personal-summary" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="badges" />
        <Stack.Screen name="notification-settings" />
        <Stack.Screen name="account-withdrawal" />
        <Stack.Screen name="inquiry" />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="preview" />
      </Stack>
    </ThemeProvider>
  );
}
