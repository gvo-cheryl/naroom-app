import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 내 정보 탭은 아직 대부분 자리표시자다(계정·알림·개인정보 설정은 각자의 이슈에서 채운다).
// 지금은 나의 뱃지함(#20) 진입점만 연결한다.
export default function MeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="eyebrow" themeColor="textTertiary">
            내 정보
          </ThemedText>

          <Pressable
            onPress={() => router.push('/badges')}
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <SymbolView name={{ ios: 'rosette', android: 'workspace_premium' }} size={20} tintColor={theme.textSecondary} />
            <ThemedText type="default" style={styles.rowLabel}>
              나의 뱃지함
            </ThemedText>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} tintColor={theme.textTertiary} />
          </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  rowLabel: {
    flex: 1,
  },
});
