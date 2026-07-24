import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Radius, Spacing } from "@/constants/theme";

// 프로토타입 A02(로그인)에 대응한다. Beta 1 승인 범위가 카카오 로그인뿐이라 Google 버튼은 넣지 않는다.
export default function LoginScreen() {
  const { state, loginWithKakao } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePress = async () => {
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      await loginWithKakao();
    } catch {
      setErrorMessage("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const notice = noticeFor(state.status) ?? errorMessage;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <ThemedText type="wordmark">나로움</ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
            잘하려고 애쓰지 않아도 괜찮아요.{"\n"}오늘의 마음부터 천천히 시작해요.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.actions}>
          {notice && (
            <ThemedText type="small" themeColor="textTertiary" style={styles.notice}>
              {notice}
            </ThemedText>
          )}

          <Pressable
            onPress={handlePress}
            disabled={isLoggingIn}
            style={({ pressed }) => [
              styles.kakaoButton,
              isLoggingIn && styles.disabled,
              pressed && !isLoggingIn && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.kakaoButtonText}>
              {isLoggingIn ? "로그인 중…" : "카카오로 시작하기"}
            </ThemedText>
          </Pressable>

          <ThemedText type="small" themeColor="textTertiary" style={styles.legal}>
            계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function noticeFor(status: string): string | null {
  switch (status) {
    case "account_locked":
      return "계정이 잠겨 있어요. 고객센터로 문의해 주세요.";
    case "account_pending_deletion":
      return "삭제 대기 중인 계정이에요. 다시 로그인하면 복구할 수 있어요.";
    case "check_failed":
      return "네트워크 상태를 확인해 주세요.";
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
  },
  heroSection: {
    gap: Spacing.three,
  },
  lead: {
    lineHeight: 22,
  },
  actions: {
    gap: Spacing.two,
  },
  notice: {
    textAlign: "center",
  },
  kakaoButton: {
    alignSelf: "stretch",
    backgroundColor: BrandColors.kakaoYellow,
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  kakaoButtonText: {
    color: BrandColors.onKakaoYellow,
  },
  legal: {
    textAlign: "center",
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
