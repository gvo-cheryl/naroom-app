import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActiveExperimentProgram } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentActiveProgramSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { StackBar } from '@/components/charts/stack-bar';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 E07(진행 중인 코스)에 대응한다. 전체 진행 보기(E10)·코스 돌아보기(E12)는 9-D에서
// 만들어지므로 이번 범위에서는 연결하지 않는다.
export default function ExperimentActiveProgramScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentActiveProgramSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const accessToken = await getValidAccessToken();
          if (!accessToken) {
            return;
          }
          const active = await getActiveExperimentProgram(accessToken);
          if (!cancelled) {
            setProgram(active);
          }
        } catch (error) {
          logger.error('experiment.active', 'failed to load active program', {
            code: error instanceof ApiError ? error.code : undefined,
          });
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="진행 중인 코스" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : !program ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default">진행 중인 코스가 없어요.</ThemedText>
              <AppButton
                title="작은 실험 둘러보기"
                variant="ghost"
                style={styles.emptyButton}
                onPress={() => router.replace('/(app)/challenge')}
              />
            </ThemedView>
          ) : (
            <>
              <ThemedText type="heading" style={styles.title}>
                {program.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
                미션 {program.durationDays}개{program.status === 'PAUSED' ? ' · 잠시 멈춤' : ''}
              </ThemedText>

              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="default">
                  {program.durationDays}개의 작은 실험 중 {program.lookedAtMissionCount}개를 살펴봤어요.
                </ThemedText>
                {program.restedDateCount > 0 && (
                  <ThemedText type="small" themeColor="textTertiary" style={styles.restNote}>
                    쉬어간 날 {program.restedDateCount}일 · 쉰 날은 살펴본 미션에 포함하지 않고, 코스 기간만
                    그만큼 늘어나요.
                  </ThemedText>
                )}
                <View style={styles.progressBar}>
                  <StackBar
                    parts={[
                      { label: '살펴본 미션', value: program.lookedAtMissionCount, color: theme.moss },
                      {
                        label: '아직 남은 미션',
                        value: Math.max(0, program.durationDays - program.lookedAtMissionCount),
                        color: theme.border,
                      },
                    ]}
                  />
                </View>
              </ThemedView>

              <View style={styles.actions}>
                <AppButton title="오늘의 작은 실험 보기" onPress={() => router.push('/experiment/today')} />
                <AppButton title="쉬기 · 변경하기" variant="ghost" onPress={() => router.push('/experiment/pause')} />
              </View>

              <ThemedText type="small" themeColor="textTertiary" style={styles.footnote}>
                “{program.durationDays}개 중 {program.lookedAtMissionCount}개를 살펴봤어요”처럼 셈한 사실만
                보여줘요. 달성률·성공률·연속 일수는 표시하지 않아요.
              </ThemedText>
            </>
          )}
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
  loading: {
    marginTop: Spacing.six,
  },
  empty: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyButton: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  title: {
    marginTop: Spacing.two,
  },
  lead: {
    marginTop: Spacing.two,
  },
  card: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  restNote: {
    marginTop: Spacing.two,
  },
  progressBar: {
    marginTop: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  footnote: {
    marginTop: Spacing.four,
  },
});
