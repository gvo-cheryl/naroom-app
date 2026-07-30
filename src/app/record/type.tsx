import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { RECORD_TYPES } from '@/constants/record';
import { useTheme } from '@/hooks/use-theme';

// 프로토타입 R01(기록 유형 선택)에 대응한다.
export default function RecordTypeScreen() {
  const theme = useTheme();

  const selectType = (typeId: string) => {
    router.push({ pathname: '/record/write', params: { type: typeId } });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="무엇을 기록할까요" />
          <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
            형식은 나중에 바꿔도 괜찮아요. 지금 편한 것부터 고르세요.
          </ThemedText>

          <ThemedView style={styles.stack}>
            {RECORD_TYPES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => selectType(t.id)}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.optionText}>
                  <ThemedText type="default">{t.name}</ThemedText>
                  <ThemedText type="small" themeColor="textTertiary">
                    {t.desc}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </ThemedView>
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
    paddingBottom: Spacing.four,
  },
  lead: {
    marginTop: Spacing.one,
  },
  stack: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  optionText: {
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
