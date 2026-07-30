import type { SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTagDistribution } from '@/api';
import { ApiError } from '@/api/errors';
import type { TagCategory, TagDistributionSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { BarsList } from '@/components/charts/bars-list';
import { StackBar } from '@/components/charts/stack-bar';
import { WordCloud } from '@/components/charts/word-cloud';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ANALYTICS_RANGE_OPTIONS, TAG_CATEGORY_COLOR_KEY } from '@/constants/lifetime-analytics';
import { TAG_CATEGORY_LABELS } from '@/constants/record';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildLastDays } from '@/lib/lifetime-days';
import { logger } from '@/lib/logger';

const CATEGORY_ORDER: TagCategory[] = ['EMOTION', 'SITUATION', 'NEED', 'VALUE', 'ACTION', 'RECOVERY'];

const CATEGORY_ICON: Record<TagCategory, SymbolViewProps['name']> = {
  EMOTION: { ios: 'heart', android: 'favorite' },
  SITUATION: { ios: 'mappin.and.ellipse', android: 'place' },
  NEED: { ios: 'target', android: 'track_changes' },
  VALUE: { ios: 'star', android: 'star' },
  ACTION: { ios: 'figure.walk', android: 'directions_walk' },
  RECOVERY: { ios: 'leaf', android: 'eco' },
  CUSTOM: { ios: 'tag', android: 'sell' },
};

// 프로토타입 L04(키워드 탐색)에 대응한다. 태그가 확인된 "횟수"만 보여줄 뿐 순위·중요도 판단은 하지 않는다.
export default function KeywordsScreen() {
  const theme = useTheme();

  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<TagDistributionSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const result = await getTagDistribution(accessToken, { range });
        if (!cancelled) {
          setDistribution(result);
        }
      } catch (error) {
        logger.error('keywords', 'failed to load tag distribution', {
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
  }, [range]);

  const days = buildLastDays(range);
  const byCategory = new Map<TagCategory, TagDistributionSummary[]>();
  distribution.forEach((item) => {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  });

  const stackParts = CATEGORY_ORDER.map((category) => ({
    label: TAG_CATEGORY_LABELS[category],
    value: (byCategory.get(category) ?? []).reduce((sum, item) => sum + item.count, 0),
    color: theme[TAG_CATEGORY_COLOR_KEY[category]] as string,
  }));

  const cloudItems = [...distribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 18)
    .map((item) => ({
      label: item.tagName,
      value: item.count,
      color: theme[TAG_CATEGORY_COLOR_KEY[item.category]] as string,
      onPress: () =>
        router.push({ pathname: '/analytics/tag/[tagId]', params: { tagId: item.tagId, tagName: item.tagName } }),
    }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="키워드 탐색" />

          <View style={styles.rangeRow}>
            {ANALYTICS_RANGE_OPTIONS.map((option) => (
              <Pressable
                key={option.days}
                onPress={() => setRange(option.days)}
                style={[
                  styles.rangeChip,
                  { backgroundColor: range === option.days ? theme.text : theme.backgroundElement },
                ]}
              >
                <ThemedText type="small" style={{ color: range === option.days ? theme.background : theme.textSecondary }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : distribution.length === 0 ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
              {days[0]} ~ {days[days.length - 1]} 기간에는 확인된 키워드가 없어요.
            </ThemedText>
          ) : (
            <>
              <ThemedText type="small" themeColor="textTertiary" style={styles.rangeSummary}>
                {days[0]} ~ {days[days.length - 1]}
              </ThemedText>

              <SectionHeading icon={{ ios: 'chart.pie', android: 'pie_chart' }} title="키워드 구성" style={styles.sectionHeading} />
              <ThemedView type="backgroundElement" style={styles.card}>
                <StackBar parts={stackParts} />
              </ThemedView>

              <SectionHeading icon={{ ios: 'cloud', android: 'cloud' }} title="자주 등장한 키워드" style={styles.sectionHeading} />
              <ThemedView type="backgroundElement" style={styles.card}>
                <WordCloud items={cloudItems} />
                <ThemedText type="small" themeColor="textTertiary" style={styles.hint}>
                  글자 크기는 등장 횟수를 나타낼 뿐, 중요도나 순위를 뜻하지 않아요.
                </ThemedText>
              </ThemedView>

              {CATEGORY_ORDER.map((category) => {
                const items = (byCategory.get(category) ?? []).sort((a, b) => b.count - a.count);
                if (items.length === 0) {
                  return null;
                }
                const color = theme[TAG_CATEGORY_COLOR_KEY[category]] as string;
                return (
                  <View key={category}>
                    <SectionHeading
                      icon={CATEGORY_ICON[category]}
                      title={TAG_CATEGORY_LABELS[category]}
                      style={styles.sectionHeading}
                    />
                    <ThemedView type="backgroundElement" style={styles.card}>
                      <BarsList
                        color={color}
                        items={items.slice(0, 6).map((item) => ({
                          label: item.tagName,
                          value: item.count,
                          onPress: () =>
                            router.push({
                              pathname: '/analytics/tag/[tagId]',
                              params: { tagId: item.tagId, tagName: item.tagName },
                            }),
                        }))}
                      />
                      {items.length > 6 && (
                        <View style={styles.chipRow}>
                          {items.slice(6).map((item) => (
                            <Pressable
                              key={item.tagId}
                              onPress={() =>
                                router.push({
                                  pathname: '/analytics/tag/[tagId]',
                                  params: { tagId: item.tagId, tagName: item.tagName },
                                })
                              }
                            >
                              <ThemedView type="backgroundSelected" style={styles.chip}>
                                <ThemedText type="small" themeColor="textSecondary">
                                  {item.tagName} {item.count}
                                </ThemedText>
                              </ThemedView>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </ThemedView>
                  </View>
                );
              })}
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
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  rangeChip: {
    height: 30,
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  rangeSummary: {
    marginTop: Spacing.two,
  },
  sectionHeading: {
    marginTop: Spacing.four,
  },
  card: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  hint: {
    marginTop: Spacing.two,
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
  empty: {
    marginTop: Spacing.five,
    textAlign: 'center',
  },
});
