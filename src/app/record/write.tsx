import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createEntry, getTodayQuote, publishEntry } from '@/api';
import { ApiError } from '@/api/errors';
import type { QuoteSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { RECORD_PROMPTS, recordTypeOf } from '@/constants/record';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 프로토타입 R02(기록 작성)에 대응한다. "나로움의 정리 받기" 토글은 뺐다 — 이유는
// docs/notes/open-decisions.md 참고.
export default function RecordWriteScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const recordType = recordTypeOf(type);
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Math.random()은 render 함수 본문(useMemo 콜백 포함)에서 직접 호출할 수 없어(react-hooks/purity),
  // 컴포넌트 인스턴스당 한 번만 실행되는 useState 지연 초기화 함수 안에서 고른다.
  const [prompt] = useState<string>(() => RECORD_PROMPTS[Math.floor(Math.random() * RECORD_PROMPTS.length)]);

  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(recordType.id === 'QUOTE_REFLECTION');
  const [quoteError, setQuoteError] = useState(false);

  useEffect(() => {
    if (recordType.id !== 'QUOTE_REFLECTION') {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          router.replace('/(auth)/login');
          return;
        }
        const today = await getTodayQuote(accessToken);
        if (!cancelled) {
          setQuote(today);
        }
      } catch (error) {
        logger.error('record.write', 'failed to load today quote', {
          code: error instanceof ApiError ? error.code : undefined,
        });
        if (!cancelled) {
          setQuoteError(true);
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recordType.id]);

  const canSave = body.trim().length > 0 && !saving && !(recordType.id === 'QUOTE_REFLECTION' && !quote);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setErrorMessage(null);
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace('/(auth)/login');
        return;
      }
      const created = await createEntry(accessToken, {
        entryType: recordType.id,
        title: title.trim().length > 0 ? title.trim() : undefined,
        body: body.trim(),
        recordDate: todayIsoDate(),
        quoteId: recordType.id === 'QUOTE_REFLECTION' ? (quote?.id ?? undefined) : undefined,
        promptSnapshot: recordType.id === 'PROMPT' ? prompt : undefined,
      });
      await publishEntry(accessToken, created.id);
      router.replace({ pathname: '/record/reflection', params: { entryId: created.id } });
    } catch (error) {
      logger.error('record.write', 'failed to save entry', {
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
          <RecordScreenHeader
            title={recordType.name}
            right={
              <ThemedText
                type="smallBold"
                themeColor={canSave ? 'text' : 'textTertiary'}
                onPress={handleSave}>
                저장
              </ThemedText>
            }
          />

          {recordType.id === 'PROMPT' && (
            <ThemedView type="backgroundElement" style={styles.soft}>
              <ThemedText type="small" themeColor="textTertiary">
                오늘의 질문
              </ThemedText>
              <ThemedText type="heading" style={styles.promptText}>
                {prompt}
              </ThemedText>
            </ThemedView>
          )}

          {recordType.id === 'QUOTE_REFLECTION' && (
            <ThemedView type="backgroundElement" style={styles.soft}>
              {quoteLoading ? (
                <ActivityIndicator color={theme.textSecondary} />
              ) : quote ? (
                <ThemedText type="heading">{quote.text}</ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textTertiary">
                  {quoteError ? '오늘의 문장을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : ''}
                </ThemedText>
              )}
            </ThemedView>
          )}

          <TextInput
            style={[styles.field, { borderColor: theme.border, color: theme.text }]}
            placeholder="제목 (선택)"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.field, styles.bodyField, { borderColor: theme.border, color: theme.text }]}
            placeholder={recordType.placeholder}
            placeholderTextColor={theme.textTertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          {errorMessage && (
            <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
              {errorMessage}
            </ThemedText>
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
  soft: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  promptText: {
    marginTop: Spacing.one,
  },
  field: {
    marginTop: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  bodyField: {
    minHeight: 160,
  },
  error: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
});
