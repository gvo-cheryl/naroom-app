import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentPersonalSummary, getPersonalSummaryHistory, updateCurrentPersonalSummary } from '@/api';
import { ApiError } from '@/api/errors';
import type { PersonalSummarySummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const HINTS = [
  '요즘 중요하게 느끼는 것',
  '나를 힘들게 하는 조건',
  '나에게 도움이 되는 조건',
  '자주 느끼는 감정',
  '더 살펴보고 싶은 부분',
];

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

// 프로토타입 L08(나의 정리)에 대응한다. "지금의 나"를 담아 계속 고쳐 쓰는 한 장이다 - 기록처럼
// 날짜별로 쌓이지 않고, 수정하면 이전 글은 보관(archive)되고 새로 하나가 만들어진다.
export default function PersonalSummaryScreen() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<PersonalSummarySummary | null>(null);
  const [history, setHistory] = useState<PersonalSummarySummary[]>([]);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      const [summary, historyList] = await Promise.all([
        getCurrentPersonalSummary(accessToken),
        getPersonalSummaryHistory(accessToken),
      ]);
      setCurrent(summary);
      setContent(summary?.content ?? '');
      setHistory(historyList.filter((item) => item.archived));
    } catch (error) {
      logger.error('personal-summary', 'failed to load personal summary', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleSave = async (goToLifetime: boolean) => {
    if (content.trim().length === 0 || saving) {
      return;
    }
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await updateCurrentPersonalSummary(accessToken, content.trim());
      await load();
      setEditing(false);
      if (goToLifetime) {
        router.back();
      }
    } catch (error) {
      logger.error('personal-summary', 'failed to save personal summary', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async (historyItem: PersonalSummarySummary) => {
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await updateCurrentPersonalSummary(accessToken, historyItem.content);
      await load();
    } catch (error) {
      logger.error('personal-summary', 'failed to revert personal summary', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const firstWrittenAt = history.length > 0 ? history[history.length - 1].createdAt : current?.createdAt;
  const showEditor = editing || !current;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="나의 정리" />

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : showEditor ? (
            <>
              <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
                나로움이 아니라, 지금의 나를 내 언어로 적어두는 한 장이에요. 언제든 고쳐 쓸 수 있어요.
              </ThemedText>
              <View style={styles.hintRow}>
                {HINTS.map((hint) => (
                  <Pressable
                    key={hint}
                    onPress={() => setContent((prev) => (prev ? `${prev}\n${hint}: ` : `${hint}: `))}
                    style={[styles.hintChip, { borderColor: theme.border }]}
                  >
                    <ThemedText type="small" themeColor="textSecondary">
                      + {hint}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[styles.field, { borderColor: theme.border, color: theme.text }]}
                placeholder="예: 요즘은 조용한 시간이 있어야 회복되는 것 같다."
                placeholderTextColor={theme.textTertiary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
              <AppButton
                title="저장하고 보기"
                style={styles.saveButton}
                loading={saving}
                disabled={content.trim().length === 0}
                onPress={() => handleSave(true)}
              />
              <AppButton
                title="저장만 하기"
                variant="ghost"
                style={styles.saveButton}
                loading={saving}
                disabled={content.trim().length === 0}
                onPress={() => handleSave(false)}
              />
              {current && (
                <AppButton
                  title="그만두기"
                  variant="quiet"
                  style={styles.saveButton}
                  onPress={() => {
                    setContent(current.content);
                    setEditing(false);
                  }}
                />
              )}
            </>
          ) : (
            <>
              <ThemedView type="backgroundElement" style={styles.metaCard}>
                <View style={styles.metaRow}>
                  <ThemedText type="small" themeColor="textTertiary">
                    처음 쓴 날
                  </ThemedText>
                  <ThemedText type="small">{firstWrittenAt ? formatDate(firstWrittenAt) : ''}</ThemedText>
                </View>
                <View style={styles.metaRow}>
                  <ThemedText type="small" themeColor="textTertiary">
                    최근 수정
                  </ThemedText>
                  <ThemedText type="small">{formatDate(current.updatedAt)}</ThemedText>
                </View>
                <View style={styles.metaRow}>
                  <ThemedText type="small" themeColor="textTertiary">
                    고쳐 쓴 횟수
                  </ThemedText>
                  <ThemedText type="small">{history.length}번</ThemedText>
                </View>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="default" style={styles.contentText}>
                  {current.content}
                </ThemedText>
              </ThemedView>

              <View style={styles.actionRow}>
                <AppButton
                  title="고쳐 쓰기"
                  variant="ghost"
                  style={styles.actionButton}
                  onPress={() => setEditing(true)}
                />
                <AppButton
                  title="LifeTime에서 보기"
                  variant="ghost"
                  style={styles.actionButton}
                  onPress={() => router.back()}
                />
              </View>
              <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
                이 글은 기록처럼 날짜별로 쌓이지 않고, 지금의 나를 담아 계속 고쳐 쓰는 한 장이에요.
              </ThemedText>

              {history.length > 0 && (
                <>
                  <SectionHeading
                    icon={{ ios: 'clock.arrow.circlepath', android: 'history' }}
                    title="이전에 적었던 정리"
                    style={styles.historyHeading}
                  />
                  {history.map((item) => (
                    <ThemedView key={item.id} type="backgroundElement" style={styles.card}>
                      <View style={styles.historyRow}>
                        <ThemedText type="small" themeColor="textTertiary">
                          {formatDate(item.createdAt)}
                        </ThemedText>
                        <Pressable onPress={() => handleRevert(item)} hitSlop={8}>
                          <ThemedText type="small" themeColor="textSecondary" style={styles.revertLink}>
                            이 내용으로 되돌리기
                          </ThemedText>
                        </Pressable>
                      </View>
                      <ThemedText type="default" themeColor="textSecondary" style={styles.historyContent}>
                        {item.content}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </>
              )}
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
  lead: {
    marginTop: Spacing.one,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  hintChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  field: {
    marginTop: Spacing.three,
    minHeight: 170,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  saveButton: {
    marginTop: Spacing.two,
  },
  metaCard: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  contentText: {
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  actionButton: {
    flex: 1,
  },
  note: {
    marginTop: Spacing.two,
  },
  historyHeading: {
    marginTop: Spacing.four,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revertLink: {
    textDecorationLine: 'underline',
  },
  historyContent: {
    marginTop: Spacing.one,
    lineHeight: 22,
  },
});
