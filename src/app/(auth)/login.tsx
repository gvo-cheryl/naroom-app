import { useState } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Radius, Spacing } from "@/constants/theme";

type Provider = "kakao" | "google" | "apple";

// 프로토타입 A02(로그인)에 대응한다. Beta 1 승인 범위가 카카오·Google·Apple로 확장됨에 따라
// 세 버튼을 나란히 둔다.
export default function LoginScreen() {
  const { state, loginWithKakao, restoreWithKakao, loginWithGoogle, restoreWithGoogle, loginWithApple, restoreWithApple } =
    useAuth();
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPendingDeletion = state.status === "account_pending_deletion";
  const isBusy = activeProvider !== null;

  const handlePress = async (provider: Provider) => {
    setErrorMessage(null);
    setActiveProvider(provider);
    try {
      if (provider === "kakao") {
        await (isPendingDeletion ? restoreWithKakao() : loginWithKakao());
      } else if (provider === "google") {
        await (isPendingDeletion ? restoreWithGoogle() : loginWithGoogle());
      } else {
        await (isPendingDeletion ? restoreWithApple() : loginWithApple());
      }
    } catch {
      setErrorMessage(
        isPendingDeletion
          ? "복구에 실패했어요. 잠시 후 다시 시도해 주세요."
          : "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setActiveProvider(null);
    }
  };

  const notice = noticeFor(state) ?? errorMessage;

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
            onPress={() => handlePress("kakao")}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.kakaoButton,
              isBusy && styles.disabled,
              pressed && !isBusy && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.kakaoButtonText}>
              {buttonLabel("카카오", activeProvider === "kakao", isPendingDeletion)}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => handlePress("google")}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.googleButton,
              isBusy && styles.disabled,
              pressed && !isBusy && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.googleButtonText}>
              {buttonLabel("Google", activeProvider === "google", isPendingDeletion)}
            </ThemedText>
          </Pressable>

          {Platform.OS === "ios" && (
            <Pressable
              onPress={() => handlePress("apple")}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.appleButton,
                isBusy && styles.disabled,
                pressed && !isBusy && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.appleButtonText}>
                {buttonLabel("Apple", activeProvider === "apple", isPendingDeletion)}
              </ThemedText>
            </Pressable>
          )}

          <ThemedText type="small" themeColor="textTertiary" style={styles.legal}>
            계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function buttonLabel(providerLabel: string, isActive: boolean, isPendingDeletion: boolean): string {
  if (isActive) {
    return isPendingDeletion ? "복구하는 중…" : "로그인 중…";
  }
  return isPendingDeletion ? `${providerLabel}로 본인 확인 후 계정 복구하기` : `${providerLabel}로 시작하기`;
}

function noticeFor(state: { status: string; scheduledDeletionAt?: string }): string | null {
  switch (state.status) {
    case "account_locked":
      return "계정이 잠겨 있어요. 고객센터로 문의해 주세요.";
    case "account_pending_deletion": {
      const date = state.scheduledDeletionAt ? state.scheduledDeletionAt.slice(0, 10) : null;
      return date
        ? `삭제 대기 중인 계정이에요. ${date}까지 복구할 수 있어요.`
        : "삭제 대기 중인 계정이에요. 유예 기간 안에는 복구할 수 있어요.";
    }
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
  googleButton: {
    alignSelf: "stretch",
    backgroundColor: BrandColors.googleWhite,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: BrandColors.googleBorder,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: BrandColors.onGoogleWhite,
  },
  appleButton: {
    alignSelf: "stretch",
    backgroundColor: BrandColors.appleBlack,
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  appleButtonText: {
    color: BrandColors.onAppleBlack,
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
