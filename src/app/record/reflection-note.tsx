import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSelfReflection } from '@/api';
import { ApiError } from '@/api/errors';
import { getValidAccessToken } from '@/auth/authManager';
import { CharCounter } from '@/components/char-counter';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// naroom-api ai-policy-architecture.md §4: 생각 덧붙이기·자기정리 상한.
const CONTENT_MAX_LENGTH = 1000;

// 프로토타입 R04(내 생각 추가)에 대응한다. AI 정리와 분리해서 저장되고 LifeTime에서도
// "나의 생각"으로 따로 보인다(entry_self_reflections).
export default function RecordReflectionNoteScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const theme = useTheme();

  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = content.trim().length > 0 && !saving;

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
      await createSelfReflection(accessToken, entryId, { content: content.trim() });
      router.replace({ pathname: '/record/tags', params: { entryId } });
    } catch (error) {
      logger.error('record.reflection-note', 'failed to save self reflection', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <RecordScreenHeader title="내 생각 추가" />
          <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
            이 기록을 다시 보니 나는 어떻게 느껴지나요?
          </ThemedText>
          <TextInput
            style={[styles.field, { borderColor: theme.border, color: theme.text }]}
            placeholder="AI의 정리와 다르게 느껴진 부분이 있다면 그대로 적어도 좋아요."
            placeholderTextColor={theme.textTertiary}
            value={content}
            onChangeText={setContent}
            maxLength={CONTENT_MAX_LENGTH}
            multiline
            textAlignVertical="top"
          />
          <CharCounter length={content.length} max={CONTENT_MAX_LENGTH} style={styles.charCounter} />
          <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
            여기에 적은 내용은 AI 응답과 분리해서 저장돼요.
          </ThemedText>

          {errorMessage && (
            <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
              {errorMessage}
            </ThemedText>
          )}

          <AppButton title="저장하고 태그 확인하기" style={styles.saveButton} onPress={handleSave} disabled={!canSave} />
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
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  charCounter: {
    marginTop: Spacing.one,
    textAlign: 'right',
  },
  note: {
    marginTop: Spacing.two,
  },
  error: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: Spacing.four,
  },
});
