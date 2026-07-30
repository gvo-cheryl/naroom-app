import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { attachEntryTag, createMyTag, getEntryTags, getSystemTags, rejectEntryTag } from '@/api';
import { ApiError } from '@/api/errors';
import type { EntryTagSummary, TagCategory, TagSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { TAG_CATEGORY_LABELS } from '@/constants/record';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const CATEGORY_ORDER: TagCategory[] = ['EMOTION', 'SITUATION', 'NEED', 'VALUE', 'ACTION', 'RECOVERY', 'CUSTOM'];

function groupByCategory<T>(items: T[], categoryOf: (item: T) => TagCategory): Map<TagCategory, T[]> {
  const map = new Map<TagCategory, T[]>();
  for (const item of items) {
    const category = categoryOf(item);
    const list = map.get(category) ?? [];
    list.push(item);
    map.set(category, list);
  }
  return map;
}

// 프로토타입 R05(키워드 확인)에 대응한다. 이 단계는 AI 정리(R03)를 건너뛰고 바로 이어지므로,
// 이 시점의 태그는 대부분 비어 있고 사용자가 직접 고르거나 입력한 것만 보인다.
export default function RecordTagsScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [attached, setAttached] = useState<EntryTagSummary[]>([]);
  const [systemTags, setSystemTags] = useState<TagSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          router.replace('/(auth)/login');
          return;
        }
        const [entryTags, tags] = await Promise.all([
          getEntryTags(accessToken, entryId),
          getSystemTags(accessToken),
        ]);
        if (!cancelled) {
          setAttached(entryTags.filter((t) => t.state !== 'REJECTED'));
          setSystemTags(tags);
        }
      } catch (error) {
        logger.error('record.tags', 'failed to load tags', {
          code: error instanceof ApiError ? error.code : undefined,
        });
        if (!cancelled) {
          setErrorMessage('키워드를 불러오지 못했어요.');
        }
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

  const attachedTagIds = new Set(attached.map((t) => t.tag.id));

  const handleQuickAdd = async (tag: TagSummary) => {
    if (attachedTagIds.has(tag.id)) {
      return;
    }
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace('/(auth)/login');
        return;
      }
      const entryTag = await attachEntryTag(accessToken, entryId, tag.id);
      setAttached((prev) => [...prev, entryTag]);
    } catch (error) {
      logger.error('record.tags', 'failed to attach tag', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  const handleRemove = async (entryTag: EntryTagSummary) => {
    setAttached((prev) => prev.filter((t) => t.id !== entryTag.id));
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await rejectEntryTag(accessToken, entryId, entryTag.id);
      }
    } catch (error) {
      logger.error('record.tags', 'failed to reject tag', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  const handleAddCustomTag = async () => {
    const name = newTagName.trim();
    if (!name || addingTag) {
      return;
    }
    setAddingTag(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace('/(auth)/login');
        return;
      }
      const tag = await createMyTag(accessToken, { category: 'CUSTOM', name });
      const entryTag = await attachEntryTag(accessToken, entryId, tag.id);
      setAttached((prev) => [...prev, entryTag]);
      setNewTagName('');
    } catch (error) {
      logger.error('record.tags', 'failed to add custom tag', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setAddingTag(false);
    }
  };

  const attachedByCategory = groupByCategory(attached, (t) => t.tag.category);
  const systemTagsByCategory = groupByCategory(systemTags, (t) => t.category);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="키워드 확인" />
          <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
            키워드는 나를 분류하는 라벨이 아니라, 이 기록에 무엇이 담겼는지 나중에 찾기 위한 표시예요.
          </ThemedText>

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : (
            <>
              {CATEGORY_ORDER.filter((category) => (attachedByCategory.get(category) ?? []).length > 0).map(
                (category) => (
                  <View key={category} style={styles.section}>
                    <ThemedText type="small" themeColor="textTertiary">
                      {TAG_CATEGORY_LABELS[category]}
                    </ThemedText>
                    <View style={styles.chips}>
                      {(attachedByCategory.get(category) ?? []).map((entryTag) => (
                        <Pressable
                          key={entryTag.id}
                          onPress={() => handleRemove(entryTag)}
                          style={[styles.chip, styles.chipOn, { borderColor: theme.text }]}>
                          <ThemedText type="small">{entryTag.tag.name} ×</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ),
              )}

              <ThemedText type="default" style={styles.addHeading}>
                키워드 추가
              </ThemedText>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="직접 입력"
                  placeholderTextColor={theme.textTertiary}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  onSubmitEditing={handleAddCustomTag}
                />
                <Pressable
                  onPress={handleAddCustomTag}
                  disabled={addingTag || newTagName.trim().length === 0}
                  style={[styles.addButton, { borderColor: theme.border }]}>
                  <ThemedText type="smallBold">추가</ThemedText>
                </Pressable>
              </View>

              {CATEGORY_ORDER.filter((category) => (systemTagsByCategory.get(category) ?? []).length > 0).map(
                (category) => (
                  <View key={category} style={styles.section}>
                    <ThemedText type="small" themeColor="textTertiary">
                      {TAG_CATEGORY_LABELS[category]}
                    </ThemedText>
                    <View style={styles.chips}>
                      {(systemTagsByCategory.get(category) ?? []).map((tag) => (
                        <Pressable
                          key={tag.id}
                          onPress={() => handleQuickAdd(tag)}
                          disabled={attachedTagIds.has(tag.id)}
                          style={[
                            styles.chip,
                            { borderColor: theme.border },
                            attachedTagIds.has(tag.id) && styles.chipDisabled,
                          ]}>
                          <ThemedText type="small" themeColor="textSecondary">
                            + {tag.name}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ),
              )}

              {errorMessage && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
                  {errorMessage}
                </ThemedText>
              )}

              <AppButton
                title="확인했어요"
                style={styles.confirmButton}
                onPress={() => router.replace({ pathname: '/record/complete', params: { entryId } })}
              />
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
  lead: {
    marginTop: Spacing.one,
  },
  loading: {
    marginTop: Spacing.five,
  },
  section: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  chipOn: {
    borderWidth: 1.5,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  addHeading: {
    marginTop: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  addButton: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: Spacing.five,
  },
});
