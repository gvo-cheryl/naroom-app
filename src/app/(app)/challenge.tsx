import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActiveExperimentProgram, getExperimentPrograms, getExperimentRecommendations, getPastExperimentPrograms } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentActiveProgramSummary, ExperimentProgramSummary, ExperimentRecommendationSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { ExperimentCourseCard } from '@/components/experiment-course-card';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 E01(작은 실험 홈)에 대응한다.
export default function ChallengeScreen() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<ExperimentActiveProgramSummary | null>(null);
  const [recommendations, setRecommendations] = useState<ExperimentRecommendationSummary[]>([]);
  const [programs, setPrograms] = useState<ExperimentProgramSummary[]>([]);
  const [pastCount, setPastCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const accessToken = await getValidAccessToken();
          if (!accessToken) {
            return;
          }
          const [active, recommended, allPrograms, past] = await Promise.all([
            getActiveExperimentProgram(accessToken),
            getExperimentRecommendations(accessToken),
            getExperimentPrograms(accessToken),
            getPastExperimentPrograms(accessToken),
          ]);
          if (cancelled) {
            return;
          }
          setActiveProgram(active);
          setRecommendations(recommended);
          setPrograms(allPrograms);
          setPastCount(past.length);
        } catch (error) {
          logger.error('challenge', 'failed to load experiment home', {
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

  const threeDayPrograms = programs.filter((program) => program.durationDays === 3);
  const sevenDayPrograms = programs.filter((program) => program.durationDays === 7);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="default" style={styles.headerTitle}>
            작은 실험
          </ThemedText>
          <Pressable
            onPress={() => router.push('/experiment/past')}
            hitSlop={8}
            style={styles.headerAction}
            accessibilityLabel="지난 작은 실험">
            <SymbolView name={{ ios: 'clock', android: 'schedule' }} size={20} tintColor={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="small" themeColor="textTertiary">
            정답을 찾거나 완벽히 해내기 위한 과제가 아니에요. 며칠 동안 작은 질문과 행동을 시도하며 지금의
            나에게 어떤 방식이 맞는지 알아보는 과정이에요.
          </ThemedText>

          {activeProgram ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.between}>
                <ThemedText type="smallBold" style={styles.activeTitle}>
                  {activeProgram.title}
                </ThemedText>
                <ThemedView type="backgroundSelected" style={styles.pill}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {activeProgram.status === 'PAUSED'
                      ? '잠시 멈춤'
                      : `${activeProgram.durationDays}개 중 ${activeProgram.currentDay}번째 미션`}
                  </ThemedText>
                </ThemedView>
              </View>
              <ThemedText type="small" themeColor="textTertiary" style={styles.activeMeta}>
                {activeProgram.durationDays}개의 작은 실험 중 {activeProgram.lookedAtMissionCount}개를 살펴봤어요.
                {activeProgram.restedDateCount > 0 ? ` 쉬어간 날은 ${activeProgram.restedDateCount}일이에요.` : ''}
              </ThemedText>
              {activeProgram.todayMission && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <ThemedText type="small" themeColor="textTertiary">
                    오늘의 작은 실험
                  </ThemedText>
                  <ThemedText type="default" style={styles.todayMissionTitle}>
                    {activeProgram.todayMission.title}
                  </ThemedText>
                </>
              )}
              <View style={styles.activeActions}>
                <AppButton
                  title="오늘 살펴보기"
                  style={styles.activeActionButton}
                  onPress={() => router.push('/experiment/today')}
                />
                <AppButton
                  title="코스 보기"
                  variant="ghost"
                  style={styles.activeActionButton}
                  onPress={() => router.push('/experiment/active')}
                />
              </View>
            </ThemedView>
          ) : loading ? null : (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="default">지금의 나를 알아볼 작은 실험을 시작해볼까요?</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.emptyHint}>
                3일 코스로 가볍게 시작할 수 있어요.
              </ThemedText>
            </ThemedView>
          )}

          {recommendations.length > 0 && (
            <>
              <SectionHeading icon={{ ios: 'sparkles', android: 'auto_awesome' }} title="추천 코스" style={styles.sectionHeading} />
              <View style={styles.stack}>
                {recommendations.map((recommendation) => (
                  <ExperimentCourseCard
                    key={recommendation.recommendationId}
                    program={recommendation.program}
                    recommendationId={recommendation.recommendationId}
                  />
                ))}
              </View>
            </>
          )}
          <View style={styles.actionRow}>
            <AppButton
              title="추천 코스 더 보기"
              variant="ghost"
              style={styles.actionButton}
              onPress={() => router.push('/experiment/recommended')}
            />
            <AppButton
              title="주제로 찾기"
              variant="ghost"
              style={styles.actionButton}
              onPress={() => router.push('/experiment/topics')}
            />
          </View>

          {threeDayPrograms.length > 0 && (
            <>
              <SectionHeading icon={{ ios: 'leaf', android: 'eco' }} title="3일 코스" style={styles.sectionHeading} />
              <View style={styles.stack}>
                {threeDayPrograms.map((program) => (
                  <ExperimentCourseCard key={program.programId} program={program} />
                ))}
              </View>
            </>
          )}

          {sevenDayPrograms.length > 0 && (
            <>
              <SectionHeading icon={{ ios: 'leaf.fill', android: 'eco' }} title="7일 코스" style={styles.sectionHeading} />
              <View style={styles.stack}>
                {sevenDayPrograms.map((program) => (
                  <ExperimentCourseCard key={program.programId} program={program} />
                ))}
              </View>
            </>
          )}

          {pastCount > 0 && (
            <AppButton
              title={`지난 작은 실험 ${pastCount}개 보기`}
              variant="ghost"
              style={styles.pastButton}
              onPress={() => router.push('/experiment/past')}
            />
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
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 19,
  },
  headerAction: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.three,
  },
  card: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  activeTitle: {
    flex: 1,
  },
  pill: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  activeMeta: {
    marginTop: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.three,
  },
  todayMissionTitle: {
    marginTop: Spacing.one,
  },
  activeActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  activeActionButton: {
    flex: 1,
  },
  emptyHint: {
    marginTop: Spacing.one,
  },
  sectionHeading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  stack: {
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  actionButton: {
    flex: 1,
  },
  pastButton: {
    marginTop: Spacing.five,
  },
});
