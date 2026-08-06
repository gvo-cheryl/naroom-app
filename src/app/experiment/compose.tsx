import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activateSavedExperimentProgram, createUserComposedExperimentProgram } from '@/api';
import { ApiError } from '@/api/errors';
import type { ExperimentMissionType } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MISSION_TYPE_OPTIONS } from '@/constants/experiment';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const ACTIVE_PROGRAM_EXISTS_CODE = 'EXPERIMENT_ACTIVE_PROGRAM_EXISTS';
const DEFAULT_ESTIMATED_MINUTES = 5;

interface MissionDraft {
  title: string;
  instruction: string;
  missionType: ExperimentMissionType;
  estimatedMinutes: string;
}

function emptyMission(): MissionDraft {
  return { title: '', instruction: '', missionType: 'OBSERVATION', estimatedMinutes: String(DEFAULT_ESTIMATED_MINUTES) };
}

// 직접 만들기(사용자 구성 코스). 프로토타입에 화면이 없어 기존 화면들의 패턴(체크인의 여러 섹션
// 스크롤 폼, E05의 시작하기/저장하기·활성 코스 충돌 시트)을 따라 새로 설계했다. 3일 또는 7일 동안
// 서로 다른 미션을 직접 채운다(§설계 문서: "하나의 행동 반복이 아니라 일별로 서로 다른 미션").
export default function ExperimentComposeScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState<3 | 7>(3);
  const [missions, setMissions] = useState<MissionDraft[]>([emptyMission(), emptyMission(), emptyMission()]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingProgramId, setPendingProgramId] = useState<string | null>(null);

  const handleDurationChange = (next: 3 | 7) => {
    setDurationDays(next);
    setMissions((prev) => {
      if (next > prev.length) {
        return [...prev, ...Array.from({ length: next - prev.length }, emptyMission)];
      }
      return prev.slice(0, next);
    });
  };

  const updateMission = (index: number, patch: Partial<MissionDraft>) => {
    setMissions((prev) => prev.map((mission, i) => (i === index ? { ...mission, ...patch } : mission)));
  };

  const validate = (): string | null => {
    if (title.trim().length === 0) {
      return '코스 이름을 적어주세요.';
    }
    for (let i = 0; i < missions.length; i += 1) {
      const mission = missions[i];
      if (mission.title.trim().length === 0 || mission.instruction.trim().length === 0) {
        return `Day ${i + 1} 미션의 제목과 안내문을 채워주세요.`;
      }
      if (!(Number(mission.estimatedMinutes) > 0)) {
        return `Day ${i + 1}의 예상 시간은 1분 이상이어야 해요.`;
      }
    }
    return null;
  };

  const submit = async (action: 'start' | 'save', replaceActiveProgram = false) => {
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }

      let userExperimentProgramId = pendingProgramId;
      if (!userExperimentProgramId) {
        const created = await createUserComposedExperimentProgram(accessToken, {
          title: title.trim(),
          durationDays,
          missions: missions.map((mission, index) => ({
            dayNumber: index + 1,
            title: mission.title.trim(),
            instruction: mission.instruction.trim(),
            missionType: mission.missionType,
            estimatedMinutes: Number(mission.estimatedMinutes),
          })),
        });
        userExperimentProgramId = created.userExperimentProgramId;
        setPendingProgramId(userExperimentProgramId);
      }

      if (action === 'save') {
        router.replace('/(app)/challenge');
        return;
      }

      await activateSavedExperimentProgram(accessToken, userExperimentProgramId, replaceActiveProgram);
      setConflictOpen(false);
      router.replace('/(app)/challenge');
    } catch (error) {
      if (error instanceof ApiError && error.code === ACTIVE_PROGRAM_EXISTS_CODE && action === 'start') {
        setConflictOpen(true);
        return;
      }
      logger.error('experiment.compose', 'failed to create or start user-composed course', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('코스를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <RecordScreenHeader title="직접 만들기" />
          <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
            나만의 작은 실험을 만들어보세요. 완벽하지 않아도 괜찮아요.
          </ThemedText>

          <SectionHeading icon={{ ios: 'pencil', android: 'edit' }} title="코스 이름" style={styles.sectionHeading} />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="예: 퇴근 뒤 마음 정리해보기"
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />

          <SectionHeading icon={{ ios: 'calendar', android: 'calendar_today' }} title="기간" style={styles.sectionHeading} />
          <View style={styles.durationRow}>
            {([3, 7] as const).map((option) => {
              const selected = durationDays === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => handleDurationChange(option)}
                  style={[
                    styles.durationOption,
                    { borderColor: theme.border },
                    selected && { backgroundColor: theme.text, borderColor: theme.text },
                  ]}>
                  <ThemedText type="default" style={{ color: selected ? theme.background : theme.text }}>
                    {option}일
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <SectionHeading icon={{ ios: 'leaf', android: 'eco' }} title="일별 미션" style={styles.sectionHeading} />
          <ThemedText type="small" themeColor="textTertiary" style={styles.missionHint}>
            기간에 맞게 서로 다른 미션을 채워보세요.
          </ThemedText>
          <View style={styles.stack}>
            {missions.map((mission, index) => (
              <ThemedView key={index} type="backgroundElement" style={styles.missionCard}>
                <ThemedText type="small" themeColor="textTertiary">
                  Day {index + 1}
                </ThemedText>
                <TextInput
                  value={mission.title}
                  onChangeText={(value) => updateMission(index, { title: value })}
                  placeholder="미션 제목"
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.input, styles.missionField, { borderColor: theme.border, color: theme.text }]}
                />
                <TextInput
                  value={mission.instruction}
                  onChangeText={(value) => updateMission(index, { instruction: value })}
                  placeholder="무엇을 해볼까요?"
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  style={[styles.textArea, styles.missionField, { borderColor: theme.border, color: theme.text }]}
                />
                <View style={[styles.chips, styles.missionField]}>
                  {MISSION_TYPE_OPTIONS.map((option) => {
                    const selected = mission.missionType === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => updateMission(index, { missionType: option.id })}
                        style={[
                          styles.chip,
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
                <View style={[styles.minutesRow, styles.missionField]}>
                  <ThemedText type="small" themeColor="textTertiary">
                    예상 시간(분)
                  </ThemedText>
                  <TextInput
                    value={mission.estimatedMinutes}
                    onChangeText={(value) => updateMission(index, { estimatedMinutes: value.replace(/[^0-9]/g, '') })}
                    keyboardType="number-pad"
                    style={[styles.minutesInput, { borderColor: theme.border, color: theme.text }]}
                  />
                </View>
              </ThemedView>
            ))}
          </View>

          {errorMessage && (
            <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
              {errorMessage}
            </ThemedText>
          )}

          <View style={styles.actions}>
            <AppButton title="이대로 시작하기" loading={submitting} onPress={() => submit('start')} />
            <AppButton
              title="저장해두고 나중에 시작하기"
              variant="ghost"
              disabled={submitting}
              onPress={() => submit('save')}
            />
          </View>
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
                  onPress={() => submit('start', true)}
                />
              </View>
              <ThemedText type="small" themeColor="textTertiary" style={styles.sheetNote}>
                지금 만든 코스는 저장돼 있으니 언제든 다시 시작할 수 있어요.
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
  lead: {
    marginTop: Spacing.two,
  },
  sectionHeading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  durationOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  missionHint: {
    marginBottom: Spacing.two,
  },
  stack: {
    gap: Spacing.three,
  },
  missionCard: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  missionField: {
    marginTop: Spacing.two,
  },
  textArea: {
    minHeight: 72,
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
  minutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minutesInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    textAlign: 'right',
  },
  error: {
    marginTop: Spacing.four,
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
