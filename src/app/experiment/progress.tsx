import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { endEarlyExperimentProgram, getExperimentProgramMissions } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentProgramMissionsSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { attemptStatusLabel, missionTypeLabel } from '@/constants/experiment';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

type ProgressParams = {
  userExperimentProgramId: string;
  title?: string;
  durationDays?: string;
  active?: string;
};

// 프로토타입 E10(전체 진행 보기)에 대응한다.
export default function ExperimentProgramProgressScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<ProgressParams>();
  const isActive = params.active === 'true';

  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<ExperimentProgramMissionsSummary | null>(null);
  const [endingEarly, setEndingEarly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const data = await getExperimentProgramMissions(accessToken, params.userExperimentProgramId);
        if (!cancelled) {
          setMissions(data);
        }
      } catch (error) {
        logger.error('experiment.progress', 'failed to load program missions', {
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
  }, [params.userExperimentProgramId]);

  const handleEndEarly = async () => {
    if (endingEarly) {
      return;
    }
    setEndingEarly(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await endEarlyExperimentProgram(accessToken, params.userExperimentProgramId);
      router.replace('/(app)/challenge');
    } catch (error) {
      logger.error('experiment.progress', 'failed to end program early', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setEndingEarly(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="전체 진행 보기" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading || !missions ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : (
            <>
              {params.title && (
                <ThemedText type="heading" style={styles.title}>
                  {params.title}
                </ThemedText>
              )}
              {params.durationDays && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
                  {params.durationDays}일 코스
                </ThemedText>
              )}

              <View style={styles.stack}>
                {missions.days.map((day) => (
                  <ThemedView
                    key={day.dayNumber}
                    type="backgroundElement"
                    style={[styles.dayCard, day.slotStatus === 'CURRENT' && { borderColor: theme.text, borderWidth: 1 }]}>
                    <View style={styles.between}>
                      <ThemedText type="small" themeColor="textTertiary">
                        Day {day.dayNumber} · {missionTypeLabel(day.missionType)}
                      </ThemedText>
                      {day.record ? (
                        <ThemedView type="backgroundSelected" style={styles.pill}>
                          <ThemedText type="small" themeColor="textSecondary">
                            {attemptStatusLabel(day.record.attemptStatus)}
                          </ThemedText>
                        </ThemedView>
                      ) : (
                        <ThemedText type="small" themeColor="textTertiary">
                          {day.slotStatus === 'CURRENT' ? '오늘' : '아직'}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText type="default" style={styles.dayTitle}>
                      {day.title}
                    </ThemedText>
                    {day.replaced && (
                      <ThemedText type="small" themeColor="textTertiary" style={styles.dayNote}>
                        다른 미션으로 바꾼 날이에요.
                      </ThemedText>
                    )}
                    {day.record?.responseText && (
                      <ThemedText type="small" themeColor="textTertiary" style={styles.dayNote} numberOfLines={2}>
                        {day.record.responseText}
                      </ThemedText>
                    )}
                  </ThemedView>
                ))}
              </View>

              {missions.restedDates.length > 0 && (
                <>
                  <SectionHeading
                    icon={{ ios: 'pause.circle', android: 'pause_circle' }}
                    title="쉬어간 날"
                    style={styles.sectionHeading}
                  />
                  <View style={styles.stack}>
                    {missions.restedDates.map((rested) => (
                      <View key={`${rested.recordDate}-${rested.dayNumber}`} style={styles.between}>
                        <ThemedText type="small" themeColor="textTertiary">
                          {rested.recordDate}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textTertiary">
                          {rested.missionTitle} 미션은 그대로 남겨두었어요
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <ThemedText type="small" themeColor="textTertiary" style={styles.footnote}>
                쉬어간 날과 아직 살펴보지 않은 날은 경고색으로 표시하지 않아요. 쉰 날은 미션을 소비하지
                않고 코스 기간만 늘어나요.
              </ThemedText>

              {isActive && (
                <AppButton
                  title="지금까지 기록하고 마무리하기"
                  variant="ghost"
                  loading={endingEarly}
                  style={styles.endEarlyButton}
                  onPress={handleEndEarly}
                />
              )}
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
  title: {
    marginTop: Spacing.two,
  },
  lead: {
    marginTop: Spacing.two,
  },
  stack: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  dayCard: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pill: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  dayTitle: {
    marginTop: Spacing.one,
  },
  dayNote: {
    marginTop: Spacing.one,
  },
  sectionHeading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  footnote: {
    marginTop: Spacing.four,
  },
  endEarlyButton: {
    marginTop: Spacing.five,
  },
});
