import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createPeriodReflection,
  getCalendar,
  getCurrentPersonalSummary,
  getEmotionEnergyTrend,
  getPeriodReflections,
  getTagDistribution,
  getTimeline,
} from "@/api";
import { ApiError } from "@/api/errors";
import type {
  CalendarDaySummary,
  EmotionEnergyPointSummary,
  EntryTimelineSummary,
  PersonalSummarySummary,
  PeriodReflectionFeatureType,
  PeriodReflectionSummary,
  TagCategory,
  TagDistributionSummary,
} from "@/api/types";
import { getValidAccessToken } from "@/auth/authManager";
import { DonutChart } from "@/components/charts/donut-chart";
import { EnergyRibbon, type RibbonDay } from "@/components/charts/energy-ribbon";
import { MiniRing } from "@/components/charts/mini-ring";
import { StackBar } from "@/components/charts/stack-bar";
import { WordCloud } from "@/components/charts/word-cloud";
import { SectionHeading } from "@/components/section-heading";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { ENERGY_LABELS, INTENSITY_LABELS, levelLabelIndex } from "@/constants/checkin";
import { periodReflectionFeatureTypeLabel, periodReflectionPreviewText } from "@/constants/lifetime";
import {
  ANALYTICS_RANGE_OPTIONS,
  EMOTION_GROUPS,
  TAG_CATEGORY_COLOR_KEY,
  emotionColorKey,
} from "@/constants/lifetime-analytics";
import { TAG_CATEGORY_LABELS, VISIBLE_ENTRY_TYPES, entryTypeLabel } from "@/constants/record";
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  type ThemeColor,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { buildLastDays, modeLevelIndex } from "@/lib/lifetime-days";
import { logger } from "@/lib/logger";

const HOME_KEYWORD_CATEGORY_ORDER: TagCategory[] = ["EMOTION", "SITUATION", "NEED", "VALUE", "ACTION", "RECOVERY"];

const ENTRY_TYPE_COLOR_KEY: Record<string, ThemeColor> = {
  FREE: "slate",
  EMOTION: "moss",
  GRATITUDE: "sand",
  PROMPT: "plum",
  QUOTE_REFLECTION: "clay",
};

const LIFETIME_INSUFFICIENT_RECORDS_CODE =
  "LIFETIME_PERIOD_REFLECTION_INSUFFICIENT_RECORDS";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function buildCalendarCells(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  return cells;
}

type TimelineItem =
  | { kind: "reflection"; timestamp: string; reflection: PeriodReflectionSummary }
  | { kind: "entry"; timestamp: string; entry: EntryTimelineSummary };

interface TimelineDateGroup {
  date: string;
  items: TimelineItem[];
}

type TimelineTypeFilter = "ALL" | "REFLECTION" | EntryTimelineSummary["entryType"];

const TIMELINE_TYPE_FILTERS: { id: TimelineTypeFilter; label: string }[] = [
  { id: "ALL", label: "전체" },
  { id: "FREE", label: "자유" },
  { id: "EMOTION", label: "감정" },
  { id: "GRATITUDE", label: "감사·다행" },
  { id: "PROMPT", label: "질문형" },
  { id: "QUOTE_REFLECTION", label: "문장" },
  { id: "REFLECTION", label: "회고" },
  { id: "SELF_SUMMARY", label: "나의 정리" },
];

// 프로토타입 L01처럼 최신 날짜가 먼저 오도록 묶는다. 지난 회고는 봉투 기록의 마지막 날(periodEnd)
// 기준으로 같은 날짜 그룹에 들어가되, 항상 맨 위가 아니라 실제 시각(requestedAt/createdAt) 순서로
// 그 날의 다른 기록과 섞여서 보인다.
function groupTimelineByDate(
  entries: EntryTimelineSummary[],
  reflections: PeriodReflectionSummary[],
): TimelineDateGroup[] {
  const byDate = new Map<string, TimelineItem[]>();
  const ensureItems = (date: string) => {
    let items = byDate.get(date);
    if (!items) {
      items = [];
      byDate.set(date, items);
    }
    return items;
  };
  reflections.forEach((reflection) =>
    ensureItems(reflection.periodEnd).push({ kind: "reflection", timestamp: reflection.requestedAt, reflection }),
  );
  entries.forEach((entry) => ensureItems(entry.recordDate).push({ kind: "entry", timestamp: entry.createdAt, entry }));
  return [...byDate.entries()]
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0)),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

