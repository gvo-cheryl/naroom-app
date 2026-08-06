import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExperimentRecommendations } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentRecommendationSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { ExperimentCourseCard } from '@/components/experiment-course-card';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 E02(추천 코스)에 대응한다.
export default function RecommendedCoursesScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ExperimentRecommendationSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const data = await getExperimentRecommendations(accessToken);
        if (!cancelled) {
          setRecommendations(data);
        }
      } catch (error) {
        logger.error('experiment.recommended', 'failed to load recommendations', {
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
        <RecordScreenHeader title="추천 코스" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : recommendations.length > 0 ? (
            <View style={styles.stack}>
              {recommendations.map((recommendation) => (
                <View key={recommendation.recommendationId}>
                  <ExperimentCourseCard
                    program={recommendation.program}
                    recommendationId={recommendation.recommendationId}
                  />
                  <ThemedText type="small" themeColor="textTertiary" style={styles.reason}>
                    {recommendation.reasonText}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default">지금은 추천할 코스가 없어요.</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.emptyHint}>
                주제로 찾아보거나 나중에 다시 확인해 보세요.
              </ThemedText>
              <AppButton
                title="주제로 찾기"
                variant="ghost"
                style={styles.emptyButton}
                onPress={() => router.push('/experiment/topics')}
              />
            </ThemedView>
          )}
          <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
            추천은 제안일 뿐이에요. 넘어가도 아무 일도 일어나지 않아요.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.randomCard}>
            <ThemedText type="default">지금의 나를 가볍게 알아볼 코스를 대신 골라드릴까요?</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.randomHint}>
              같은 유형이 연속되지 않고, 첫날은 가볍게, 마지막 날은 회고로 구성돼요.
            </ThemedText>
            <View style={styles.randomButtons}>
              <AppButton
                title="3일 코스 받기"
                variant="ghost"
                style={styles.randomButton}
                onPress={() => router.push('/experiment/confirm?mode=random&durationDays=3')}
              />
              <AppButton
                title="7일 코스 받기"
                variant="ghost"
                style={styles.randomButton}
                onPress={() => router.push('/experiment/confirm?mode=random&durationDays=7')}
              />
            </View>
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
    paddingBottom: Spacing.five,
  },
  loading: {
    marginTop: Spacing.six,
  },
  stack: {
    gap: Spacing.four,
  },
  reason: {
    marginTop: Spacing.two,
  },
  empty: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyHint: {
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
  },
  note: {
    marginTop: Spacing.four,
    textAlign: 'center',
  },
  randomCard: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  randomHint: {
    marginTop: Spacing.two,
  },
  randomButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  randomButton: {
    flex: 1,
  },
});
