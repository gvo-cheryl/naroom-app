import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportAiGeneration } from '@/api';
import { ApiError } from '@/api/errors';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 X02(응답 신고)에 대응한다. 신고 사유 5개는 프로토타입에서 그대로 가져온
// 승인된 카피다(JUDGING/INAPPROPRIATE/RISKY/IRRELEVANT/ETC).
const REPORT_REASONS: { code: string; label: string }[] = [
  { code: 'JUDGING', label: '저를 단정하는 것처럼 느껴졌어요' },
  { code: 'INAPPROPRIATE', label: '부적절하거나 불쾌한 표현이 있었어요' },
  { code: 'RISKY', label: '위험하거나 해로운 내용이 있었어요' },
  { code: 'IRRELEVANT', label: '기록과 관계없는 내용이었어요' },
  { code: 'ETC', label: '그 밖의 이유' },
];

export default function RecordReportScreen() {
  const { generationRunId } = useLocalSearchParams<{ generationRunId: string }>();
  const theme = useTheme();

  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSend = reasonCode !== null && !sending;

  const handleSend = async () => {
    if (!canSend) {
      return;
    }
    setErrorMessage(null);
    setSending(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace('/(auth)/login');
        return;
      }
      await reportAiGeneration(accessToken, generationRunId, {
        reasonCode: reasonCode!,
        comment: comment.trim().length > 0 ? comment.trim() : undefined,
      });
      setSent(true);
    } catch (error) {
      logger.error('record.report', 'failed to send report', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('신고를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="응답 신고" />

          {sent ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              신고를 보냈어요. 기록은 그대로 남아 있어요.
            </ThemedText>
          ) : (
            <>
              <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
                어떤 점이 불편했는지 알려주시면 검토에 반영할게요. 신고해도 기록은 그대로 남아요.
              </ThemedText>

              <View style={styles.stack}>
                {REPORT_REASONS.map((reason) => (
                  <Pressable
                    key={reason.code}
                    onPress={() => setReasonCode(reason.code)}
                    style={[
                      styles.option,
                      { borderColor: reasonCode === reason.code ? theme.text : theme.border },
                      reasonCode === reason.code && styles.optionOn,
                    ]}>
                    <ThemedText type="default">{reason.label}</ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText type="default" style={styles.commentHeading}>
                덧붙이고 싶은 말 (선택)
              </ThemedText>
              <TextInput
                style={[styles.field, { borderColor: theme.border, color: theme.text }]}
                placeholder="어떤 부분이 그렇게 느껴졌는지 적어주셔도 좋아요."
                placeholderTextColor={theme.textTertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
              />

              {errorMessage && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
                  {errorMessage}
                </ThemedText>
              )}

              <AppButton title="신고 보내기" style={styles.sendButton} onPress={handleSend} disabled={!canSend} />
            </>
          )}

          <AppButton
            title={sent ? '돌아가기' : '취소'}
            variant="quiet"
            onPress={() => router.back()}
          />
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
  lead: {
    marginTop: Spacing.one,
  },
  stack: {
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
  commentHeading: {
    marginTop: Spacing.four,
  },
  field: {
    marginTop: Spacing.two,
    minHeight: 80,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 14,
  },
  error: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  sendButton: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
});
