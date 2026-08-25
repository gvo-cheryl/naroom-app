import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPreviewTodayQuote } from "@/api";
import { ApiError } from "@/api/errors";
import type { QuoteSummary } from "@/api/types";
import { QuoteCard } from "@/components/quote-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { logger } from "@/lib/logger";

// Admin Web preview iframe에서만 연다 - 회원 인증(AuthContext)과 완전히 분리된 경로라
// (app) 그룹 밖의 최상위 라우트로 둔다. preview token은 관리자 화면이 iframe src 쿼리로
// 넘겨준다(Admin Web Implementation Spec §16.2 - handshake 전 초기 전달은 URL 허용).
export default function PreviewQuoteScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await getPreviewTodayQuote(token);
        if (!cancelled) {
          setQuote(result);
        }
      } catch (error) {
        logger.error("preview.quote", "failed to load preview quote", {
          code: error instanceof ApiError ? error.code : undefined,
        });
        if (!cancelled) {
          setFetchError(
            error instanceof ApiError && error.code === "PREVIEW_CONTENT_NOT_SELECTED"
              ? "미리보기로 선택된 문장이 없습니다."
              : "미리보기를 불러오지 못했습니다.",
          );
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
  }, [token]);

  const errorMessage = token ? fetchError : "미리보기 토큰이 없습니다.";
  const isLoading = !!token && loading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isLoading && <ActivityIndicator color={theme.text} style={styles.loading} />}
          {!isLoading && errorMessage && (
            <ThemedText type="default" themeColor="textTertiary" style={styles.message}>
              {errorMessage}
            </ThemedText>
          )}
          {!isLoading && quote && <QuoteCard quote={quote} />}
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
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  loading: {
    marginTop: Spacing.five,
  },
  message: {
    marginTop: Spacing.five,
    textAlign: "center",
  },
});
