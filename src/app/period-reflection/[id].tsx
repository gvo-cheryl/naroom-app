import { useLocalSearchParams } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSelfReflection, getSelfReflections, updateSelfReflection } from '@/api';
import { ApiError } from '@/api/errors';
import type { EntrySelfReflectionSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { periodReflectionFeatureTypeLabel } from '@/constants/lifetime';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { AI_REFLECTION_TERMINAL_STATUSES } from '@/hooks/use-ai-reflection-poll';
import { usePeriodReflectionPoll } from '@/hooks/use-period-reflection-poll';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const INSIGHT_SECTIONS: {
  key: 'repeatedEmotionsAndSituations' | 'difficultMoments' | 'gratefulMoments' | 'triedResponses' | 'helpfulConditions';
  title: string;
  icon: SymbolViewProps['name'];
}[] = [
  { key: 'repeatedEmotionsAndSituations', title: '반복된 감정과 상황', icon: { ios: 'repeat', android: 'repeat' } },
  { key: 'difficultMoments', title: '힘들었던 순간', icon: { ios: 'cloud.rain', android: 'rainy' } },
  { key: 'gratefulMoments', title: '감사했던 순간', icon: { ios: 'heart', android: 'favorite' } },
  { key: 'triedResponses', title: '시도해본 방법', icon: { ios: 'checkmark.seal', android: 'verified' } },
  { key: 'helpfulConditions', title: '도움이 되었던 조건', icon: { ios: 'lightbulb', android: 'lightbulb' } },
];

// 프로토타입 L06(주간 회고)의 다단계 위저드는 재현하지 않는다. 백엔드는 기록 정리(R03)와
// 같은 AI 파이프라인으로 요약·통찰·질문 하나를 생성하므로, R03과 같은 폴링·표시 패턴을 따른다.
export default function PeriodReflectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { reflection, loading, timedOut } = usePeriodReflectionPoll(id);

  const status = reflection?.status ?? null;
  const isTerminal = status !== null && AI_REFLECTION_TERMINAL_STATUSES.includes(status);
  const hasContent = isTerminal && status === 'COMPLETED' && !!reflection?.summaryText;
  const title = reflection?.featureType ? periodReflectionFeatureTypeLabel(reflection.featureType) : '기간별 회고';

  // 회고 하나당 내 생각은 하나만 유지한다 - 다시 저장하면 새 항목을 쌓지 않고 기존 내용을 고친다.
  const [existingNote, setExistingNote] = useState<EntrySelfReflectionSummary | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const entryId = reflection?.entryId;

  useEffect(() => {
    if (!entryId || !hasContent) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const notes = await getSelfReflections(accessToken, entryId);
        if (!cancelled && notes.length > 0) {
          setExistingNote(notes[0]);
          setNoteContent(notes[0].content);
        }
      } catch (error) {
        logger.error('period-reflection', 'failed to load self reflections', {
          code: error instanceof ApiError ? error.code : undefined,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId, hasContent]);

  const handleSaveNote = async () => {
    if (!entryId || noteContent.trim().length === 0 || savingNote) {
      return;
    }
    setSavingNote(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      const saved = existingNote
        ? await updateSelfReflection(accessToken, entryId, existingNote.id, { content: noteContent.trim() })
        : await createSelfReflection(accessToken, entryId, { content: noteContent.trim() });
      setExistingNote(saved);
      setNoteContent(saved.content);
    } catch (error) {
      logger.error('period-reflection', 'failed to save self reflection', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title={title} />

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : !isTerminal ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small" themeColor="textTertiary">
                회고를 정리하는 중이에요
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.waitHint}>
                이 화면을 나가도 회고는 계속 준비돼요. LifeTime에서 나중에 다시 볼 수 있어요.
              </ThemedText>
              <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
              {timedOut && (
                <ThemedText type="small" themeColor="textTertiary">
                  생각보다 오래 걸리고 있어요. 나중에 다시 확인해 주세요.
                </ThemedText>
              )}
            </ThemedView>
          ) : !hasContent ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              지금은 회고를 만들지 못했어요. 나중에 다시 시도해 주세요.
            </ThemedText>
          ) : (
            <>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="default">{reflection?.summaryText}</ThemedText>
              </ThemedView>

              {INSIGHT_SECTIONS.map((section) => {
                const values = reflection?.insights?.[section.key] ?? [];
                if (values.length === 0) {
                  return null;
                }
                return (
                  <ThemedView key={section.key} type="backgroundElement" style={styles.card}>
                    <SectionHeading icon={section.icon} title={section.title} />
                    <View style={styles.list}>
                      {values.map((value, index) => (
                        <ThemedText key={index} type="default" themeColor="textSecondary" style={styles.listItem}>
                          · {value}
                        </ThemedText>
                      ))}
                    </View>
                  </ThemedView>
                );
              })}

              {reflection?.questionText && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <SectionHeading icon={{ ios: 'questionmark.circle', android: 'help' }} title="함께 생각해볼 질문" />
                  <ThemedText type="heading" style={styles.question}>
                    {reflection.questionText}
                  </ThemedText>

                  <ThemedText type="small" themeColor="textTertiary" style={styles.noteLabel}>
                    내 생각
                  </ThemedText>
                  <TextInput
                    style={[styles.noteInput, { borderColor: theme.border, color: theme.text }]}
                    placeholder="이 질문에 대한 내 생각을 적어보세요."
                    placeholderTextColor={theme.textTertiary}
                    value={noteContent}
                    onChangeText={setNoteContent}
                    multiline
                    textAlignVertical="top"
                  />
                  <AppButton
                    title={existingNote ? '내 생각 수정하기' : '내 생각 저장하기'}
                    variant="ghost"
                    style={styles.noteSaveButton}
                    loading={savingNote}
                    disabled={noteContent.trim().length === 0}
                    onPress={handleSaveNote}
                  />
                </ThemedView>
              )}

              <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
                위 내용은 사실이나 진단이 아니에요. 어긋난다고 느껴지면 그대로 두어도 괜찮아요.
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
    marginTop: Spacing.three,
  },
  lead: {
    marginTop: Spacing.three,
  },
  card: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  waitHint: {
    marginTop: Spacing.half,
  },
  list: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  listItem: {
    lineHeight: 20,
  },
  question: {
    marginTop: Spacing.two,
  },
  noteLabel: {
    marginTop: Spacing.three,
  },
  noteInput: {
    marginTop: Spacing.one,
    minHeight: 100,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  noteSaveButton: {
    marginTop: Spacing.two,
  },
  note: {
    marginTop: Spacing.three,
  },
});
