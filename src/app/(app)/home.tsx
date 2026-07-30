import { useFocusEffect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTodayCheckIn, getTodayQuote, listEntries, saveQuote, unsaveQuote } from '@/api';
import { ApiError } from '@/api/errors';
import type { CheckInSummary, EntrySummary, QuoteSummary } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { getValidAccessToken } from '@/auth/authManager';
import { LevelBar } from '@/components/level-bar';
import { NeedSummary } from '@/components/need-summary';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { ENERGY_LABELS, INTENSITY_LABELS, levelLabelIndex } from '@/constants/checkin';
import { VISIBLE_ENTRY_TYPES, entryTypeLabel } from '@/constants/record';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 H01(홈)의 인사 톤만 가져온 간략 버전이다. 작은 실험 등은
// 아직 해당 API가 없어 이번 범위에 넣지 않는다. 체크인과 기록 작성(R01~)만 연결한다.
export default function HomeScreen() {
  const { state, logout } = useAuth();
  const theme = useTheme();
  const displayName = state.status === 'active' ? state.account.displayName : '';

  const [todayCheckIn, setTodayCheckIn] = useState<CheckInSummary | null>(null);
  const [latestEntry, setLatestEntry] = useState<EntrySummary | null>(null);
  const [todayQuote, setTodayQuote] = useState<QuoteSummary | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);

  // 체크인/기록을 마치고 돌아올 때마다 홈에 최신 상태가 보이도록 화면에 다시 포커스될 때마다 새로고침한다.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const accessToken = await getValidAccessToken();
          if (!accessToken) {
            return;
          }
          const [checkIn, entries, quote] = await Promise.all([
            getTodayCheckIn(accessToken),
            listEntries(accessToken),
            getTodayQuote(accessToken),
          ]);
          if (cancelled) {
            return;
          }
          setTodayCheckIn(checkIn);
          setLatestEntry(entries.find((entry) => VISIBLE_ENTRY_TYPES.includes(entry.entryType)) ?? null);
          setTodayQuote(quote);
        } catch (error) {
          logger.error('home', 'failed to load home summary', {
            code: error instanceof ApiError ? error.code : undefined,
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleToggleSaveQuote = async () => {
    if (!todayQuote || savingQuote) {
      return;
    }
    const nextSaved = !todayQuote.saved;
    setTodayQuote({ ...todayQuote, saved: nextSaved });
    setSavingQuote(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      if (nextSaved) {
        await saveQuote(accessToken, todayQuote.id);
      } else {
        await unsaveQuote(accessToken, todayQuote.id);
      }
      // 낙관적 업데이트만 믿지 않고 서버 상태를 다시 확인해서 실제 저장 여부와 어긋나지 않게 한다.
      const refreshed = await getTodayQuote(accessToken);
      setTodayQuote(refreshed);
    } catch (error) {
      logger.error('home', 'failed to toggle quote save', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setTodayQuote((prev) => (prev ? { ...prev, saved: !nextSaved } : prev));
    } finally {
      setSavingQuote(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="eyebrow" themeColor="textTertiary">
            오늘의 인사
          </ThemedText>
          <ThemedText type="heading" style={styles.heading}>
            {displayName ? `${displayName}님,\n` : ''}오늘은 어떤 마음으로{'\n'}시작하고 있나요?
          </ThemedText>

          {todayQuote && (
            <ThemedView type="backgroundElement" style={[styles.card, styles.cardFilled]}>
              <View style={styles.quoteHeader}>
                <SectionHeading icon={{ ios: 'quote.opening', android: 'format_quote' }} title="오늘의 문장" />
                <Pressable
                  onPress={() => router.push('/quotes/saved')}
                  hitSlop={8}
                  style={styles.savedQuotesLink}
                  accessibilityLabel="저장한 문장 모음">
                  <SymbolView
                    name={{ ios: 'bookmark', android: 'bookmark_border' }}
                    size={20}
                    tintColor={theme.textTertiary}
                  />
                </Pressable>
              </View>
              <ThemedText type="heading" style={styles.quoteText}>
                {todayQuote.text}
              </ThemedText>
              {todayQuote.authorName && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.quoteAuthor}>
                  — {todayQuote.authorName}
                </ThemedText>
              )}
              <View style={styles.quoteActions}>
                <Pressable
                  onPress={handleToggleSaveQuote}
                  disabled={savingQuote}
                  hitSlop={8}
                  style={styles.heartButton}
                  accessibilityLabel={todayQuote.saved ? '저장 취소' : '문장 저장'}>
                  <SymbolView
                    name={{
                      ios: todayQuote.saved ? 'heart.fill' : 'heart',
                      android: todayQuote.saved ? 'favorite' : 'favorite_border',
                    }}
                    size={22}
                    tintColor={todayQuote.saved ? theme.text : theme.textTertiary}
                  />
                </Pressable>
                <AppButton
                  title="이 문장으로 기록하기"
                  variant="ghost"
                  style={styles.quoteActionButton}
                  onPress={() => router.push({ pathname: '/record/write', params: { type: 'QUOTE_REFLECTION' } })}
                />
              </View>
            </ThemedView>
          )}

          {todayCheckIn ? (
            <ThemedView type="backgroundElement" style={[styles.card, styles.cardFilled]}>
              <SectionHeading icon={{ ios: 'checkmark.circle.fill', android: 'check_circle' }} title="오늘의 체크인" />

              {todayCheckIn.emotions.length > 0 && (
                <View style={styles.chipsLeft}>
                  {todayCheckIn.emotions.map((tag) => (
                    <ThemedView key={tag.id} type="backgroundSelected" style={styles.chip}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {tag.name}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </View>
              )}

              {todayCheckIn.emotionIntensity !== null && (
                <LevelBar
                  label="감정 강도"
                  value={todayCheckIn.emotionIntensity}
                  levelLabel={INTENSITY_LABELS[levelLabelIndex(todayCheckIn.emotionIntensity, INTENSITY_LABELS.length)]}
                  color={theme.text}
                />
              )}
              {todayCheckIn.energyLevel !== null && (
                <LevelBar
                  label="오늘의 에너지"
                  value={todayCheckIn.energyLevel}
                  levelLabel={ENERGY_LABELS[levelLabelIndex(todayCheckIn.energyLevel, ENERGY_LABELS.length)]}
                  color={theme.text}
                />
              )}

              {todayCheckIn.currentNeed && <NeedSummary need={todayCheckIn.currentNeed} />}

              <AppButton
                title="체크인 수정하기"
                variant="ghost"
                style={styles.cardButton}
                onPress={() => router.push('/checkin')}
              />
            </ThemedView>
          ) : (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="default">오늘의 마음을 확인해 보세요.</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.cardHint}>
                감정과 에너지를 선택으로 가볍게 남길 수 있어요.
              </ThemedText>
              <AppButton
                title="오늘의 체크인"
                style={styles.cardButton}
                onPress={() => router.push('/checkin')}
              />
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={styles.card}>
            {latestEntry ? (
              <Pressable
                style={styles.pressableFill}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date: latestEntry.recordDate } })}>
                <ThemedText type="small" themeColor="textTertiary">
                  최근 기록 · {entryTypeLabel(latestEntry.entryType)} · {latestEntry.recordDate}
                </ThemedText>
                <ThemedText type="default" style={styles.cardHint} numberOfLines={3}>
                  {latestEntry.title || latestEntry.body || '내용 없음'}
                </ThemedText>
              </Pressable>
            ) : (
              <>
                <ThemedText type="default">아직 기록이 없어요.</ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.cardHint}>
                  한 문장만 남겨도 충분해요.
                </ThemedText>
              </>
            )}
            <AppButton
              title="지금 기록하기"
              style={styles.cardButton}
              onPress={() => router.push('/record/type')}
            />
          </ThemedView>
        </ScrollView>

        <ThemedText type="small" themeColor="textTertiary" style={styles.logout} onPress={logout}>
          로그아웃
        </ThemedText>
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
    paddingTop: Spacing.four,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.three,
  },
  heading: {
    marginTop: Spacing.one,
  },
  card: {
    marginTop: Spacing.four,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: 'center',
  },
  cardFilled: {
    alignItems: 'stretch',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedQuotesLink: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    marginTop: Spacing.three,
  },
  quoteAuthor: {
    marginTop: Spacing.two,
  },
  quoteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  heartButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteActionButton: {
    flex: 1,
  },
  cardHint: {
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  pressableFill: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  chipsLeft: {
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
  cardButton: {
    marginTop: Spacing.four,
  },
  logout: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
});
