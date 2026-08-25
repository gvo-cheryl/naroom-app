import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExperimentProgramDetail } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentProgramDetailSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { ExperimentProgramDetailCard } from '@/components/experiment-program-detail';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
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
              <ExperimentProgramDetailCard program={program} />

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
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
});
