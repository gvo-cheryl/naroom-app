import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSavedQuotes, unsaveQuote } from '@/api';
import { ApiError } from '@/api/errors';
import type { SavedQuoteSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

// 프로토타입 Q02(저장한 문장)에 대응한다.
export default function SavedQuotesScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuoteSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          return;
        }
        const quotes = await getSavedQuotes(accessToken);
        if (!cancelled) {
          setSavedQuotes(quotes);
        }
      } catch (error) {
        logger.error('quotes.saved', 'failed to load saved quotes', {
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

  const handleUnsave = async (quoteId: string) => {
    setSavedQuotes((prev) => prev.filter((item) => item.quote.id !== quoteId));
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await unsaveQuote(accessToken, quoteId);
      }
    } catch (error) {
      logger.error('quotes.saved', 'failed to unsave quote', {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="저장한 문장" />

          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
          ) : savedQuotes.length === 0 ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
              저장한 문장이 아직 없어요.
            </ThemedText>
          ) : (
            savedQuotes.map(({ quote }) => (
              <ThemedView key={quote.id} type="backgroundElement" style={styles.card}>
                <ThemedText type="heading">{quote.text}</ThemedText>
                {quote.authorName && (
                  <ThemedText type="small" themeColor="textTertiary" style={styles.author}>
                    — {quote.authorName}
                  </ThemedText>
                )}
                <AppButton
                  title="저장 취소"
                  variant="quiet"
                  style={styles.unsaveButton}
                  onPress={() => handleUnsave(quote.id)}
                />
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
  author: {
    marginTop: Spacing.two,
  },
  unsaveButton: {
    marginTop: Spacing.three,
  },
});
