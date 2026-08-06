import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActiveExperimentProgram, recordExperimentMission } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentActiveProgramSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { missionTypeLabel } from '@/constants/experiment';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 프로토타입 E08(오늘의 작은 실험)에 대응한다. 다른 미션으로 바꾸기(mission:swap)는 대체 미션을
// 조회할 공개 API가 없어 이번 범위에서 제외한다(E06과 같은 이유).
export default function ExperimentTodayMissionScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentActiveProgramSummary | null>(null);
  const [resting, setResting] = useState(false);

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
          logger.error('experiment.today', 'failed to load today mission', {
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

  const handleRestToday = async () => {
    if (!program?.todayMission || resting) {
      return;
    }
    setResting(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await recordExperimentMission(accessToken, program.userExperimentProgramId, program.todayMission.userProgramMissionId, {
        attemptStatus: 'RESTED',
        recordDate: todayIsoDate(),
      });
      router.replace('/experiment/active');
    } catch (error) {
      logger.error('experiment.today', 'failed to record rest', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setResting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="오늘의 작은 실험" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : !program || !program.todayMission ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default">진행 중인 코스가 없어요.</ThemedText>
            </ThemedView>
          ) : (
            <>
              <View style={styles.between}>
                <ThemedText type="small" themeColor="textTertiary">
                  {program.title}
                </ThemedText>
                <ThemedView type="backgroundSelected" style={styles.pill}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {program.durationDays}개 중 {program.todayMission.dayNumber}번째
                  </ThemedText>
                </ThemedView>
              </View>

              <ThemedText type="heading" style={styles.title}>
                {program.todayMission.title}
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.instruction}>
                {program.todayMission.instruction}
              </ThemedText>

              {program.todayMission.reflectionQuestions.length > 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="small" themeColor="textTertiary" style={styles.cardEyebrow}>
                    함께 살펴볼 질문
                  </ThemedText>
                  {program.todayMission.reflectionQuestions.map((question) => (
                    <ThemedText key={question} type="small" style={styles.question}>
                      · {question}
                    </ThemedText>
                  ))}
                </ThemedView>
              )}

              <ThemedText type="small" themeColor="textTertiary" style={styles.meta}>
                {missionTypeLabel(program.todayMission.missionType)} · 예상 {program.todayMission.estimatedMinutes}분
              </ThemedText>

              <View style={styles.actions}>
                <AppButton title="해보고 기록하기" onPress={() => router.push('/experiment/record')} />
                <AppButton title="오늘은 쉬기" variant="quiet" loading={resting} onPress={handleRestToday} />
              </View>
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
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  pill: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  title: {
    marginTop: Spacing.three,
  },
  instruction: {
    marginTop: Spacing.two,
  },
  card: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  cardEyebrow: {
    marginBottom: Spacing.one,
  },
  question: {
    marginTop: Spacing.one,
  },
  meta: {
    marginTop: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
});
