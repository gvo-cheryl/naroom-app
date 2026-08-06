import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExperimentPrograms, getExperimentTopics } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentProgramSummary, ExperimentTopicSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { ExperimentCourseCard } from '@/components/experiment-course-card';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 E03(주제별 코스)에 대응한다.
export default function ExperimentTopicsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<ExperimentTopicSummary[]>([]);
  const [programs, setPrograms] = useState<ExperimentProgramSummary[]>([]);
  const [selectedTopicCode, setSelectedTopicCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const [topicList, programList] = await Promise.all([
          getExperimentTopics(accessToken),
          getExperimentPrograms(accessToken),
        ]);
        if (!cancelled) {
          setTopics(topicList);
          setPrograms(programList);
        }
      } catch (error) {
        logger.error('experiment.topics', 'failed to load topics', {
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

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.code === selectedTopicCode) ?? null,
    [topics, selectedTopicCode],
  );
  const filteredPrograms = useMemo(
    () => (selectedTopicCode ? programs.filter((program) => program.topicCode === selectedTopicCode) : []),
    [programs, selectedTopicCode],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <RecordScreenHeader title="주제별 코스" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : (
            <>
              <View style={styles.chips}>
                {topics.map((topic) => {
                  const selected = topic.code === selectedTopicCode;
                  return (
                    <Pressable
                      key={topic.id}
                      onPress={() => setSelectedTopicCode(selected ? null : topic.code)}
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

              {!selectedTopic ? (
                <ThemedView type="backgroundElement" style={styles.empty}>
                  <ThemedText type="default">관심 있는 주제를 하나 골라보세요.</ThemedText>
                </ThemedView>
              ) : filteredPrograms.length > 0 ? (
                <View style={styles.stack}>
                  {filteredPrograms.map((program) => (
                    <ExperimentCourseCard key={program.programId} program={program} topicName={selectedTopic.name} />
                  ))}
                </View>
              ) : (
                <ThemedView type="backgroundElement" style={styles.empty}>
                  <ThemedText type="default">이 주제의 코스는 준비 중이에요.</ThemedText>
                </ThemedView>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  stack: {
    gap: Spacing.two,
  },
  empty: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
});
