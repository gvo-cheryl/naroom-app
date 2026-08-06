import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActiveExperimentProgram, getEmotionTagTopics, recordExperimentMission } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentActiveProgramSummary, ExperimentAttemptStatus, TagSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { LevelSlider } from '@/components/level-slider';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { ENERGY_LABELS } from '@/constants/checkin';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const ATTEMPT_OPTIONS: { id: ExperimentAttemptStatus; label: string }[] = [
  { id: 'DONE', label: '해봤어요' },
  { id: 'PARTIALLY_DONE', label: '조금 해봤어요' },
  { id: 'RESTED', label: '오늘은 쉬었어요' },
  { id: 'TRIED_DIFFERENTLY', label: '다른 방식으로 해봤어요' },
  { id: 'NOT_A_FIT', label: '지금은 나와 맞지 않았어요' },
  { id: 'RECORD_ONLY', label: '기록만 남길래요' },
];

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 프로토타입 E09(오늘의 기록)에 대응한다. Beta 1 미션 기록에는 감정 강도 필드가 없어(체크인과
// 달리 에너지만 있음) 에너지 게이지만 넣는다.
export default function ExperimentRecordMissionScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentActiveProgramSummary | null>(null);
  const [emotionTags, setEmotionTags] = useState<TagSummary[]>([]);

  const [attempt, setAttempt] = useState<ExperimentAttemptStatus | null>(null);
  const [body, setBody] = useState('');
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<Set<string>>(new Set());
  const [energy, setEnergy] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const [active, topics] = await Promise.all([
          getActiveExperimentProgram(accessToken),
          getEmotionTagTopics(accessToken),
        ]);
        if (!cancelled) {
          setProgram(active);
          setEmotionTags(topics.flatMap((topic) => topic.tags).slice(0, 12));
        }
      } catch (error) {
        logger.error('experiment.record', 'failed to load record form', {
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

  const toggleEmotion = (tag: TagSummary) => {
    setSelectedEmotionIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.id)) {
        next.delete(tag.id);
      } else {
        next.add(tag.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!program?.todayMission || saving) {
      return;
    }
    if (!attempt) {
      setErrorMessage('오늘 어떻게 했는지 하나만 골라주세요.');
      return;
    }
    setErrorMessage(null);
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      const trimmedBody = body.trim();
      if (attempt === 'RESTED') {
        await recordExperimentMission(accessToken, program.userExperimentProgramId, program.todayMission.userProgramMissionId, {
          attemptStatus: 'RESTED',
          recordDate: todayIsoDate(),
          reflection: trimmedBody.length > 0 ? trimmedBody : undefined,
        });
      } else {
        await recordExperimentMission(accessToken, program.userExperimentProgramId, program.todayMission.userProgramMissionId, {
          attemptStatus: attempt,
          recordDate: todayIsoDate(),
          responseText: trimmedBody.length > 0 ? trimmedBody : undefined,
          emotionTagIds: Array.from(selectedEmotionIds),
          energyLevel: energy ?? undefined,
          createLifeTimeEntry: true,
        });
      }
      router.replace('/(app)/challenge');
    } catch (error) {
      logger.error('experiment.record', 'failed to save mission record', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <RecordScreenHeader title="오늘의 기록" />

          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : !program || !program.todayMission ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default">진행 중인 코스가 없어요.</ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedView type="backgroundSelected" style={styles.missionCard}>
                <ThemedText type="small" themeColor="textTertiary">
                  Day {program.todayMission.dayNumber}
                </ThemedText>
                <ThemedText type="default" style={styles.missionTitle}>
                  {program.todayMission.title}
                </ThemedText>
              </ThemedView>

              <SectionHeading
                icon={{ ios: 'checkmark.circle', android: 'check_circle' }}
                title="오늘은 어떻게 하셨나요?"
                style={styles.sectionHeading}
              />
              <View style={styles.attemptOptions}>
                {ATTEMPT_OPTIONS.map((option) => {
                  const selected = attempt === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setAttempt(option.id)}
                      style={[
                        styles.attemptOption,
                        { borderColor: theme.border },
                        selected && { backgroundColor: theme.text, borderColor: theme.text },
                      ]}>
                      <ThemedText type="small" style={{ color: selected ? theme.background : theme.textSecondary }}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <SectionHeading icon={{ ios: 'pencil', android: 'edit' }} title="짧은 회고" style={styles.sectionHeading} />
              {program.todayMission.reflectionQuestions.length > 0 && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.questionsHint}>
                  {program.todayMission.reflectionQuestions.join(' · ')}
                </ThemedText>
              )}
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="한 줄이어도 괜찮아요. 비워두어도 돼요."
                placeholderTextColor={theme.textTertiary}
                multiline
                style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
              />

              {attempt !== 'RESTED' && (
                <>
                  {emotionTags.length > 0 && (
                    <>
                      <SectionHeading
                        icon={{ ios: 'heart', android: 'favorite' }}
                        title="지금의 감정 (선택)"
                        style={styles.sectionHeading}
                      />
                      <View style={styles.chips}>
                        {emotionTags.map((tag) => {
                          const selected = selectedEmotionIds.has(tag.id);
                          return (
                            <Pressable
                              key={tag.id}
                              onPress={() => toggleEmotion(tag)}
                              style={[
                                styles.chip,
                                { borderColor: theme.border },
                                selected && { backgroundColor: theme.text, borderColor: theme.text },
                              ]}>
                              <ThemedText type="small" style={{ color: selected ? theme.background : theme.textSecondary }}>
                                {tag.name}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <LevelSlider
                    icon={{ ios: 'bolt', android: 'bolt' }}
                    title="지금의 에너지 (선택)"
                    levels={ENERGY_LABELS}
                    value={energy}
                    onChange={setEnergy}
                    color={theme.moss}
                  />
                </>
              )}

              {errorMessage && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
                  {errorMessage}
                </ThemedText>
              )}

              <AppButton title="기록 남기기" loading={saving} style={styles.saveButton} onPress={handleSave} />
              <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
                ‘성공’이나 ‘실패’ 대신 시도한 방식과 그때의 조건을 남겨요.
              </ThemedText>
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
  missionCard: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  missionTitle: {
    marginTop: Spacing.one,
  },
  sectionHeading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  attemptOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  attemptOption: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  questionsHint: {
    marginBottom: Spacing.two,
  },
  textArea: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
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
  error: {
    marginTop: Spacing.three,
  },
  saveButton: {
    marginTop: Spacing.five,
  },
  note: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
});