// 프로토타입 L01(타임라인)/L02(캘린더)에 대응한다. 하나의 화면에서 뷰만 전환한다.
export default function LifetimeScreen() {
  const theme = useTheme();
  const today = todayIsoDate();

  const [view, setView] = useState<"home" | "calendar" | "timeline">("home");
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [calendarDays, setCalendarDays] = useState<CalendarDaySummary[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<
    EntryTimelineSummary[]
  >([]);
  const [timelineTypeFilter, setTimelineTypeFilter] =
    useState<TimelineTypeFilter>("ALL");
  const [creatingReflection, setCreatingReflection] =
    useState<PeriodReflectionFeatureType | null>(null);
  const [reflectionPickerOpen, setReflectionPickerOpen] = useState(false);
  const [reflectionNotice, setReflectionNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recentReflections, setRecentReflections] = useState<
    PeriodReflectionSummary[]
  >([]);

  const [homeRange, setHomeRange] = useState<7 | 14 | 30>(14);
  const [homeTrend, setHomeTrend] = useState<EmotionEnergyPointSummary[]>([]);
  const [homeTagDistribution, setHomeTagDistribution] = useState<TagDistributionSummary[]>([]);
  const [homeEntries, setHomeEntries] = useState<EntryTimelineSummary[]>([]);
  const [homePersonalSummary, setHomePersonalSummary] = useState<PersonalSummarySummary | null>(null);

  useEffect(() => {
    if (view !== "calendar") {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const days = await getCalendar(accessToken, year, month);
        if (!cancelled) {
          setCalendarDays(days);
        }
      } catch (error) {
        logger.error("lifetime", "failed to load calendar", {
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
  }, [view, year, month]);

  useEffect(() => {
    if (view !== "home") {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const days = buildLastDays(homeRange);
        const [trendPoints, tagDistribution, entries, personalSummary] = await Promise.all([
          getEmotionEnergyTrend(accessToken, homeRange),
          getTagDistribution(accessToken, { range: homeRange }),
          getTimeline(accessToken, { from: days[0], to: days[days.length - 1] }),
          getCurrentPersonalSummary(accessToken),
        ]);
        if (!cancelled) {
          setHomeTrend(trendPoints);
          setHomeTagDistribution(tagDistribution);
          setHomeEntries(entries);
          setHomePersonalSummary(personalSummary);
        }
      } catch (error) {
        logger.error("lifetime", "failed to load lifetime home", {
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
  }, [view, homeRange]);

  useEffect(() => {
    if (view !== "timeline") {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const entries = await getTimeline(accessToken);
        if (!cancelled) {
          // "회고"(봉투 Entry)는 여기서 제외한다 - recentReflections를 통해 별도 카드로 렌더링한다.
          // "나의 정리"(SELF_SUMMARY)는 필터로 골라볼 수 있게 함께 담아둔다.
          setTimelineEntries(
            entries.filter(
              (entry) =>
                VISIBLE_ENTRY_TYPES.includes(entry.entryType) || entry.entryType === "SELF_SUMMARY",
            ),
          );
        }
      } catch (error) {
        logger.error("lifetime", "failed to load timeline", {
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
  }, [view]);

  // 화면에 다시 포커스될 때마다 새로고침한다 - 회고 생성/조회 화면에서 돌아왔을 때 최신 상태(완료/실패 여부,
  // 새로 생성된 회고)가 바로 보이게 하기 위함이다.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const accessToken = await getValidAccessToken();
          if (!accessToken) {
            return;
          }
          const reflections = await getPeriodReflections(accessToken);
          if (!cancelled) {
            setRecentReflections(reflections);
          }
        } catch (error) {
          logger.error("lifetime", "failed to load recent period reflections", {
            code: error instanceof ApiError ? error.code : undefined,
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const changeMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  const showToast = (message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2500);
  };

  // 캘린더/홈 탭에서 누르면(그대로 화면에 남아있는 버튼) 원래 문구 그대로 버튼 위에 계속 보여주고,
  // 타임라인의 "+회고"에서 누르면 잠깐 떴다 사라지는 토스트로 보여준다.
  const notifyReflectionIneligible = (message: string, toastMessage: string) => {
    if (view === "timeline") {
      showToast(toastMessage);
    } else {
      setReflectionNotice(message);
    }
  };

  const handleCreatePeriodReflection = async (
    featureType: PeriodReflectionFeatureType,
  ) => {
    if (creatingReflection) {
      return;
    }
    setReflectionPickerOpen(false);
    setReflectionNotice(null);
    setCreatingReflection(featureType);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      const reflection = await createPeriodReflection(accessToken, featureType);
      // 이미 끝난 상태로 돌아왔다면 새로 만든 게 아니라 이전 기간의 결과를 그대로 돌려받은 것이다 -
      // 아직 다음 회고를 만들 수 있는 기간이 아니라는 뜻이라 화면 이동 대신 안내만 보여준다.
      if (
        reflection.status === "COMPLETED" ||
        reflection.status === "BLOCKED" ||
        reflection.status === "SAFETY_SUPPORT"
      ) {
        notifyReflectionIneligible(
          "아직 새로 만들 수 있는 기간이 아니에요. 지난 회고에서 확인해 보세요.",
          "아직 새로 만들 수 있는 기간이 아니에요.",
        );
        return;
      }
      router.push({
        pathname: "/period-reflection/[id]",
        params: { id: reflection.id },
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === LIFETIME_INSUFFICIENT_RECORDS_CODE
      ) {
        notifyReflectionIneligible(
          "아직 회고를 만들기에 기록이 충분하지 않아요. 며칠 더 기록을 남겨보세요.",
          "아직 회고를 만들기에 기록이 충분하지 않아요.",
        );
      } else {
        logger.error("lifetime", "failed to create period reflection", {
          code: error instanceof ApiError ? error.code : undefined,
        });
        notifyReflectionIneligible(
          "회고를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
          "회고를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
      }
    } finally {
      setCreatingReflection(null);
    }
  };

  const homeDays = buildLastDays(homeRange);
  const homeTrendByDate = new Map(homeTrend.map((point) => [point.date, point]));
  const homeVisibleEntries = homeEntries.filter((entry) => VISIBLE_ENTRY_TYPES.includes(entry.entryType));
  const homeRecordDates = new Set(homeEntries.map((entry) => entry.recordDate));
  const homeRibbonDays: RibbonDay[] = homeDays.map((date) => ({
    date,
    energy: homeTrendByDate.get(date)?.energyLevel ?? null,
    hasRecord: homeRecordDates.has(date),
  }));
  const homeCheckInDayCount = homeTrend.length;
  const homeScarce = homeCheckInDayCount < 3;

  const homeEnergyLevelIndexes = homeTrend
    .filter((point) => point.energyLevel != null)
    .map((point) => levelLabelIndex(point.energyLevel as number, ENERGY_LABELS.length));
  const homeIntensityLevelIndexes = homeTrend
    .filter((point) => point.emotionIntensity != null)
    .map((point) => levelLabelIndex(point.emotionIntensity as number, INTENSITY_LABELS.length));
  const homeModeEnergyIndex = modeLevelIndex(homeEnergyLevelIndexes);
  const homeModeIntensityIndex = modeLevelIndex(homeIntensityLevelIndexes);

  const homeEmotionItems = homeTagDistribution.filter((item) => item.category === "EMOTION");
  const homeTopEmotions = [...homeEmotionItems].sort((a, b) => b.count - a.count).slice(0, 8);
  const homeEmotionGroupParts = EMOTION_GROUPS.map((group) => ({
    label: group.group,
    value: homeEmotionItems
      .filter((item) => emotionColorKey(item.tagName) === group.colorKey)
      .reduce((sum, item) => sum + item.count, 0),
    color: theme[group.colorKey] as string,
  }));

  const homeKeywordStackParts = HOME_KEYWORD_CATEGORY_ORDER.map((category) => ({
    label: TAG_CATEGORY_LABELS[category],
    value: homeTagDistribution.filter((item) => item.category === category).reduce((sum, item) => sum + item.count, 0),
    color: theme[TAG_CATEGORY_COLOR_KEY[category]] as string,
  }));
  const homeWordCloudItems = [...homeTagDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      label: item.tagName,
      value: item.count,
      color: theme[TAG_CATEGORY_COLOR_KEY[item.category]] as string,
      onPress: () =>
        router.push({ pathname: "/analytics/tag/[tagId]", params: { tagId: item.tagId, tagName: item.tagName } }),
    }));

  const homeEntryTypeParts = VISIBLE_ENTRY_TYPES.map((entryType) => ({
    label: entryTypeLabel(entryType),
    value: homeVisibleEntries.filter((entry) => entry.entryType === entryType).length,
    color: theme[ENTRY_TYPE_COLOR_KEY[entryType]] as string,
  }));

  const homeRecentReflections = recentReflections.filter(
    (reflection) => reflection.periodEnd >= homeDays[0] && reflection.periodEnd <= homeDays[homeDays.length - 1],
  );
  const homeRecentItems = groupTimelineByDate(homeVisibleEntries, homeRecentReflections)
    .flatMap((group) => group.items)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0))
    .slice(0, 4);

  const calendarDayByDate = new Map(calendarDays.map((day) => [day.date, day]));
  const cells = buildCalendarCells(year, month);
  const filteredTimelineEntries = timelineEntries.filter((entry) => {
    if (timelineTypeFilter === "ALL") {
      return VISIBLE_ENTRY_TYPES.includes(entry.entryType);
    }
    if (timelineTypeFilter === "REFLECTION") {
      return false;
    }
    return entry.entryType === timelineTypeFilter;
  });
  const showReflectionsInTimeline = timelineTypeFilter === "ALL" || timelineTypeFilter === "REFLECTION";
  const timelineGroups = groupTimelineByDate(
    filteredTimelineEntries,
    showReflectionsInTimeline ? recentReflections : [],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="default" style={styles.headerTitle}>
            LifeTime
          </ThemedText>
          <View style={styles.viewToggle}>
            {(["home", "timeline", "calendar"] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setView(mode)}
                style={[
                  styles.viewToggleOption,
                  {
                    backgroundColor:
                      view === mode ? theme.text : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color:
                      view === mode ? theme.background : theme.textSecondary,
                  }}
                >
                  {mode === "home" ? "홈" : mode === "calendar" ? "캘린더" : "타임라인"}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {view === "home" ? (
            <>
              <View style={styles.rangeRow}>
                {ANALYTICS_RANGE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.days}
                    onPress={() => setHomeRange(option.days)}
                    style={[
                      styles.rangeChip,
                      { backgroundColor: homeRange === option.days ? theme.text : theme.backgroundElement },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{ color: homeRange === option.days ? theme.background : theme.textSecondary }}
                    >
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
                    {homeDays[0]} ~ {homeDays[homeDays.length - 1]} · 기록 {homeVisibleEntries.length}개 · 체크인{" "}
                    {homeCheckInDayCount}일
                  </ThemedText>

                  {homeScarce && (
                    <ThemedView type="backgroundElement" style={styles.banner}>
                      <ThemedText type="default">아직 흐름을 말하기에는 기록이 적어요</ThemedText>
                      <ThemedText type="small" themeColor="textTertiary" style={styles.bannerSub}>
                        이 기간에 남은 체크인은 {homeCheckInDayCount}일이에요. 며칠 더 쌓이면 함께 살펴볼 수 있어요.
                      </ThemedText>
                    </ThemedView>
                  )}

                  <View style={styles.overviewRow}>
                    <ThemedView type="backgroundElement" style={[styles.card, styles.overviewCard]}>
                      <ThemedText type="small" themeColor="textTertiary">
                        이 기간의 기록
                      </ThemedText>
                      <ThemedText type="default" style={styles.overviewValue}>
                        {homeVisibleEntries.length}개
                      </ThemedText>
                    </ThemedView>
                    <ThemedView type="backgroundElement" style={[styles.card, styles.overviewCard]}>
                      <ThemedText type="small" themeColor="textTertiary">
                        자주 나타난 감정
                      </ThemedText>
                      <ThemedText type="default" style={styles.overviewValue}>
                        {homeTopEmotions[0]?.tagName ?? "기록 없음"}
                      </ThemedText>
                    </ThemedView>
                  </View>

                  <SectionHeading icon={{ ios: "gauge.medium", android: "speed" }} title="강도와 에너지의 결" style={styles.sectionHeading} />
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <View style={styles.ringRow}>
                      <MiniRing
                        pct={homeModeIntensityIndex == null ? null : (homeModeIntensityIndex + 1) * 20}
                        color={theme.plum}
                        label="감정 강도"
                        valueLabel={homeModeIntensityIndex == null ? "" : INTENSITY_LABELS[homeModeIntensityIndex]}
                      />
                      <MiniRing
                        pct={homeModeEnergyIndex == null ? null : (homeModeEnergyIndex + 1) * 20}
                        color={theme.moss}
                        label="에너지"
                        valueLabel={homeModeEnergyIndex == null ? "" : ENERGY_LABELS[homeModeEnergyIndex]}
                      />
                    </View>
                  </ThemedView>

                  <SectionHeading icon={{ ios: "wave.3.right", android: "waves" }} title="에너지 흐름" style={styles.sectionHeading} />
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <EnergyRibbon days={homeRibbonDays} />
                  </ThemedView>
                  <Pressable onPress={() => router.push("/analytics/emotion-energy")} style={styles.quickNavLink}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.quickNavLinkText}>
                      감정 · 에너지 자세히 보기 ›
                    </ThemedText>
                  </Pressable>

                  <SectionHeading icon={{ ios: "heart", android: "favorite" }} title="감정의 결 비율" style={styles.sectionHeading} />
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <DonutChart parts={homeEmotionGroupParts} />
                    {homeTopEmotions.length > 0 && (
                      <View style={styles.chipRow}>
                        {homeTopEmotions.map((item) => (
                          <Pressable
                            key={item.tagId}
                            onPress={() =>
                              router.push({
                                pathname: "/analytics/tag/[tagId]",
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

                  <SectionHeading icon={{ ios: "cloud", android: "cloud" }} title="키워드 구성" style={styles.sectionHeading} />
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <StackBar parts={homeKeywordStackParts} />
                    <View style={styles.wordCloudSpacing}>
                      <WordCloud items={homeWordCloudItems} />
                    </View>
                  </ThemedView>
                  <Pressable onPress={() => router.push("/analytics/keywords")} style={styles.quickNavLink}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.quickNavLinkText}>
                      키워드 자세히 보기 ›
                    </ThemedText>
                  </Pressable>

                  <SectionHeading icon={{ ios: "square.grid.2x2", android: "grid_view" }} title="기록 유형" style={styles.sectionHeading} />
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <DonutChart parts={homeEntryTypeParts} />
                  </ThemedView>

                  <View style={styles.recentHeaderRow}>
                    <SectionHeading icon={{ ios: "clock", android: "schedule" }} title="최근 기록" />
                    <Pressable onPress={() => setView("timeline")} hitSlop={8}>
                      <ThemedText type="small" themeColor="textSecondary">
                        전체 보기 ›
                      </ThemedText>
                    </Pressable>
                  </View>
                  {homeRecentItems.length === 0 ? (
                    <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                      아직 기록이 없어요.
                    </ThemedText>
                  ) : (
                    homeRecentItems.map((item) =>
                      item.kind === "reflection" ? (
                        <Pressable
                          key={`home-reflection-${item.reflection.id}`}
                          onPress={() =>
                            router.push({ pathname: "/period-reflection/[id]", params: { id: item.reflection.id } })
                          }
                        >
                          <ThemedView type="backgroundElement" style={styles.entryCard}>
                            <ThemedText type="small" themeColor="textTertiary">
                              {periodReflectionFeatureTypeLabel(item.reflection.featureType)}
                            </ThemedText>
                            <ThemedText type="default" style={styles.entryBody} numberOfLines={2}>
                              {periodReflectionPreviewText(item.reflection)}
                            </ThemedText>
                          </ThemedView>
                        </Pressable>
                      ) : (
                        <Pressable
                          key={`home-entry-${item.entry.id}`}
                          onPress={() => router.push({ pathname: "/entry/[entryId]", params: { entryId: item.entry.id } })}
                        >
                          <ThemedView type="backgroundElement" style={styles.entryCard}>
                            <ThemedText type="small" themeColor="textTertiary">
                              {entryTypeLabel(item.entry.entryType)}
                            </ThemedText>
                            <ThemedText type="default" style={styles.entryBody} numberOfLines={2}>
                              {item.entry.title || item.entry.body || "내용 없음"}
                            </ThemedText>
                          </ThemedView>
                        </Pressable>
                      ),
                    )
                  )}

                  <SectionHeading icon={{ ios: "doc.text", android: "description" }} title="나의 정리" style={styles.sectionHeading} />
                  <Pressable onPress={() => router.push("/personal-summary")}>
                    <ThemedView type="backgroundElement" style={styles.card}>
                      {homePersonalSummary ? (
                        <>
                          <ThemedText type="default" numberOfLines={2} style={styles.entryBody}>
                            {homePersonalSummary.content}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={styles.quickNavLinkText}>
                            자세히 보기 ›
                          </ThemedText>
                        </>
                      ) : (
                        <>
                          <ThemedText type="default" themeColor="textSecondary">
                            아직 나의 정리를 쓰지 않았어요.
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={styles.quickNavLinkText}>
                            지금 써보기 ›
                          </ThemedText>
                        </>
                      )}
                    </ThemedView>
                  </Pressable>

                  <AppButton
                    title="이번 주 돌아보기"
                    style={styles.weeklyReflectionButton}
                    loading={creatingReflection === "WEEKLY_REFLECTION"}
                    disabled={creatingReflection !== null}
                    onPress={() => handleCreatePeriodReflection("WEEKLY_REFLECTION")}
                  />
                  {reflectionNotice && (
                    <ThemedText type="small" themeColor="clay" style={styles.reflectionNotice}>
                      {reflectionNotice}
                    </ThemedText>
                  )}
                </>
              )}
            </>
          ) : view === "calendar" ? (
            <>
              <View style={styles.monthNav}>
                <Pressable
                  onPress={() => changeMonth(-1)}
                  hitSlop={8}
                  style={styles.monthNavButton}
                >
                  <ThemedText type="default">‹</ThemedText>
                </Pressable>
                <ThemedText type="default">
                  {year}년 {month}월
                </ThemedText>
                <Pressable
                  onPress={() => changeMonth(1)}
                  hitSlop={8}
                  style={styles.monthNavButton}
                >
                  <ThemedText type="default">›</ThemedText>
                </Pressable>
              </View>
              <ThemedText
                type="small"
                themeColor="textTertiary"
                style={styles.monthSummary}
              >
                기록 {calendarDays.filter((day) => day.hasEntry).length}일 ·
                체크인 {calendarDays.filter((day) => day.hasCheckIn).length}일
              </ThemedText>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <ThemedText
                    key={label}
                    type="small"
                    themeColor="textTertiary"
                    style={styles.weekdayCell}
                  >
                    {label}
                  </ThemedText>
                ))}
              </View>

              {loading ? (
                <ActivityIndicator
                  style={styles.loading}
                  color={theme.textSecondary}
                />
              ) : (
                <View style={styles.calendarGrid}>
                  {cells.map((date, index) => {
                    if (!date) {
                      return (
                        <View key={`blank-${index}`} style={styles.dayCell} />
                      );
                    }
                    const day = calendarDayByDate.get(date);
                    const isToday = date === today;
                    return (
                      <Pressable
                        key={date}
                        onPress={() =>
                          router.push({
                            pathname: "/day/[date]",
                            params: { date },
                          })
                        }
                        style={styles.dayCell}
                      >
                        <View
                          style={[
                            styles.dayNumberWrap,
                            isToday && { backgroundColor: theme.text },
                          ]}
                        >
                          <ThemedText
                            type="small"
                            style={
                              isToday ? { color: theme.background } : undefined
                            }
                          >
                            {Number(date.slice(8, 10))}
                          </ThemedText>
                        </View>
                        <View style={styles.dayDots}>
                          {day?.hasEntry && (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: theme.moss },
                              ]}
                            />
                          )}
                          {day?.hasCheckIn && (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: theme.slate },
                              ]}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendSwatch,
                      { backgroundColor: theme.slate },
                    ]}
                  />
                  <ThemedText type="small" themeColor="textTertiary">
                    체크인한 날
                  </ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendSwatch,
                      { backgroundColor: theme.moss },
                    ]}
                  />
                  <ThemedText type="small" themeColor="textTertiary">
                    기록이 있는 날
                  </ThemedText>
                </View>
              </View>

              <ThemedView type="backgroundElement" style={styles.reflectionCard}>
                <SectionHeading icon={{ ios: "text.book.closed", android: "menu_book" }} title="지난 회고" />
                {recentReflections.length > 0 ? (
                  <View style={styles.pastReflectionList}>
                    {recentReflections.map((reflection) => (
                      <Pressable
                        key={reflection.id}
                        onPress={() =>
                          router.push({
                            pathname: "/period-reflection/[id]",
                            params: { id: reflection.id },
                          })
                        }
                        style={styles.pastReflectionRow}
                      >
                        <ThemedText type="small" themeColor="textTertiary">
                          {periodReflectionFeatureTypeLabel(reflection.featureType)} · {reflection.periodStart} ~{" "}
                          {reflection.periodEnd}
                        </ThemedText>
                        <ThemedText type="default" numberOfLines={2} style={styles.pastReflectionSummary}>
                          {periodReflectionPreviewText(reflection)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textTertiary" style={styles.pastReflectionEmpty}>
                    아직 만든 회고가 없어요.
                  </ThemedText>
                )}

                {reflectionNotice && (
                  <ThemedText type="small" themeColor="clay" style={styles.reflectionNotice}>
                    {reflectionNotice}
                  </ThemedText>
                )}

                <View style={styles.reflectionButtons}>
                  <AppButton
                    title="3일 회고"
                    variant="ghost"
                    style={styles.reflectionButton}
                    loading={creatingReflection === "THREE_DAY_REFLECTION"}
                    disabled={creatingReflection !== null}
                    onPress={() => handleCreatePeriodReflection("THREE_DAY_REFLECTION")}
                  />
                  <AppButton
                    title="주간 회고"
                    variant="ghost"
                    style={styles.reflectionButton}
                    loading={creatingReflection === "WEEKLY_REFLECTION"}
                    disabled={creatingReflection !== null}
                    onPress={() => handleCreatePeriodReflection("WEEKLY_REFLECTION")}
                  />
                </View>
              </ThemedView>
            </>
          ) : (
            <>
              <View style={styles.timelineFilterRow}>
                {TIMELINE_TYPE_FILTERS.map((filter) => (
                  <Pressable
                    key={filter.id}
                    onPress={() => setTimelineTypeFilter(filter.id)}
                    style={[
                      styles.timelineFilterChip,
                      {
                        backgroundColor:
                          timelineTypeFilter === filter.id ? theme.text : theme.backgroundElement,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: timelineTypeFilter === filter.id ? theme.background : theme.textSecondary,
                      }}
                    >
                      {filter.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {loading ? (
                <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
              ) : timelineGroups.length === 0 ? (
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  아직 기록이 없어요.
                </ThemedText>
              ) : (
                timelineGroups.map((group, index) => (
                  <View key={group.date}>
                    <View style={styles.timelineDateHeaderRow}>
                      <View style={styles.timelineDateHeader}>
                        <SymbolView
                          name={{ ios: "clock", android: "schedule" }}
                          size={13}
                          tintColor={theme.textTertiary}
                        />
                        <ThemedText type="small" themeColor="textTertiary">
                          {group.date}
                        </ThemedText>
                      </View>
                      {index === 0 && timelineTypeFilter === "ALL" && (
                        <Pressable
                          onPress={() => setReflectionPickerOpen(true)}
                          style={[styles.addReflectionButton, { borderColor: theme.border }]}
                        >
                          <SymbolView name={{ ios: "plus", android: "add" }} size={13} tintColor={theme.textSecondary} />
                          <ThemedText type="small" themeColor="textSecondary">
                            회고
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                    {group.items.map((item) =>
                      item.kind === "reflection" ? (
                        <Pressable
                          key={`reflection-${item.reflection.id}`}
                          onPress={() =>
                            router.push({
                              pathname: "/period-reflection/[id]",
                              params: { id: item.reflection.id },
                            })
                          }
                        >
                          <ThemedView type="backgroundElement" style={styles.entryCard}>
                            <View style={styles.timelineReflectionTitleRow}>
                              <ThemedText type="small" themeColor="textTertiary">
                                지난 회고
                              </ThemedText>
                              <View style={[styles.timelineReflectionTag, { borderColor: theme.border }]}>
                                <ThemedText type="small" themeColor="textSecondary">
                                  {periodReflectionFeatureTypeLabel(item.reflection.featureType)}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText type="small" themeColor="textTertiary" style={styles.timelineReflectionRange}>
                              {item.reflection.periodStart} ~ {item.reflection.periodEnd}
                            </ThemedText>
                            <ThemedText type="default" style={styles.entryBody} numberOfLines={2}>
                              {periodReflectionPreviewText(item.reflection)}
                            </ThemedText>
                          </ThemedView>
                        </Pressable>
                      ) : (
                        <Pressable
                          key={`entry-${item.entry.id}`}
                          onPress={() =>
                            router.push({
                              pathname: "/entry/[entryId]",
                              params: { entryId: item.entry.id },
                            })
                          }
                        >
                          <ThemedView type="backgroundElement" style={styles.entryCard}>
                            <ThemedText type="small" themeColor="textTertiary">
                              {entryTypeLabel(item.entry.entryType)}
                            </ThemedText>
                            <ThemedText type="default" style={styles.entryBody} numberOfLines={2}>
                              {item.entry.title || item.entry.body || "내용 없음"}
                            </ThemedText>
                            {item.entry.tags.filter((entryTag) => entryTag.state !== "REJECTED").length > 0 && (
                              <View style={styles.entryTagChips}>
                                {item.entry.tags
                                  .filter((entryTag) => entryTag.state !== "REJECTED")
                                  .map((entryTag) => (
                                    <ThemedView key={entryTag.id} type="backgroundSelected" style={styles.entryTagChip}>
                                      <ThemedText type="small" themeColor="textSecondary">
                                        {entryTag.tag.name}
                                      </ThemedText>
                                    </ThemedView>
                                  ))}
                              </View>
                            )}
                          </ThemedView>
                        </Pressable>
                      ),
                    )}
                  </View>
                ))
              )}
            </>
          )}

        </ScrollView>

        <Modal
          visible={reflectionPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setReflectionPickerOpen(false)}
        >
          <Pressable style={styles.pickerBackdrop} onPress={() => setReflectionPickerOpen(false)}>
            <Pressable style={[styles.pickerSheet, { backgroundColor: theme.backgroundElement }]} onPress={() => {}}>
              <ThemedText type="default" style={styles.pickerTitle}>
                어떤 회고를 만들까요?
              </ThemedText>
              <Pressable
                style={[styles.pickerOption, { borderColor: theme.border }]}
                onPress={() => handleCreatePeriodReflection("THREE_DAY_REFLECTION")}
              >
                <ThemedText type="default">3일 회고</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.pickerOption, { borderColor: theme.border }]}
                onPress={() => handleCreatePeriodReflection("WEEKLY_REFLECTION")}
              >
                <ThemedText type="default">주간 회고</ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {toastMessage && (
          <View style={styles.toastWrap} pointerEvents="none">
            <View style={[styles.toast, { backgroundColor: theme.text }]}>
              <ThemedText type="small" style={{ color: theme.background }}>
                {toastMessage}
              </ThemedText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  sectionHeading: {
    marginTop: Spacing.four,
  },
  rangeRow: {
    flexDirection: "row",
    gap: Spacing.one,
  },
  rangeChip: {
    height: 30,
    justifyContent: "center",
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
  overviewRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  overviewCard: {
    flex: 1,
    marginTop: 0,
  },
  overviewValue: {
    marginTop: Spacing.one,
    fontSize: 17,
    fontWeight: "700",
  },
  ringRow: {
    flexDirection: "row",
    gap: Spacing.four,
  },
  quickNavLink: {
    alignSelf: "flex-end",
    marginTop: Spacing.two,
  },
  quickNavLinkText: {
    marginTop: Spacing.one,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  chip: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  wordCloudSpacing: {
    marginTop: Spacing.three,
  },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.four,
  },
  weeklyReflectionButton: {
    marginTop: Spacing.four,
  },
  safeArea: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  viewToggle: {
    flexDirection: "row",
    gap: Spacing.one,
  },
  viewToggleOption: {
    height: 34,
    justifyContent: "center",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  scrollContent: {
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  reflectionCard: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  reflectionNotice: {
    marginTop: Spacing.three,
  },
  reflectionButtons: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  reflectionButton: {
    flex: 1,
  },
  pastReflectionList: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  pastReflectionRow: {
    gap: Spacing.half,
  },
  pastReflectionSummary: {
    lineHeight: 20,
  },
  pastReflectionEmpty: {
    marginTop: Spacing.three,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  pickerSheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  pickerTitle: {
    marginBottom: Spacing.one,
    textAlign: "center",
  },
  pickerOption: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    alignItems: "center",
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: BottomTabInset + Spacing.six,
    alignItems: "center",
  },
  toast: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
  },
  monthNavButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  monthSummary: {
    marginTop: Spacing.one,
    textAlign: "center",
  },
  weekdayRow: {
    flexDirection: "row",
    marginTop: Spacing.four,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
  },
  loading: {
    marginTop: Spacing.five,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.two,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
  },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDots: {
    flexDirection: "row",
    gap: 3,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  empty: {
    marginTop: Spacing.five,
    textAlign: "center",
  },
  timelineDateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.four,
  },
  timelineDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  addReflectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  timelineFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  timelineFilterChip: {
    height: 30,
    justifyContent: "center",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  timelineReflectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  timelineReflectionTag: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  timelineReflectionRange: {
    marginTop: Spacing.two,
  },
  entryCard: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  entryBody: {
    marginTop: Spacing.one,
  },
  entryTagChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  entryTagChip: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
