import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { submitInquiry } from '@/api';
import { ApiError } from '@/api/errors';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const CONTENT_MAX_LENGTH = 2000;

export default function InquiryScreen() {
  const theme = useTheme();

  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSend = content.trim().length > 0 && !sending;

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
      await submitInquiry(accessToken, content.trim());
      setSent(true);
    } catch (error) {
      logger.error('inquiry.index', 'failed to submit inquiry', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="문의하기" />

          {sent ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              문의를 보냈어요. 확인 후 답변드릴게요.
            </ThemedText>
          ) : (
            <>
              <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
                궁금한 점이나 불편한 점을 알려주세요.
              </ThemedText>

              <TextInput
                style={[styles.field, { borderColor: theme.border, color: theme.text }]}
                placeholder="문의 내용을 입력해 주세요."
                placeholderTextColor={theme.textTertiary}
                value={content}
                onChangeText={(text) => setContent(text.slice(0, CONTENT_MAX_LENGTH))}
                multiline
                textAlignVertical="top"
              />
              <ThemedText type="small" themeColor="textTertiary" style={styles.counter}>
                {content.length} / {CONTENT_MAX_LENGTH}
              </ThemedText>

              {errorMessage && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
                  {errorMessage}
                </ThemedText>
              )}

              <AppButton
                title={sending ? '보내는 중…' : '문의 보내기'}
                loading={sending}
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!canSend}
              />
            </>
          )}

          <AppButton title={sent ? '돌아가기' : '취소'} variant="quiet" onPress={() => router.back()} />
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
  field: {
    marginTop: Spacing.three,
    minHeight: 160,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 14,
  },
  counter: {
    marginTop: Spacing.one,
    textAlign: 'right',
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
