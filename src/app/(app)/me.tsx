import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MenuRowProps {
  icon: SymbolViewProps['name'];
  label: string;
  href: Href;
}

function MenuRow({ icon, label, href }: MenuRowProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => router.push(href)} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <SymbolView name={icon} size={20} tintColor={theme.textSecondary} />
      <ThemedText type="default" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} tintColor={theme.textTertiary} />
    </Pressable>
  );
}

// 내 정보 탭은 아직 대부분 자리표시자다(계정·개인정보 설정은 각자의 이슈에서 채운다).
// 지금은 나의 뱃지함(#20), 알림 설정(#21) 진입점만 연결한다.
export default function MeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="eyebrow" themeColor="textTertiary">
            내 정보
          </ThemedText>

          <MenuRow icon={{ ios: 'rosette', android: 'workspace_premium' }} label="나의 뱃지함" href="/badges" />
          <MenuRow
            icon={{ ios: 'bell', android: 'notifications' }}
            label="알림 설정"
            href="/notification-settings"
          />
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
