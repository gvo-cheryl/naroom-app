import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPreviewExperimentProgramDetail } from "@/api";
import { ApiError } from "@/api/errors";
import type { ExperimentProgramDetailSummary } from "@/api/types";
import { ExperimentProgramDetailCard } from "@/components/experiment-program-detail";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { usePreviewToken } from "@/hooks/use-preview-token";
import { useTheme } from "@/hooks/use-theme";
import { logger } from "@/lib/logger";

// Admin Web preview iframe에서만 연다 - "이대로 시작하기" 등 진행 상태를 만드는 액션은 없다
// (synthetic member 인프라가 아직 없어 카탈로그 열람만 지원). quote.tsx와 동일한 구조.
export default function PreviewExperimentProgramScreen() {
  const token = usePreviewToken();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ExperimentProgramDetailSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await getPreviewExperimentProgramDetail(token);
        if (!cancelled) {
          setProgram(result);
        }
      } catch (error) {
        logger.error("preview.experimentProgram", "failed to load preview program", {
          code: error instanceof ApiError ? error.code : undefined,
        });
        if (!cancelled) {
          setFetchError(
            error instanceof ApiError && error.code === "PREVIEW_CONTENT_NOT_SELECTED"
              ? "미리보기로 선택된 코스가 없습니다."
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
          {!isLoading && program && <ExperimentProgramDetailCard program={program} />}
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
