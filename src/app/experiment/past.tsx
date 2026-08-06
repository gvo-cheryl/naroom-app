import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPastExperimentPrograms } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentPastProgramSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

function statusLabel(status: ExperimentPastProgramSummary['status']): string {
  return status === 'COMPLETED' ? '완료' : '중단';
}

// 프로토타입 E13(지난 작은 실험)에 대응한다. "다시 보기"는 전체 진행 보기(E10)로 연결한다.
// "일부 다시 해보기"(코스 상세 E04로 이동)는 지난 코스의 programId를 내려주는 API가 없어 이번
// 범위에서 제외한다.
export default function PastExperimentsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [pastPrograms, setPastPrograms] = useState<ExperimentPastProgramSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const data = await getPastExperimentPrograms(accessToken);
        if (!cancelled) {
          setPastPrograms(data);
        }
      } catch (error) {
        logger.error('experiment.past', 'failed to load past programs', {
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
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="지난 작은 실험" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : pastPrograms.length > 0 ? (
            <View style={styles.stack}>
              {pastPrograms.map((program) => (
                <Pressable
                  key={program.userExperimentProgramId}
                  onPress={() =>
                    router.push({
                      pathname: '/experiment/progress',
                      params: {
                        userExperimentProgramId: program.userExperimentProgramId,
                        title: program.title,
                        durationDays: String(program.durationDays),
                        active: 'false',
                      },
                    })
                  }>
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <View style={styles.between}>
                      <ThemedText type="smallBold" style={styles.title}>
                        {program.title}
                      </ThemedText>
                      <ThemedView type="backgroundSelected" style={styles.pill}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {program.durationDays}일
                        </ThemedText>
                      </ThemedView>
                    </View>
                    <ThemedText type="small" themeColor="textTertiary" style={styles.meta}>
                      {statusLabel(program.status)} · {program.currentDay}일차까지 진행
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          ) : (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default">아직 마무리한 코스가 없어요.</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.emptyHint}>
                진행 중에 언제든 마무리할 수 있어요.
              </ThemedText>
            </ThemedView>
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
  stack: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  pill: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  meta: {
    marginTop: Spacing.two,
  },
  empty: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyHint: {
    marginTop: Spacing.one,
    textAlign: 'center',
  },
});
