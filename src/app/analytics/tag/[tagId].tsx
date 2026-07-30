import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEntriesByTag } from '@/api';
import { ApiError } from '@/api/errors';
import type { EntryTimelineSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { entryTypeLabel } from '@/constants/record';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 L09(태그 상세)에 대응한다. 이 태그가 확인된 기록과, 그 기록들에 함께 등장한 다른 키워드를 보여준다.
export default function TagDetailScreen() {
  const theme = useTheme();
  const { tagId, tagName } = useLocalSearchParams<{ tagId: string; tagName?: string }>();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<EntryTimelineSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken || !tagId) {
          return;
        }
        const result = await getEntriesByTag(accessToken, tagId);
        if (!cancelled) {
          setEntries(result);
        }
      } catch (error) {
        logger.error('tag-detail', 'failed to load entries for tag', {
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
  }, [tagId]);

  const coOccurring = new Map<string, number>();
  entries.forEach((entry) => {
    entry.tags
      .filter((entryTag) => entryTag.state !== 'REJECTED' && entryTag.tag.name !== tagName)
      .forEach((entryTag) => {
        coOccurring.set(entryTag.tag.name, (coOccurring.get(entryTag.tag.name) ?? 0) + 1);
      });
  });
  const topCoOccurring = [...coOccurring.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title={tagName ?? '태그'} />

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : (
            <>
              <ThemedText type="small" themeColor="textTertiary" style={styles.count}>
                이 태그가 확인된 기록 {entries.length}건
              </ThemedText>

              {topCoOccurring.length > 0 && (
                <>
                  <SectionHeading
                    icon={{ ios: 'link', android: 'link' }}
                    title="함께 등장한 키워드"
                    style={styles.sectionHeading}
                  />
                  <View style={styles.chipRow}>
                    {topCoOccurring.map(([name, count]) => (
                      <ThemedView key={name} type="backgroundSelected" style={styles.chip}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {name} {count}
                        </ThemedText>
                      </ThemedView>
                    ))}
                  </View>
                </>
              )}

              <SectionHeading icon={{ ios: 'doc.text', android: 'description' }} title="관련 기록" style={styles.sectionHeading} />
              {entries.length === 0 ? (
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  아직 이 태그가 확인된 기록이 없어요.
                </ThemedText>
              ) : (
                entries.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => router.push({ pathname: '/entry/[entryId]', params: { entryId: entry.id } })}
                  >
                    <ThemedView type="backgroundElement" style={styles.card}>
                      <View style={styles.cardHeader}>
                        <ThemedText type="small" themeColor="textTertiary">
                          {entryTypeLabel(entry.entryType)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textTertiary">
                          {entry.recordDate}
                        </ThemedText>
                      </View>
                      <ThemedText type="default" style={styles.cardBody} numberOfLines={2}>
                        {entry.title || entry.body || '내용 없음'}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))
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
  count: {
    marginTop: Spacing.one,
  },
  sectionHeading: {
    marginTop: Spacing.four,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  chip: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  card: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardBody: {
    marginTop: Spacing.one,
  },
  empty: {
    marginTop: Spacing.three,
  },
});
