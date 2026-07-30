import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

interface ComingSoonScreenProps {
  eyebrow: string;
  description: string;
}

// 하단 탭 구조는 먼저 만들고, 각 탭의 실제 화면은 해당 도메인 API 연동 단계에서 채운다.
export function ComingSoonScreen({ eyebrow, description }: ComingSoonScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="eyebrow" themeColor="textTertiary">
            {eyebrow}
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        </ScrollView>
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
  description: {
    marginTop: Spacing.two,
  },
});
