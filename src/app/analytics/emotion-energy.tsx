import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEmotionEnergyTrend, getTagDistribution, getTimeline } from '@/api';
import { ApiError } from '@/api/errors';
import type { EmotionEnergyPointSummary, TagDistributionSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { ArcGauge } from '@/components/charts/arc-gauge';
import { BarsList } from '@/components/charts/bars-list';
import { EnergyRibbon, type RibbonDay } from '@/components/charts/energy-ribbon';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ENERGY_LABELS, INTENSITY_LABELS, levelLabelIndex } from '@/constants/checkin';
import { ANALYTICS_RANGE_OPTIONS } from '@/constants/lifetime-analytics';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildLastDays, modeLevelIndex } from '@/lib/lifetime-days';
import { logger } from '@/lib/logger';

// 프로토타입 L03(감정·에너지)에 대응한다. 점수·순위 없이 언어형 5단계와 등장 횟수만 보여준다.
export default function EmotionEnergyScreen() {
  const theme = useTheme();

  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<EmotionEnergyPointSummary[]>([]);
  const [emotionDistribution, setEmotionDistribution] = useState<TagDistributionSummary[]>([]);
  const [recordDates, setRecordDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const days = buildLastDays(range);
        const [trendPoints, emotions, entries] = await Promise.all([
          getEmotionEnergyTrend(accessToken, range),
          getTagDistribution(accessToken, { category: 'EMOTION', range }),
          getTimeline(accessToken, { from: days[0], to: days[days.length - 1] }),
        ]);
        if (cancelled) {
          return;
        }
        setTrend(trendPoints);
        setEmotionDistribution(emotions);
        setRecordDates(new Set(entries.map((entry) => entry.recordDate)));
      } catch (error) {
        logger.error('emotion-energy', 'failed to load emotion/energy analytics', {
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
  const trendByDate = new Map(trend.map((point) => [point.date, point]));
  const ribbonDays: RibbonDay[] = days.map((date) => ({
    date,
    energy: trendByDate.get(date)?.energyLevel ?? null,
    hasRecord: recordDates.has(date),
  }));
  const checkInDayCount = trend.length;
  const scarce = checkInDayCount < 3;

  const energyLevelIndexes = trend
    .filter((point) => point.energyLevel != null)
    .map((point) => levelLabelIndex(point.energyLevel as number, ENERGY_LABELS.length));
  const intensityLevelIndexes = trend
    .filter((point) => point.emotionIntensity != null)
    .map((point) => levelLabelIndex(point.emotionIntensity as number, INTENSITY_LABELS.length));
  const modeEnergyIndex = modeLevelIndex(energyLevelIndexes);
  const modeIntensityIndex = modeLevelIndex(intensityLevelIndexes);

  const recentIntensityDays = days.slice(-14);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="감정 · 에너지" />

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
          ) : (
            <>
              <ThemedText type="small" themeColor="textTertiary" style={styles.rangeSummary}>
                {days[0]} ~ {days[days.length - 1]} · 체크인 {checkInDayCount}일
              </ThemedText>

              {scarce && (
                <ThemedView type="backgroundElement" style={styles.banner}>
                  <ThemedText type="default">아직 흐름을 말하기에는 기록이 적어요</ThemedText>
                  <ThemedText type="small" themeColor="textTertiary" style={styles.bannerSub}>
                    이 기간에 남은 체크인은 {checkInDayCount}일이에요. 며칠 더 쌓이면 함께 살펴볼 수 있어요.
                  </ThemedText>
                </ThemedView>
              )}

              <SectionHeading icon={{ ios: 'wave.3.right', android: 'waves' }} title="에너지 흐름" style={styles.sectionHeading} />
              <ThemedView type="backgroundElement" style={styles.card}>
                <EnergyRibbon days={ribbonDays} />
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.border }]} />
                    <ThemedText type="small" themeColor="textTertiary">
                      기록하지 않은 날
                    </ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.slate }]} />
                    <ThemedText type="small" themeColor="textTertiary">
                      그날의 기록
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" themeColor="textTertiary" style={styles.hint}>
                  기록하지 않은 날은 낮은 에너지가 아니라 &apos;알 수 없음&apos;으로 비워 둡니다.
                </ThemedText>
              </ThemedView>

              <SectionHeading icon={{ ios: 'chart.bar', android: 'bar_chart' }} title="감정 강도의 흐름" style={styles.sectionHeading} />
              <ThemedView type="backgroundElement" style={styles.card}>
                {recentIntensityDays.map((date) => {
                  const point = trendByDate.get(date);
                  const levelIndex =
                    point?.emotionIntensity != null ? levelLabelIndex(point.emotionIntensity, INTENSITY_LABELS.length) : null;
                  return (
                    <Pressable
                      key={date}
                      onPress={() => router.push({ pathname: '/day/[date]', params: { date } })}
                      style={styles.intensityRow}
                    >
                      <ThemedText type="small" themeColor="textTertiary" style={styles.intensityDate}>
                        {date.slice(5)}
                      </ThemedText>
                      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                        {levelIndex != null && (
                          <View
                            style={[styles.fill, { width: `${(levelIndex + 1) * 20}%`, backgroundColor: theme.plum }]}
                          />
                        )}
                      </View>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.intensityLabel}>
                        {levelIndex == null ? '기록 없음' : INTENSITY_LABELS[levelIndex]}
                      </ThemedText>
                    </Pressable>
                  );
                })}
                <ThemedText type="small" themeColor="textTertiary" style={styles.hint}>
                  날짜를 누르면 그날의 기록으로 이동해요. 강도와 에너지는 서로 다른 축이라 겹쳐 보지 않아요.
                </ThemedText>
              </ThemedView>

              <View style={styles.gaugeRow}>
                <ThemedView type="backgroundElement" style={[styles.card, styles.gaugeCard]}>
                  <ArcGauge
                    levelIndex={modeEnergyIndex}
                    color={theme.moss}
                    label="자주 나타난 에너지"
                    valueLabel={modeEnergyIndex == null ? '기록 없음' : ENERGY_LABELS[modeEnergyIndex]}
                  />
                </ThemedView>
                <ThemedView type="backgroundElement" style={[styles.card, styles.gaugeCard]}>
                  <ArcGauge
                    levelIndex={modeIntensityIndex}
                    color={theme.plum}
                    label="자주 나타난 감정 강도"
                    valueLabel={modeIntensityIndex == null ? '기록 없음' : INTENSITY_LABELS[modeIntensityIndex]}
                  />
                </ThemedView>
              </View>

              <SectionHeading icon={{ ios: 'heart', android: 'favorite' }} title="기록에서 확인된 감정" style={styles.sectionHeading} />
              {emotionDistribution.length > 0 ? (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <BarsList
                    color={theme.slate}
                    items={emotionDistribution.slice(0, 8).map((item) => ({
                      label: item.tagName,
                      value: item.count,
                      onPress: () =>
                        router.push({
                          pathname: '/analytics/tag/[tagId]',
                          params: { tagId: item.tagId, tagName: item.tagName },
                        }),
                    }))}
                  />
                  <ThemedText type="small" themeColor="textTertiary" style={styles.hint}>
                    숫자는 그 감정이 확인된 기록 수예요. 많고 적음이 중요도를 뜻하지는 않아요.
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  이 기간에는 감정 기록이 없어요.
                </ThemedText>
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
  banner: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  bannerSub: {
    marginTop: Spacing.half,
  },
  sectionHeading: {
    marginTop: Spacing.four,
  },
  card: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hint: {
    marginTop: Spacing.two,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  intensityDate: {
    width: 40,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  intensityLabel: {
    width: 70,
    textAlign: 'right',
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  gaugeCard: {
    flex: 1,
  },
  empty: {
    marginTop: Spacing.four,
    textAlign: 'center',
  },
});
