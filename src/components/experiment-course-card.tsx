import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import type { ExperimentProgramSummary } from '@/api/types';

interface ExperimentCourseCardProps {
  program: ExperimentProgramSummary;
  topicName?: string;
  recommendationId?: string;
}

// 프로토타입 courseCard()에 대응한다. 탭하면 코스 상세(E04)로 이동한다.
export function ExperimentCourseCard({ program, topicName, recommendationId }: ExperimentCourseCardProps) {
  const minutesLabel =
    program.estimatedMinutesMin === program.estimatedMinutesMax
      ? `${program.estimatedMinutesMin}분`
      : `${program.estimatedMinutesMin}~${program.estimatedMinutesMax}분`;
  const metaParts = [topicName, `미션 ${program.missionCount}개`, `하루 ${minutesLabel} 안팎`].filter(Boolean);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/experiment/[programId]',
          params: recommendationId ? { programId: program.programId, recommendationId } : { programId: program.programId },
        })
      }>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.between}>
          <ThemedText type="smallBold" style={styles.title}>
            {program.title}
          </ThemedText>
          <ThemedView type="backgroundSelected" style={styles.pill}>
            <ThemedText type="small" themeColor="textSecondary">
              {program.durationDays}일
            </ThemedText>
          </ThemedView>
        </View>
        <ThemedText type="small" themeColor="textTertiary" style={styles.description}>
          {program.description}
        </ThemedText>
        <ThemedText type="small" themeColor="textTertiary" style={styles.meta}>
          {metaParts.join(' · ')}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  pill: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  description: {
    marginTop: Spacing.two,
  },
  meta: {
    marginTop: Spacing.two,
  },
});
