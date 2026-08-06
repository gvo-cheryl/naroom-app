import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getExperimentProgramDetail,
  getRandomExperimentProgram,
  saveExperimentProgram,
  startExperimentProgram,
  startRandomExperimentProgram,
} from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentCatalogMissionSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { missionTypeLabel } from '@/constants/experiment';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const ACTIVE_PROGRAM_EXISTS_CODE = 'EXPERIMENT_ACTIVE_PROGRAM_EXISTS';

type ConfirmParams = {
  mode: 'template' | 'random';
  programId?: string;
  durationDays?: string;
  recommendationId?: string;
};

// 프로토타입 E05(코스 구성 확인)에 대응한다. 미션 교체(E06)는 대체 미션을 조회할 공개 API가
// 없어 이번 범위에서는 원본 구성 그대로 시작·저장만 지원한다. mode=random일 때는 미리보기와
// 실제 시작이 서버에서 각각 새로 무작위 구성되므로 결과가 다를 수 있다(Beta 1 "제한적 랜덤"으로 허용).
export default function ExperimentConfirmScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<ConfirmParams>();
  const durationDays = params.durationDays ? Number(params.durationDays) : undefined;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [missions, setMissions] = useState<ExperimentCatalogMissionSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        if (params.mode === 'template' && params.programId) {
          const detail = await getExperimentProgramDetail(accessToken, params.programId);
          if (!cancelled) {
            setTitle(detail.title);
            setMissions(detail.missions);
          }
        } else if (params.mode === 'random' && durationDays) {
          const random = await getRandomExperimentProgram(accessToken, durationDays);
          if (!cancelled) {
            setTitle(`무작위로 고른 ${durationDays}일 코스`);
            setMissions(random.missions);
          }
        }
      } catch (error) {
        logger.error('experiment.confirm', 'failed to load course composition', {
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
  }, [params.mode, params.programId, durationDays]);

  const startOrSave = async (action: 'start' | 'save', replaceActiveProgram = false) => {
    setSubmitting(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      if (params.mode === 'template' && params.programId) {
        if (action === 'start') {
          await startExperimentProgram(accessToken, params.programId, {
            recommendationId: params.recommendationId,
            replaceActiveProgram,
          });
        } else {
          await saveExperimentProgram(accessToken, params.programId, {
            recommendationId: params.recommendationId,
          });
        }
      } else if (params.mode === 'random' && durationDays) {
        await startRandomExperimentProgram(accessToken, durationDays, replaceActiveProgram);
      }
      setConflictOpen(false);
      router.replace('/(app)/challenge');
    } catch (error) {
      if (error instanceof ApiError && error.code === ACTIVE_PROGRAM_EXISTS_CODE && action === 'start') {
        setConflictOpen(true);
        return;
      }
      logger.error('experiment.confirm', 'failed to start or save course', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="코스 구성 확인" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : (
            <>
              <ThemedText type="heading" style={styles.title}>
                {title}
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
                {missions.length}일 동안 이런 순서로 진행돼요.
              </ThemedText>

              <View style={styles.stack}>
                {missions.map((mission) => (
                  <ThemedView key={`${mission.dayNumber}-${mission.missionId}`} type="backgroundElement" style={styles.missionCard}>
                    <ThemedText type="small" themeColor="textTertiary">
                      Day {mission.dayNumber} · {missionTypeLabel(mission.missionType)}
                    </ThemedText>
                    <ThemedText type="default" style={styles.missionTitle}>
                      {mission.title}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>

              <View style={styles.actions}>
                <AppButton
                  title="이대로 시작하기"
                  loading={submitting}
                  onPress={() => startOrSave('start')}
                />
                {params.mode === 'template' && (
                  <AppButton
                    title="저장해두고 나중에 시작하기"
                    variant="ghost"
                    disabled={submitting}
                    onPress={() => startOrSave('save')}
                  />
                )}
              </View>
            </>
          )}
        </ScrollView>

        <Modal visible={conflictOpen} transparent animationType="fade" onRequestClose={() => setConflictOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setConflictOpen(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: theme.backgroundElement }]} onPress={() => {}}>
              <ThemedText type="default" style={styles.sheetTitle}>
                이미 진행 중인 코스가 있어요
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.sheetLead}>
                한 번에 하나의 작은 실험만 진행해요. 지금 어떻게 할까요?
              </ThemedText>
              <View style={styles.sheetActions}>
                <AppButton
                  title="진행하던 코스 이어가기"
                  onPress={() => {
                    setConflictOpen(false);
                    router.replace('/(app)/challenge');
                  }}
                />
                <AppButton
                  title="새 코스로 바꾸기"
                  variant="ghost"
                  loading={submitting}
                  onPress={() => startOrSave('start', true)}
                />
              </View>
              <ThemedText type="small" themeColor="textTertiary" style={styles.sheetNote}>
                어떤 선택을 해도 지금까지의 기록과 수행 이력은 지워지지 않아요.
              </ThemedText>
            </Pressable>
          </Pressable>
        </Modal>
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
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sheetTitle: {
    textAlign: 'center',
  },
  sheetLead: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  sheetActions: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  sheetNote: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
});
