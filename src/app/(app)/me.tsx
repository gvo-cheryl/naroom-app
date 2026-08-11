import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthContext';
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

interface ActionRowProps {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function ActionRow({ icon, label, onPress, destructive }: ActionRowProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <SymbolView name={icon} size={20} tintColor={destructive ? theme.clay : theme.textSecondary} />
      <ThemedText type="default" themeColor={destructive ? 'clay' : undefined} style={styles.rowLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

// 내 정보 탭은 아직 대부분 자리표시자다(계정 정보 표시 등은 이후 이슈에서 채운다).
// 지금은 나의 뱃지함(#20), 알림 설정(#21), 화면 테마, 문의하기, 로그아웃, 계정과 기록 삭제 진입점만 연결한다.
export default function MeScreen() {
  const { logout } = useAuth();

  const handleLogoutPress = () => {
    Alert.alert('로그아웃할까요?', '', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  };

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
          <MenuRow icon={{ ios: 'circle.lefthalf.filled', android: 'brightness_6' }} label="화면 테마" href="/appearance" />
          <MenuRow icon={{ ios: 'questionmark.circle', android: 'help' }} label="문의하기" href="/inquiry" />
          <ActionRow icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout' }} label="로그아웃" onPress={handleLogoutPress} />
          <MenuRow
            icon={{ ios: 'person.crop.circle.badge.minus', android: 'person_remove' }}
            label="계정과 기록 삭제"
            href="/account-withdrawal"
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
