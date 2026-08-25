import { StyleSheet, View } from "react-native";

import type { ExperimentProgramDetailSummary } from "@/api/types";
import { missionTypeLabel } from "@/constants/experiment";
import { Radius, Spacing } from "@/constants/theme";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

interface ExperimentProgramDetailCardProps {
  program: ExperimentProgramDetailSummary;
}

// experiment/[programId].tsx(실기기·앱)와 미리보기 화면(preview/experiment-program.tsx) 양쪽에서
// 재사용한다. 시작하기 등 진행 상태를 만드는 액션은 각 화면이 직접 렌더링한다 - 미리보기는
// synthetic member 상태가 없어 시작 자체가 불가능하다.
export function ExperimentProgramDetailCard({ program }: ExperimentProgramDetailCardProps) {
  return (
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
    </>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
});
