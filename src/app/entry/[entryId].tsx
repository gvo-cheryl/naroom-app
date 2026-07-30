import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createSelfReflection,
  deleteEntry,
  getCheckIn,
  getEntry,
  getEntryAiReflection,
  getEntryTags,
  getSelfReflections,
  updateEntry,
  updateSelfReflection,
} from '@/api';
import { ApiError } from '@/api/errors';
import type {
  CheckInSummary,
  EntryAiReflectionSummary,
  EntrySelfReflectionSummary,
  EntrySummary,
  EntryTagSummary,
} from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { LevelBar } from '@/components/level-bar';
import { NeedSummary } from '@/components/need-summary';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { ENERGY_LABELS, INTENSITY_LABELS, levelLabelIndex } from '@/constants/checkin';
import { entryTypeLabel } from '@/constants/record';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 L05(기록 상세)에 대응한다. 타임라인에서 특정 기록을 눌렀을 때, 그 날짜의 기록 전부가 아니라
// 이 기록 하나(+그날의 체크인, AI 정리, 내 생각, 태그)만 보여주고 하단에 수정/삭제를 붙인다.
export default function EntryDetailScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<EntrySummary | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInSummary | null>(null);
  const [aiReflection, setAiReflection] = useState<EntryAiReflectionSummary | null>(null);
  const [tags, setTags] = useState<EntryTagSummary[]>([]);

  const [existingNote, setExistingNote] = useState<EntrySelfReflectionSummary | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const loadedEntry = await getEntry(accessToken, entryId);
        if (cancelled) {
          return;
        }
        setEntry(loadedEntry);
        setEditTitle(loadedEntry.title ?? '');
        setEditBody(loadedEntry.body ?? '');

        const [dayCheckIn, reflection, entryTags, notes] = await Promise.all([
          getCheckIn(accessToken, loadedEntry.recordDate),
          getEntryAiReflection(accessToken, entryId).catch(() => null),
          getEntryTags(accessToken, entryId),
          getSelfReflections(accessToken, entryId),
        ]);
        if (cancelled) {
          return;
        }
        setCheckIn(dayCheckIn);
        setAiReflection(reflection);
        setTags(entryTags.filter((entryTag) => entryTag.state !== 'REJECTED'));
        if (notes.length > 0) {
          setExistingNote(notes[0]);
          setNoteContent(notes[0].content);
        }
      } catch (error) {
        logger.error('entry-detail', 'failed to load entry', {
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
  }, [entryId]);

  const handleSaveNote = async () => {
    if (noteContent.trim().length === 0 || savingNote) {
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
      logger.error('entry-detail', 'failed to save self reflection', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleStartEdit = () => {
    if (!entry) {
      return;
    }
    setEditTitle(entry.title ?? '');
    setEditBody(entry.body ?? '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!entry || saving) {
      return;
    }
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      const updated = await updateEntry(accessToken, entryId, {
        title: editTitle.trim() ? editTitle.trim() : undefined,
        body: editBody.trim() ? editBody.trim() : undefined,
        version: entry.version,
      });
      setEntry(updated);
      setEditing(false);
    } catch (error) {
      logger.error('entry-detail', 'failed to update entry', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('기록을 삭제할까요?', '삭제하면 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const accessToken = await getValidAccessToken();
            if (!accessToken) {
              return;
            }
            await deleteEntry(accessToken, entryId);
            router.back();
          } catch (error) {
            logger.error('entry-detail', 'failed to delete entry', {
              code: error instanceof ApiError ? error.code : undefined,
            });
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title={entry ? entryTypeLabel(entry.entryType) : '기록 상세'} />

          {loading || !entry ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : (
            <>
              <ThemedText type="small" themeColor="textTertiary" style={styles.dateLabel}>
                {entry.recordDate}
              </ThemedText>

              {editing ? (
                <View style={styles.editFields}>
                  {entry.title !== null && (
                    <TextInput
                      style={[styles.titleInput, { borderColor: theme.border, color: theme.text }]}
                      placeholder="제목 (선택)"
                      placeholderTextColor={theme.textTertiary}
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />
                  )}
                  <TextInput
                    style={[styles.bodyInput, { borderColor: theme.border, color: theme.text }]}
                    value={editBody}
                    onChangeText={setEditBody}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              ) : (
                <ThemedView type="backgroundElement" style={styles.card}>
                  {entry.title && (
                    <ThemedText type="heading" style={styles.titleText}>
                      {entry.title}
                    </ThemedText>
                  )}
                  <ThemedText type="default" style={entry.title ? styles.bodyText : undefined}>
                    {entry.body || '내용 없음'}
                  </ThemedText>
                </ThemedView>
              )}

              {checkIn && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <SectionHeading icon={{ ios: 'checkmark.circle.fill', android: 'check_circle' }} title="그날의 체크인" />
                  {checkIn.emotions.length > 0 && (
                    <View style={styles.chips}>
                      {checkIn.emotions.map((tag) => (
                        <ThemedView key={tag.id} type="backgroundSelected" style={styles.chip}>
                          <ThemedText type="small" themeColor="textSecondary">
                            {tag.name}
                          </ThemedText>
                        </ThemedView>
                      ))}
                    </View>
                  )}
                  {checkIn.emotionIntensity !== null && (
                    <LevelBar
                      label="감정 강도"
                      value={checkIn.emotionIntensity}
                      levelLabel={INTENSITY_LABELS[levelLabelIndex(checkIn.emotionIntensity, INTENSITY_LABELS.length)]}
                      color={theme.text}
                    />
                  )}
                  {checkIn.energyLevel !== null && (
                    <LevelBar
                      label="오늘의 에너지"
                      value={checkIn.energyLevel}
                      levelLabel={ENERGY_LABELS[levelLabelIndex(checkIn.energyLevel, ENERGY_LABELS.length)]}
                      color={theme.text}
                    />
                  )}
                  {checkIn.currentNeed && <NeedSummary need={checkIn.currentNeed} />}
                </ThemedView>
              )}

              {aiReflection?.reflectionText && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <SectionHeading icon={{ ios: 'sparkles', android: 'auto_awesome' }} title="AI 정리" />
                  <ThemedText type="default" style={styles.aiText}>
                    {aiReflection.reflectionText}
                  </ThemedText>
                  {aiReflection.reflectionQuestion && (
                    <ThemedText type="small" themeColor="textTertiary" style={styles.aiQuestion}>
                      {aiReflection.reflectionQuestion}
                    </ThemedText>
                  )}
                </ThemedView>
              )}

              <ThemedView type="backgroundElement" style={styles.card}>
                <SectionHeading icon={{ ios: 'pencil', android: 'edit_note' }} title="나의 생각" />
                <TextInput
                  style={[styles.noteInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="이 기록을 다시 보니 어떤 생각이 드나요?"
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

              <ThemedView type="backgroundElement" style={styles.card}>
                <SectionHeading icon={{ ios: 'tag', android: 'sell' }} title="태그" />
                {tags.length > 0 ? (
                  <View style={styles.chips}>
                    {tags.map((entryTag) => (
                      <ThemedView key={entryTag.id} type="backgroundSelected" style={styles.chip}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {entryTag.tag.name}
                        </ThemedText>
                      </ThemedView>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textTertiary" style={styles.noTags}>
                    태그 없음
                  </ThemedText>
                )}
              </ThemedView>

              <View style={styles.actionRow}>
                {editing ? (
                  <>
                    <AppButton
                      title="취소"
                      variant="ghost"
                      style={styles.actionButton}
                      onPress={() => setEditing(false)}
                    />
                    <AppButton title="저장" style={styles.actionButton} loading={saving} onPress={handleSaveEdit} />
                  </>
                ) : (
                  <>
                    <AppButton title="수정" variant="ghost" style={styles.actionButton} onPress={handleStartEdit} />
                    <AppButton
                      title="삭제"
                      variant="danger"
                      style={styles.actionButton}
                      loading={deleting}
                      onPress={handleDelete}
                    />
                  </>
                )}
              </View>
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
    marginTop: Spacing.five,
  },
  dateLabel: {
    marginTop: Spacing.one,
  },
  card: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  titleText: {
    marginBottom: Spacing.one,
  },
  bodyText: {
    marginTop: Spacing.one,
  },
  editFields: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
    fontWeight: '600',
  },
  bodyInput: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  chip: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  aiText: {
    marginTop: Spacing.two,
    lineHeight: 22,
  },
  aiQuestion: {
    marginTop: Spacing.two,
  },
  noteInput: {
    marginTop: Spacing.two,
    minHeight: 100,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  noteSaveButton: {
    marginTop: Spacing.two,
  },
  noTags: {
    marginTop: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  actionButton: {
    flex: 1,
  },
});
