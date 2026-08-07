import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotificationPreferences, updateNotificationPreference } from '@/api';
import { ApiError } from '@/api/errors';
import type { NotificationPreferenceSummary, NotificationType } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { notificationTypeLabel } from '@/constants/notification';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const TYPE_ORDER: NotificationType[] = ['WEEKLY_REFLECTION', 'EXPERIMENT_MISSION', 'DAILY_QUOTE'];

const TIME_OPTIONS = ['07:00:00', '09:00:00', '12:00:00', '18:00:00', '21:00:00', '22:00:00'];

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

function formatTime(localTime: string | null): string {
  return localTime ? localTime.slice(0, 5) : '';
}

// 프로토타입 없이 새로 설계한 화면(IA §17 M2). 켬/끔은 강제하지 않고, 끄면 시간·요일 선택도
// 함께 접는다 - "알림을 안 받아도 앱을 그대로 쓸 수 있다"는 원칙을 화면 구조로도 드러낸다.
export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferenceSummary[]>([]);
  const [savingType, setSavingType] = useState<NotificationType | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const loaded = await getNotificationPreferences(accessToken);
        if (!cancelled) {
          setPreferences(loaded);
        }
      } catch (error) {
        logger.error('notificationSettings.index', 'failed to load notification preferences', {
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
  }, []);

  const byType = useMemo(() => {
    const map = new Map(preferences.map((preference) => [preference.type, preference]));
    return TYPE_ORDER.map(
      (type) => map.get(type) ?? { type, enabled: false, localTime: null, dayOfWeek: null },
    );
  }, [preferences]);

  const applyUpdate = async (type: NotificationType, next: Omit<NotificationPreferenceSummary, 'type'>) => {
    setPreferences((prev) => {
      const others = prev.filter((preference) => preference.type !== type);
      return [...others, { type, ...next }];
    });
    setSavingType(type);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        return;
      }
      await updateNotificationPreference(accessToken, type, next);
    } catch (error) {
      logger.error('notificationSettings.index', 'failed to update notification preference', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setSavingType(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="알림 설정" />
          <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
            알림은 언제든 끄고 켤 수 있어요. 받지 않아도 나로움을 그대로 쓸 수 있어요.
          </ThemedText>

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : (
            byType.map((preference) => (
              <ThemedView key={preference.type} type="backgroundElement" style={styles.card}>
                <View style={styles.headerRow}>
                  <ThemedText type="heading">{notificationTypeLabel(preference.type)}</ThemedText>
                  <Switch
                    value={preference.enabled}
                    disabled={savingType === preference.type}
                    onValueChange={(enabled) =>
                      applyUpdate(preference.type, {
                        enabled,
                        localTime: preference.localTime ?? TIME_OPTIONS[0],
                        dayOfWeek: preference.type === 'WEEKLY_REFLECTION' ? (preference.dayOfWeek ?? 1) : null,
                      })
                    }
                  />
                </View>

                {preference.enabled && (
                  <>
                    <ThemedText type="small" themeColor="textTertiary" style={styles.sectionLabel}>
                      시간
                    </ThemedText>
                    <View style={styles.chips}>
                      {TIME_OPTIONS.map((option) => {
                        const selected = preference.localTime === option;
                        return (
                          <Pressable
                            key={option}
                            onPress={() =>
                              applyUpdate(preference.type, {
                                enabled: true,
                                localTime: option,
                                dayOfWeek: preference.dayOfWeek,
                              })
                            }
                            style={[
                              styles.chip,
                              { borderColor: theme.border },
                              selected && { borderColor: theme.text, backgroundColor: theme.background },
                            ]}>
                            <ThemedText type="small">{formatTime(option)}</ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>

                    {preference.type === 'WEEKLY_REFLECTION' && (
                      <>
                        <ThemedText type="small" themeColor="textTertiary" style={styles.sectionLabel}>
                          요일
                        </ThemedText>
                        <View style={styles.chips}>
                          {DAY_OPTIONS.map((option) => {
                            const selected = preference.dayOfWeek === option.value;
                            return (
                              <Pressable
                                key={option.value}
                                onPress={() =>
                                  applyUpdate(preference.type, {
                                    enabled: true,
                                    localTime: preference.localTime ?? TIME_OPTIONS[0],
                                    dayOfWeek: option.value,
                                  })
                                }
                                style={[
                                  styles.chip,
                                  { borderColor: theme.border },
                                  selected && { borderColor: theme.text, backgroundColor: theme.background },
                                ]}>
                                <ThemedText type="small">{option.label}</ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </>
                )}
              </ThemedView>
            ))
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
    marginTop: Spacing.two,
  },
  loading: {
    marginTop: Spacing.five,
  },
  card: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    marginTop: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});
