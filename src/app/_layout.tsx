import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/auth/AuthContext';
import { registerNotificationResponseHandler } from '@/notifications/deepLink';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ NanumMyeongjo_400Regular, NanumMyeongjo_700Bold });

  useEffect(() => registerNotificationResponseHandler(), []);

  // 폰트가 준비되기 전에는 아무것도 마운트하지 않는다 — 네이티브 스플래시가 계속 떠 있는 채로
  // AnimatedSplashOverlay(스플래시 화면 자체)까지 세리프 폰트가 적용된 상태로 그려지게 한다.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
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
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
