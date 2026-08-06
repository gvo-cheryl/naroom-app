import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExperimentMissions, getExperimentTopics, replaceExperimentMission } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentMissionSummary, ExperimentTopicSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { missionTypeLabel } from '@/constants/experiment';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

type SwapParams = {
  mode: 'draft' | 'apply';
  excludeMissionIds?: string;
  dayNumber?: string;
  confirmMode?: 'template' | 'random';
  programId?: string;
  durationDays?: string;
  recommendationId?: string;
  userExperimentProgramId?: string;
  userProgramMissionId?: string;
};

// 프로토타입 E06(미션 교체)에 대응한다. 시작 전(draft)에는 고른 미션을 코스 구성 확인(E05)으로
// 되돌려주고, 진행 중(apply)에는 이 화면에서 바로 교체 API를 호출한다.
export default function ExperimentSwapMissionScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<SwapParams>();
  const excludeIds = useMemo(
    () => new Set((params.excludeMissionIds ?? '').split(',').filter((id) => id.length > 0)),
    [params.excludeMissionIds],
  );

  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<ExperimentMissionSummary[]>([]);
  const [topics, setTopics] = useState<ExperimentTopicSummary[]>([]);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const [missionList, topicList] = await Promise.all([
          getExperimentMissions(accessToken),
          getExperimentTopics(accessToken),
        ]);
        if (!cancelled) {
          setMissions(missionList);
          setTopics(topicList);
        }
      } catch (error) {
        logger.error('experiment.swap', 'failed to load mission catalog', {
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

  const candidates = missions.filter(
    (mission) => !excludeIds.has(mission.id) && (topicFilter === null || mission.topicCode === topicFilter),
  );

  const handlePick = async (mission: ExperimentMissionSummary) => {
    if (params.mode === 'draft') {
      router.replace({
        pathname: '/experiment/confirm',
        params: {
          mode: params.confirmMode ?? 'template',
          programId: params.programId,
          durationDays: params.durationDays,
          recommendationId: params.recommendationId,
          swapDay: params.dayNumber,
          swapMissionId: mission.id,
          swapMissionCode: mission.code,
          swapMissionTitle: mission.title,
          swapMissionType: mission.missionType,
          swapMissionMinutes: String(mission.estimatedMinutes),
        },
      });
      return;
    }

    if (!params.userExperimentProgramId || !params.userProgramMissionId || applying) {
      return;
    }
    setErrorMessage(null);
    setApplying(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await replaceExperimentMission(accessToken, params.userExperimentProgramId, params.userProgramMissionId, {
        replacementMissionId: mission.id,
      });
      router.replace('/experiment/today');
    } catch (error) {
      logger.error('experiment.swap', 'failed to replace mission', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage(
        error instanceof ApiError && error.code === 'EXPERIMENT_DUPLICATE_MISSION_SELECTION'
          ? '이미 이 코스에 포함된 미션이에요. 다른 미션을 골라주세요.'
          : '미션을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="미션 교체" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : (
            <>
              <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
                지금은 부담스럽거나 나와 맞지 않는다면 바꿔도 괜찮아요.
              </ThemedText>

              <View style={styles.chips}>
                <Pressable
                  onPress={() => setTopicFilter(null)}
                  style={[
                    styles.chip,
                    { borderColor: theme.border },
                    topicFilter === null && { backgroundColor: theme.text, borderColor: theme.text },
                  ]}>
                  <ThemedText type="small" style={{ color: topicFilter === null ? theme.background : theme.textSecondary }}>
                    전체
                  </ThemedText>
                </Pressable>
                {topics.map((topic) => {
                  const selected = topicFilter === topic.code;
                  return (
                    <Pressable
                      key={topic.id}
                      onPress={() => setTopicFilter(selected ? null : topic.code)}
                      style={[
                        styles.chip,
                        { borderColor: theme.border },
                        selected && { backgroundColor: theme.text, borderColor: theme.text },
                      ]}>
                      <ThemedText type="small" style={{ color: selected ? theme.background : theme.textSecondary }}>
                        {topic.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {errorMessage && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
                  {errorMessage}
                </ThemedText>
              )}

              <View style={styles.stack}>
                {candidates.map((mission) => (
                  <Pressable
                    key={mission.id}
                    disabled={applying}
                    onPress={() => handlePick(mission)}
                    style={[styles.option, { borderColor: theme.border }]}>
                    <ThemedText type="small" themeColor="textTertiary">
                      {missionTypeLabel(mission.missionType)} · {mission.estimatedMinutes}분
                    </ThemedText>
                    <ThemedText type="default" style={styles.optionTitle}>
                      {mission.title}
                    </ThemedText>
                  </Pressable>
                ))}
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
  lead: {
    marginTop: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  error: {
    marginTop: Spacing.three,
  },
  stack: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  optionTitle: {
    marginTop: Spacing.one,
  },
});
