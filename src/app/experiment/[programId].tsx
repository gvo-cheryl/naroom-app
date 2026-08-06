import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExperimentProgramDetail } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentProgramDetailSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { missionTypeLabel } from '@/constants/experiment';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 E04(코스 상세)에 대응한다. 미션 바꿔보기(E06)는 대체 미션을 조회할 공개 API가
// 아직 없어 이번 범위에서는 "이대로 시작하기"만 연결한다.
export default function ExperimentProgramDetailScreen() {
  const theme = useTheme();
  const { programId, recommendationId } = useLocalSearchParams<{ programId: string; recommendationId?: string }>();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentProgramDetailSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const detail = await getExperimentProgramDetail(accessToken, programId);
        if (!cancelled) {
          setProgram(detail);
        }
      } catch (error) {
        logger.error('experiment.detail', 'failed to load program detail', {
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
  }, [programId]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="코스 상세" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading || !program ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : (
            <>
              <ThemedText type="heading" style={styles.title}>
                {program.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.description}>
                {program.description}
              </ThemedText>

              <ThemedView type="backgroundElement" style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <ThemedText type="small" themeColor="textTertiary">
                    기간
                  </ThemedText>
                  <ThemedText type="small">{program.durationDays}일</ThemedText>
                </View>
                <View style={[styles.infoRow, styles.infoRowGap]}>
                  <ThemedText type="small" themeColor="textTertiary">
                    하루 예상 시간
                  </ThemedText>
                  <ThemedText type="small">
                    {program.estimatedMinutesMin === program.estimatedMinutesMax
                      ? `${program.estimatedMinutesMin}분 안팎`
                      : `${program.estimatedMinutesMin}~${program.estimatedMinutesMax}분 안팎`}
                  </ThemedText>
                </View>
                <View style={[styles.infoRow, styles.infoRowGap]}>
                  <ThemedText type="small" themeColor="textTertiary">
                    포함된 미션
                  </ThemedText>
                  <ThemedText type="small">{program.missions.length}개</ThemedText>
                </View>
              </ThemedView>

              <ThemedText type="default" style={styles.sectionTitle}>
                어떤 것을 해보게 되나요
              </ThemedText>
              <View style={styles.stack}>
                {program.missions.map((mission) => (
                  <ThemedView key={mission.missionId} type="backgroundElement" style={styles.missionCard}>
                    <View style={styles.infoRow}>
                      <ThemedText type="small" themeColor="textTertiary">
                        Day {mission.dayNumber} · {missionTypeLabel(mission.missionType)}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textTertiary">
                        {mission.estimatedMinutes}분
                      </ThemedText>
                    </View>
                    <ThemedText type="default" style={styles.missionTitle}>
                      {mission.title}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>

              <View style={styles.actions}>
                <AppButton
                  title="이대로 시작하기"
                  onPress={() =>
                    router.push({
                      pathname: '/experiment/confirm',
                      params: {
                        mode: 'template',
                        programId: program.id,
                        ...(recommendationId ? { recommendationId } : {}),
                      },
                    })
                  }
                />
                <AppButton title="다른 코스 보기" variant="quiet" onPress={() => router.back()} />
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
  title: {
    marginTop: Spacing.two,
  },
  description: {
    marginTop: Spacing.two,
  },
  infoCard: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRowGap: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  stack: {
    gap: Spacing.two,
  },
  missionCard: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  missionTitle: {
    marginTop: Spacing.one,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
});
