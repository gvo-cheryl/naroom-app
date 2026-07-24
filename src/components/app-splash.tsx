import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 프로토타입 A01(스플래시)에 대응한다. 로그인 상태 판정이 끝나 부모(app/index.tsx)가 이 컴포넌트를
// 트리에서 빼면 exiting 애니메이션이 자동으로 재생된다 — 따로 보이기/숨기기 상태를 들고 있지 않는다.
export function AppSplash() {
  const theme = useTheme();

  return (
    <Animated.View
      exiting={FadeOut.duration(300)}
      onLayout={() => {
        SplashScreen.hideAsync();
      }}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedText type="wordmark">나로움</ThemedText>
      <ThemedText type="small" themeColor="textTertiary" style={styles.tagline}>
        기록을 통해 나를 이해하고,{'\n'}작은 변화를 시도하는 공간
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    zIndex: 1000,
  },
  tagline: {
    textAlign: 'center',
  },
});
