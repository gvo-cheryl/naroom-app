import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeExperimentCourseReview, getActiveExperimentProgram } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentActiveProgramSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const CONTINUE_ACTIONS = ['비슷한 코스 이어보기', '다른 주제 시작하기', '한 가지 행동만 유지하기', '지금은 여기까지'];

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// 프로토타입 E12(코스 돌아보기)에 대응한다. 일차별 미션 제목을 조회할 API가 없어(E10과 같은 이유)
// "가장 기억에 남은 미션" 같은 칩은 미션 제목 대신 일반적인 Day 1/2/3 라벨로 대체한다.
export default function ExperimentReviewScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentActiveProgramSummary | null>(null);

  const [mostMemorableDay, setMostMemorableDay] = useState<number | null>(null);
  const [leastBurdensomeDay, setLeastBurdensomeDay] = useState<number | null>(null);
  const [notFitDay, setNotFitDay] = useState<number | null>(null);
  const [helpfulConditions, setHelpfulConditions] = useState('');
  const [difficultConditions, setDifficultConditions] = useState('');
  const [discovery, setDiscovery] = useState('');
  const [continueAction, setContinueAction] = useState<string | null>(null);
  const [requestAiReflection, setRequestAiReflection] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const active = await getActiveExperimentProgram(accessToken);
        if (!cancelled) {
          setProgram(active);
        }
      } catch (error) {
        logger.error('experiment.review', 'failed to load program for review', {
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

  const handleSave = async () => {
    if (!program || saving) {
      return;
    }
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await completeExperimentCourseReview(accessToken, program.userExperimentProgramId, {
        mostMemorableDay: mostMemorableDay ?? undefined,
        leastBurdensomeDay: leastBurdensomeDay ?? undefined,
        notFitDay: notFitDay ?? undefined,
        helpfulConditions: splitLines(helpfulConditions),
        difficultConditions: splitLines(difficultConditions),
        discovery: discovery.trim().length > 0 ? discovery.trim() : undefined,
        continueAction: continueAction ?? undefined,
        requestAiReflection: program.durationDays === 3 ? requestAiReflection : undefined,
      });
      setSaved(true);
    } catch (error) {
      logger.error('experiment.review', 'failed to save course review', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const dayNumbers = program ? Array.from({ length: program.durationDays }, (_, i) => i + 1) : [];

  const renderDayChips = (selected: number | null, onSelect: (day: number | null) => void) => (
    <View style={styles.chips}>
      {dayNumbers.map((day) => {
        const isSelected = selected === day;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(isSelected ? null : day)}
            style={[
              styles.chip,
              { borderColor: theme.border },
              isSelected && { backgroundColor: theme.text, borderColor: theme.text },
            ]}>
            <ThemedText type="small" style={{ color: isSelected ? theme.background : theme.textSecondary }}>
              Day {day}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );

  if (saved) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <RecordScreenHeader title="돌아보기 완료" />
            <ThemedText type="heading" style={styles.doneHeading}>
              돌아보기를{'\n'}저장했어요
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.doneNote}>
              지금까지의 기록은 LifeTime에 그대로 남아요.
            </ThemedText>
            <AppButton
              title="작은 실험 홈으로"
              style={styles.doneButton}
              onPress={() => router.replace('/(app)/challenge')}
            />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <RecordScreenHeader title="코스 돌아보기" />

          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : !program ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default">돌아볼 코스가 없어요.</ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedText type="heading" style={styles.title}>
                {program.title}{'\n'}돌아보기
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
                {program.durationDays}개의 작은 실험 중 {program.lookedAtMissionCount}개를 살펴봤어요.
              </ThemedText>

              <SectionHeading icon={{ ios: 'star', android: 'star' }} title="가장 기억에 남은 미션" style={styles.sectionHeading} />
              {renderDayChips(mostMemorableDay, setMostMemorableDay)}

              <SectionHeading
                icon={{ ios: 'leaf', android: 'eco' }}
                title="가장 부담이 적었던 미션"
                style={styles.sectionHeading}
              />
              {renderDayChips(leastBurdensomeDay, setLeastBurdensomeDay)}

              <SectionHeading icon={{ ios: 'xmark.circle', android: 'cancel' }} title="나와 잘 맞지 않았던 미션" style={styles.sectionHeading} />
              {renderDayChips(notFitDay, setNotFitDay)}

              <SectionHeading icon={{ ios: 'pencil', android: 'edit' }} title="도움이 된 조건" style={styles.sectionHeading} />
              <TextInput
                value={helpfulConditions}
                onChangeText={setHelpfulConditions}
                placeholder="예: 시간을 정해두었을 때"
                placeholderTextColor={theme.textTertiary}
                multiline
                style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
              />

              <SectionHeading icon={{ ios: 'pencil', android: 'edit' }} title="어려웠던 조건" style={styles.sectionHeading} />
              <TextInput
                value={difficultConditions}
                onChangeText={setDifficultConditions}
                placeholder="예: 저녁에는 에너지가 남지 않았음"
                placeholderTextColor={theme.textTertiary}
                multiline
                style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
              />

              <SectionHeading
                icon={{ ios: 'lightbulb', android: 'lightbulb' }}
                title="새롭게 알게 된 점을 한 문장으로"
                style={styles.sectionHeading}
              />
              <TextInput
                value={discovery}
                onChangeText={setDiscovery}
                placeholder="나의 언어로"
                placeholderTextColor={theme.textTertiary}
                multiline
                style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
              />

              <SectionHeading icon={{ ios: 'arrow.right', android: 'arrow_forward' }} title="이 다음은" style={styles.sectionHeading} />
              <View style={styles.stack}>
                {CONTINUE_ACTIONS.map((action) => {
                  const selected = continueAction === action;
                  return (
                    <Pressable
                      key={action}
                      onPress={() => setContinueAction(selected ? null : action)}
                      style={[
                        styles.optionRow,
                        { borderColor: theme.border },
                        selected && { backgroundColor: theme.backgroundSelected },
                      ]}>
                      <ThemedText type="default">{action}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {program.durationDays === 3 && (
                <Pressable
                  onPress={() => setRequestAiReflection((prev) => !prev)}
                  style={[styles.optionRow, { borderColor: theme.border, marginTop: Spacing.four }, requestAiReflection && { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="default">AI 회고도 함께 받아볼까요?</ThemedText>
                </Pressable>
              )}

              <AppButton title="돌아보기 저장하기" loading={saving} style={styles.saveButton} onPress={handleSave} />
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
  empty: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  title: {
    marginTop: Spacing.two,
  },
  lead: {
    marginTop: Spacing.two,
  },
  sectionHeading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  textArea: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  stack: {
    gap: Spacing.two,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  saveButton: {
    marginTop: Spacing.five,
  },
  doneHeading: {
    marginTop: Spacing.four,
  },
  doneNote: {
    marginTop: Spacing.two,
  },
  doneButton: {
    marginTop: Spacing.five,
  },
});
