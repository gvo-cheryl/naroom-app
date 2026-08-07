import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEarnedBadges } from '@/api';
import { ApiError } from '@/api/errors';
import type { BadgeCategory, MemberBadgeSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { badgeCategoryLabel } from '@/constants/badge';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

const CATEGORY_ORDER: BadgeCategory[] = ['TRIAL', 'DISCOVERY', 'RETURN', 'SELF_ORGANIZATION'];

const CATEGORY_ICONS = {
  TRIAL: { ios: 'flag', android: 'flag' },
  DISCOVERY: { ios: 'sparkles', android: 'auto_awesome' },
  RETURN: { ios: 'arrow.uturn.left', android: 'undo' },
  SELF_ORGANIZATION: { ios: 'doc.text', android: 'description' },
} as const satisfies Record<BadgeCategory, { ios: string; android: string }>;

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

// 프로토타입 없이 새로 설계한 화면(뱃지 기획·설계 문서 §6 DEC-02). 획득한 뱃지만 보여주는 조용한
// 공간이다 - 아직 없는 뱃지 목록이나 진행률은 보여주지 않는다(목표 지향적 압박 방지).
export default function BadgesScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<MemberBadgeSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const earned = await getEarnedBadges(accessToken);
        if (!cancelled) {
          setBadges(earned);
        }
      } catch (error) {
        logger.error('badges.index', 'failed to load earned badges', {
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

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      badges: badges.filter((badge) => badge.category === category),
    })).filter((group) => group.badges.length > 0);
  }, [badges]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="나의 뱃지함" />
          <ThemedText type="small" themeColor="textTertiary" style={styles.lead}>
            시도하고, 발견하고, 다시 돌아오고, 스스로 정리한 순간들을 모아뒀어요.
          </ThemedText>

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : groups.length === 0 ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
              아직 만난 뱃지가 없어요. 기록하고 지내다 보면 자연스럽게 만나게 될 거예요.
            </ThemedText>
          ) : (
            groups.map((group) => (
              <ThemedView key={group.category} style={styles.section}>
                <SectionHeading
                  icon={CATEGORY_ICONS[group.category]}
                  title={badgeCategoryLabel(group.category)}
                  style={styles.sectionHeading}
                />
                {group.badges.map((badge) => (
                  <ThemedView key={badge.badgeDefinitionId} type="backgroundElement" style={styles.card}>
                    <ThemedText type="heading">{badge.title}</ThemedText>
                    <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
                      {badge.description}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textTertiary" style={styles.earnedAt}>
                      {formatDate(badge.earnedAt)}
                    </ThemedText>
                  </ThemedView>
                ))}
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
  empty: {
    marginTop: Spacing.five,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionHeading: {
    marginBottom: Spacing.two,
  },
  card: {
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  description: {
    marginTop: Spacing.one,
  },
  earnedAt: {
    marginTop: Spacing.two,
  },
});
