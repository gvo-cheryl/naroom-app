import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 프로토타입 하단 탭의 중앙 "기록하기" 버튼에 대응한다. NativeTabs(unstable)는 탭을 눌러도
// 그 탭 화면으로 전환하지 않고 다른 화면으로만 보내는 액션 탭 패턴을 지원하지 않아(onPress 가로채기
// API 없음), 실제 탭이 아니라 탭바 위에 겹쳐 그리는 독립된 버튼으로 구현한다 — 항상 탭 상태와
// 무관하게 눌릴 때마다 유형 선택 화면으로 이동한다.
export function RecordFab() {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/record/type')}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.text },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: theme.background }}>
        기록하기
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: BottomTabInset + Spacing.two,
    alignSelf: 'center',
    borderRadius: Radius.full,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.85,
  },
});
