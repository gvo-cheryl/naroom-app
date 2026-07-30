import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { submitAiFeedback, confirmAiFeedbackLongTerm } from '@/api';
import { ApiError } from '@/api/errors';
import type { AiFeedbackHelpfulness } from '@/api/types';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { Radius, MaxContentWidth, Spacing } from '@/constants/theme';
import { AI_REFLECTION_TERMINAL_STATUSES, useAiReflectionPoll } from '@/hooks/use-ai-reflection-poll';
import { getValidAccessToken } from '@/auth/authManager';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const HELPFULNESS_OPTIONS: { id: AiFeedbackHelpfulness; label: string }[] = [
  { id: 'HELPFUL', label: '도움됐어요' },
  { id: 'SOMEWHAT_UNHELPFUL', label: '조금 아쉬웠어요' },
  { id: 'UNHELPFUL', label: '도움 안 됐어요' },
];

// 프로토타입 R03(나로움의 정리)에 대응한다. helpfulness 기반 만족도·장기 반영 확인은
// R03의 원래 AGREE/DIFF/UNSURE 카피가 아니라 이후 승인된 5-D 계약(§15.4)을 따른다.
export default function RecordReflectionScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const theme = useTheme();
  const { reflection, loading, timedOut } = useAiReflectionPoll(entryId);

  const [helpfulness, setHelpfulness] = useState<AiFeedbackHelpfulness | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [longTermChoice, setLongTermChoice] = useState<boolean | null>(null);

  const status = reflection?.status ?? null;
  const generationRunId = reflection?.generationRunId ?? null;
  const isTerminal = status !== null && AI_REFLECTION_TERMINAL_STATUSES.includes(status);
  const hasContent = isTerminal && status !== 'FAILED' && !!reflection?.reflectionText;

  const goToTags = () => router.replace({ pathname: '/record/tags', params: { entryId } });

  const handleSelectHelpfulness = async (value: AiFeedbackHelpfulness) => {
    if (!generationRunId || submittingFeedback) {
      return;
    }
    setHelpfulness(value);
    setSubmittingFeedback(true);
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await submitAiFeedback(accessToken, generationRunId, { helpfulness: value });
      }
    } catch (error) {
      logger.error('record.reflection', 'failed to submit feedback', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitReason = async () => {
    if (!generationRunId || !helpfulness || customReason.trim().length === 0) {
      return;
    }
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await submitAiFeedback(accessToken, generationRunId, { helpfulness, customReason: customReason.trim() });
      }
    } catch (error) {
      logger.error('record.reflection', 'failed to submit feedback reason', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  const handleLongTerm = async (applyLongTerm: boolean) => {
    if (!generationRunId) {
      return;
    }
    setLongTermChoice(applyLongTerm);
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await confirmAiFeedbackLongTerm(accessToken, generationRunId, applyLongTerm);
      }
    } catch (error) {
      logger.error('record.reflection', 'failed to confirm long-term application', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader
            title="나로움의 정리"
            right={
              generationRunId ? (
                <ThemedText
                  type="small"
                  themeColor="textTertiary"
                  onPress={() => router.push({ pathname: '/record/report', params: { generationRunId } })}>
                  신고
                </ThemedText>
              ) : undefined
            }
          />

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : status === null ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              이 기록은 정리 없이 저장했어요.
            </ThemedText>
          ) : !isTerminal ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small" themeColor="textTertiary">
                기록에서 살펴보는 중이에요
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.waitHint}>
                글은 이미 저장됐어요. 기다리지 않고 나가도 기록은 그대로 남아요.
              </ThemedText>
              <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
              {timedOut && (
                <ThemedText type="small" themeColor="textTertiary">
                  생각보다 오래 걸리고 있어요. 나중에 이 기록에서 다시 확인할 수 있어요.
                </ThemedText>
              )}
            </ThemedView>
          ) : status === 'FAILED' ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              지금은 정리를 받아오지 못했어요. 기록은 안전하게 저장됐어요.
            </ThemedText>
          ) : hasContent ? (
            <>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="default">{reflection?.reflectionText}</ThemedText>
                {reflection?.reflectionQuestion && (
                  <>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <ThemedText type="small" themeColor="textTertiary">
                      함께 생각해볼 질문
                    </ThemedText>
                    <ThemedText type="heading" style={styles.question}>
                      {reflection.reflectionQuestion}
                    </ThemedText>
                  </>
                )}
              </ThemedView>

              <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
                위 내용은 사실이나 진단이 아니에요. 어긋난다고 느껴지면 그대로 두어도 괜찮아요.
              </ThemedText>

              <View style={styles.optionStack}>
                {HELPFULNESS_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => handleSelectHelpfulness(option.id)}
                    style={[
                      styles.option,
                      { borderColor: helpfulness === option.id ? theme.text : theme.border },
                      helpfulness === option.id && styles.optionOn,
                    ]}>
                    <ThemedText type="default">{option.label}</ThemedText>
                  </Pressable>
                ))}
              </View>

              {helpfulness && helpfulness !== 'HELPFUL' && (
                <View style={styles.reasonRow}>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                    placeholder="왜 아쉬웠는지 적어주시면 도움이 돼요 (선택)"
                    placeholderTextColor={theme.textTertiary}
                    value={customReason}
                    onChangeText={setCustomReason}
                    onSubmitEditing={handleSubmitReason}
                  />
                </View>
              )}

              {helpfulness && (
                <View style={styles.section}>
                  <ThemedText type="small" themeColor="textTertiary">
                    이 의견을 다음 회고에도 반영할까요?
                  </ThemedText>
                  <View style={styles.row}>
                    <Pressable
                      onPress={() => handleLongTerm(true)}
                      style={[
                        styles.chip,
                        { borderColor: longTermChoice === true ? theme.text : theme.border },
                      ]}>
                      <ThemedText type="small">반영할게요</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleLongTerm(false)}
                      style={[
                        styles.chip,
                        { borderColor: longTermChoice === false ? theme.text : theme.border },
                      ]}>
                      <ThemedText type="small">반영 안 할게요</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}

              <AppButton
                title="내 생각 덧붙이기"
                variant="ghost"
                style={styles.noteButton}
                onPress={() => router.push({ pathname: '/record/reflection-note', params: { entryId } })}
              />
            </>
          ) : null}

          <AppButton title="키워드 확인하기" style={styles.continueButton} onPress={goToTags} />
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
    marginTop: Spacing.three,
  },
  lead: {
    marginTop: Spacing.three,
  },
  card: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  waitHint: {
    marginTop: Spacing.half,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  question: {
    marginTop: Spacing.half,
  },
  note: {
    marginTop: Spacing.two,
  },
  optionStack: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  optionOn: {
    borderWidth: 1.5,
  },
  reasonRow: {
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  section: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  noteButton: {
    marginTop: Spacing.three,
  },
  continueButton: {
    marginTop: Spacing.three,
  },
});
