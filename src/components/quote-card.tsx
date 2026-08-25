import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import type { QuoteSummary } from "@/api/types";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { SectionHeading } from "./section-heading";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { AppButton } from "./ui/app-button";

interface QuoteCardProps {
  quote: QuoteSummary;
  onSavedQuotesPress?: () => void;
  onToggleSave?: () => void;
  savingQuote?: boolean;
  onWriteEntry?: () => void;
}

// home.tsx(실기기·앱)와 미리보기 화면(preview/quote.tsx) 양쪽에서 재사용한다.
// 저장·기록 콜백이 없으면(=미리보기 등 상호작용이 불가능한 컨텍스트) 해당 버튼을 숨긴다.
export function QuoteCard({ quote, onSavedQuotesPress, onToggleSave, savingQuote, onWriteEntry }: QuoteCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, styles.cardFilled]}>
      <View style={styles.quoteHeader}>
        <SectionHeading icon={{ ios: "quote.opening", android: "format_quote" }} title="오늘의 문장" />
        {onSavedQuotesPress && (
          <Pressable
            onPress={onSavedQuotesPress}
            hitSlop={8}
            style={styles.savedQuotesLink}
            accessibilityLabel="저장한 문장 모음"
          >
            <SymbolView name={{ ios: "bookmark", android: "bookmark_border" }} size={20} tintColor={theme.textTertiary} />
          </Pressable>
        )}
      </View>
      <ThemedText type="small" style={styles.quoteText}>
        {quote.text}
      </ThemedText>
      {quote.authorName && (
        <ThemedText type="small" themeColor="textTertiary" style={styles.quoteAuthor}>
          — {quote.authorName}
        </ThemedText>
      )}
      {(onToggleSave || onWriteEntry) && (
        <View style={styles.quoteActions}>
          {onToggleSave && (
            <Pressable
              onPress={onToggleSave}
              disabled={savingQuote}
              hitSlop={8}
              style={styles.heartButton}
              accessibilityLabel={quote.saved ? "저장 취소" : "문장 저장"}
            >
              <SymbolView
                name={{
                  ios: quote.saved ? "heart.fill" : "heart",
                  android: quote.saved ? "favorite" : "favorite_border",
                }}
                size={22}
                tintColor={quote.saved ? theme.text : theme.textTertiary}
              />
            </Pressable>
          )}
          {onWriteEntry && (
            <AppButton
              title="이 문장으로 기록하기"
              variant="ghost"
              style={styles.quoteActionButton}
              onPress={onWriteEntry}
            />
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
    alignItems: "center",
  },
  cardFilled: {
    alignItems: "stretch",
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedQuotesLink: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteText: {
    marginTop: Spacing.three,
  },
  quoteAuthor: {
    marginTop: Spacing.two,
  },
  quoteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  heartButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteActionButton: {
    flex: 1,
  },
});
