import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/settings/ThemePreferenceContext';
import type { ThemePreference } from '@/settings/themePreference';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '시스템 설정에 따름' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

// 계정 데이터가 아니라 기기별 화면 설정이라 로그인 여부와 무관하게 접근 가능하다(auth 가드 없음).
export default function AppearanceScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="화면 테마" />

          <View style={styles.stack}>
            {OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                style={[
                  styles.option,
                  { borderColor: preference === option.value ? theme.text : theme.border },
                  preference === option.value && styles.optionOn,
                ]}>
                <ThemedText type="default">{option.label}</ThemedText>
              </Pressable>
            ))}
          </View>
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
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  stack: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  optionOn: {
    borderWidth: 1.5,
  },
});
