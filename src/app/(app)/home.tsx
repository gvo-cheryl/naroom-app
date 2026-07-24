import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

// 프로토타입 H01(홈)의 인사 톤만 가져온 간략 버전이다. 체크인·기록·작은 실험 등은
// 아직 해당 API가 없어 오늘 범위에 넣지 않는다.
export default function HomeScreen() {
  const { state, logout } = useAuth();
  const displayName = state.status === 'active' ? state.account.displayName : '';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="eyebrow" themeColor="textTertiary">
            오늘의 인사
          </ThemedText>
          <ThemedText type="heading" style={styles.heading}>
            {displayName ? `${displayName}님,\n` : ''}오늘은 어떤 마음으로{'\n'}시작하고 있나요?
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.emptyCard}>
            <ThemedText type="default">아직 기록이 없어요.</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.emptyHint}>
              한 문장만 남겨도 충분해요.
            </ThemedText>
          </ThemedView>
        </ScrollView>

        <ThemedText type="small" themeColor="textTertiary" style={styles.logout} onPress={logout}>
          로그아웃
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.three,
  },
  heading: {
    marginTop: Spacing.one,
  },
  emptyCard: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyHint: {
    marginTop: Spacing.one,
  },
  logout: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
});
