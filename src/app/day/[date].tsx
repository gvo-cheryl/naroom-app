import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCheckIn, listEntries } from '@/api';
import { ApiError } from '@/api/errors';
import type { CheckInSummary, EntrySummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { LevelBar } from '@/components/level-bar';
import { NeedSummary } from '@/components/need-summary';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ENERGY_LABELS, INTENSITY_LABELS, levelLabelIndex } from '@/constants/checkin';
import { VISIBLE_ENTRY_TYPES, entryTypeLabel } from '@/constants/record';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 홈의 "최근 기록"을 눌렀을 때 보이는 하루 요약 화면. 그날 쓴 기록(유형별)과 그날의
// 체크인(있다면)을 함께 보여준다 - 둘 다 같은 날짜를 기준으로 조회하는 별개의 도메인이라
// 화면에서만 하나로 묶는다.
export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [checkIn, setCheckIn] = useState<CheckInSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const [dayEntries, dayCheckIn] = await Promise.all([
          listEntries(accessToken, { recordDate: date }),
          getCheckIn(accessToken, date),
        ]);
        if (!cancelled) {
          setEntries(dayEntries.filter((entry) => VISIBLE_ENTRY_TYPES.includes(entry.entryType)));
          setCheckIn(dayCheckIn);
        }
      } catch (error) {
        logger.error('day-detail', 'failed to load day detail', {
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
  }, [date]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title={date} />

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : (
            <>
              {entries.length === 0 && !checkIn && (
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  이 날은 남긴 기록이 없어요.
                </ThemedText>
              )}

              {entries.map((entry) => (
                <ThemedView key={entry.id} type="backgroundElement" style={styles.card}>
                  <ThemedText type="small" themeColor="textTertiary">
                    {entryTypeLabel(entry.entryType)}
                  </ThemedText>
                  {entry.title && (
                    <ThemedText type="default" style={styles.entryTitle}>
                      {entry.title}
                    </ThemedText>
                  )}
                  {entry.body && (
                    <ThemedText type="default" themeColor="textSecondary" style={styles.entryBody}>
                      {entry.body}
                    </ThemedText>
                  )}
                </ThemedView>
              ))}

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

                  {checkIn.gratitudeNote && (
                    <View style={styles.textBlock}>
                      <ThemedText type="small" themeColor="textTertiary">
                        감사했거나 다행이었던 일
                      </ThemedText>
                      <ThemedText type="default" themeColor="textSecondary" style={styles.textBlockBody}>
                        {checkIn.gratitudeNote}
                      </ThemedText>
                    </View>
                  )}

                  {checkIn.memorableEvent && (
                    <View style={styles.textBlock}>
                      <ThemedText type="small" themeColor="textTertiary">
                        마음에 남은 일
                      </ThemedText>
                      <ThemedText type="default" themeColor="textSecondary" style={styles.textBlockBody}>
                        {checkIn.memorableEvent}
                      </ThemedText>
                    </View>
                  )}
                </ThemedView>
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
  empty: {
    marginTop: Spacing.five,
    textAlign: 'center',
  },
  card: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  entryTitle: {
    marginTop: Spacing.one,
  },
  entryBody: {
    marginTop: Spacing.one,
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
  textBlock: {
    marginTop: Spacing.three,
  },
  textBlockBody: {
    marginTop: Spacing.half,
  },
});
