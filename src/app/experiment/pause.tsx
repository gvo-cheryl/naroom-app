import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  endEarlyExperimentProgram,
  getActiveExperimentProgram,
  getExperimentProgramMissions,
  pauseExperimentProgram,
  recordExperimentMission,
} from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentActiveProgramSummary, ExperimentProgramDaySummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 프로토타입 E11(쉬기·변경하기)에 대응한다. 설계 문서 §11.6(DEC-04)에 따라 "며칠 쉬기"와
// "나중에 다시 시작하기"는 같은 PAUSED 전환이라 버튼 하나("쉬어가기")로 합쳤다. 재개는 자동이라
// (DEC-05) 별도의 "다시 시작하기" 버튼은 없다 - 다음에 아무 미션이나 기록하면 자동으로 돌아온다.
export default function ExperimentPauseScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentActiveProgramSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [dayPickerLoading, setDayPickerLoading] = useState(false);
  const [swappableDays, setSwappableDays] = useState<ExperimentProgramDaySummary[]>([]);

  useEffect(() => {
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
        logger.error('experiment.pause', 'failed to load active program', {
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

  const handleRestToday = async () => {
    if (!program?.todayMission || submitting) {
      return;
    }
    setSubmitting(true);
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
      logger.error('experiment.pause', 'failed to record rest', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndEarly = async () => {
    if (!program || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await endEarlyExperimentProgram(accessToken, program.userExperimentProgramId);
      router.replace('/(app)/challenge');
    } catch (error) {
      logger.error('experiment.pause', 'failed to end program early', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async () => {
    if (!program || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await pauseExperimentProgram(accessToken, program.userExperimentProgramId);
      router.replace('/(app)/challenge');
    } catch (error) {
      logger.error('experiment.pause', 'failed to pause program', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDayPicker = async () => {
    if (!program || dayPickerLoading) {
      return;
    }
    if (dayPickerOpen) {
      setDayPickerOpen(false);
      return;
    }
    setDayPickerLoading(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      const missions = await getExperimentProgramMissions(accessToken, program.userExperimentProgramId);
      setSwappableDays(missions.days.filter((day) => day.slotStatus !== 'RECORDED'));
      setDayPickerOpen(true);
    } catch (error) {
      logger.error('experiment.pause', 'failed to load program missions', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setDayPickerLoading(false);
    }
  };

  const handlePickDay = (day: ExperimentProgramDaySummary) => {
    if (!program) {
      return;
    }
    router.push({
      pathname: '/experiment/swap',
      params: {
        mode: 'apply',
        userExperimentProgramId: program.userExperimentProgramId,
        userProgramMissionId: day.userProgramMissionId,
        excludeMissionIds: day.missionId,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="쉬기 · 변경하기" />
        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        ) : !program ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedText type="default">진행 중인 코스가 없어요.</ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
              쉬어도 코스는 실패하지 않아요. 놓친 날의 미션을 모두 채우지 않아도 괜찮아요.
            </ThemedText>
            <View style={styles.stack}>
              <AppButton title="오늘 하루 쉬기" loading={submitting} onPress={handleRestToday} />
              <AppButton title="며칠 쉬어가기" variant="ghost" loading={submitting} onPress={handlePause} />
              <ThemedText type="small" themeColor="textTertiary" style={styles.pauseHint}>
                언제 돌아올지 정하지 않아도 괜찮아요. 다시 기록하면 자동으로 이어져요.
              </ThemedText>
              <AppButton title="남은 미션 바꾸기" variant="ghost" loading={dayPickerLoading} onPress={handleOpenDayPicker} />
              {dayPickerOpen && (
                <View style={styles.dayList}>
                  {swappableDays.map((day) => (
                    <Pressable
                      key={day.dayNumber}
                      onPress={() => handlePickDay(day)}
                      style={[styles.dayOption, { borderColor: theme.border }]}>
                      <ThemedText type="small" themeColor="textTertiary">
                        Day {day.dayNumber}
                      </ThemedText>
                      <ThemedText type="default">{day.title}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
              <AppButton
                title="지금까지 기록하고 마무리하기"
                variant="ghost"
                disabled={submitting}
                onPress={handleEndEarly}
              />
            </View>
            <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
              중단해도 지금까지의 기록은 LifeTime에 그대로 남아요.
            </ThemedText>
          </>
        )}
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
  loading: {
    marginTop: Spacing.six,
  },
  empty: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  lead: {
    marginTop: Spacing.two,
  },
  stack: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  pauseHint: {
    marginTop: -Spacing.one,
    marginBottom: Spacing.one,
  },
  dayList: {
    gap: Spacing.two,
  },
  dayOption: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  note: {
    marginTop: Spacing.four,
    textAlign: 'center',
  },
});
