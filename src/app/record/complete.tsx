import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getRecordOriginTab } from '@/lib/record-origin';

// 프로토타입 R06(기록 완료)의 축소판. 작은 실험 추천은 챌린지 도메인이 아직 없어 넣지 않고,
// LifeTime에서 보기도 타임라인 화면이 아직 없어 넣지 않는다(추후 단계에서 추가).
export default function RecordCompleteScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedText type="heading" style={styles.heading}>
            오늘의 기록이{'\n'}남았어요
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.body}>
            언제든 다시 열어보고, 생각을 더하거나 정리할 수 있어요.
          </ThemedText>
        </ThemedView>
        <AppButton title="닫기" onPress={() => router.replace(getRecordOriginTab() as Href)} />
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
    paddingVertical: Spacing.five,
    justifyContent: 'space-between',
  },
  content: {
    marginTop: Spacing.six,
  },
  heading: {
    textAlign: 'center',
  },
  body: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
});
