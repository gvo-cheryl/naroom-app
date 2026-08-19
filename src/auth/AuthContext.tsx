import Constants from "expo-constants";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { completeOnboarding, getSession, type AccountSummary } from "@/api";
import { ApiError } from "@/api/errors";
import type { components } from "@/api/generated/openapi.types";
import type { DeviceInfo, SocialLoginResult } from "@/api/types";
import { requestAppleCredential } from "@/auth/appleNativeLogin";
import {
  clearInvalidSession,
  getValidAccessToken,
  loginWithApple,
  loginWithGoogle,
  loginWithKakao,
  logout as logoutSession,
  restoreAccount as restoreAccountSession,
  restoreAccountWithApple,
  restoreAccountWithGoogle,
} from "@/auth/authManager";
import { getDevicePlatform, getOrCreateInstallationKey } from "@/auth/deviceIdentity";
import { requestGoogleIdToken } from "@/auth/googleNativeLogin";
import { requestKakaoProviderAccessToken } from "@/auth/kakaoNativeLogin";
import { logger } from "@/lib/logger";
import { registerForPushNotificationsAsync } from "@/notifications/pushRegistration";

// authentication.md "앱 시작 판정 순서"의 4단계 분기와 1:1로 대응한다.
export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "account_locked" }
  | { status: "account_pending_deletion"; scheduledDeletionAt?: string }
  | { status: "onboarding_required"; account: AccountSummary }
  | { status: "active"; account: AccountSummary }
  // 세션 확인 자체가 실패한 경우(오프라인 등) — 로컬 세션은 지우지 않고 재시도를 허용한다.
  | { status: "check_failed" };

interface AuthContextValue {
  state: AuthState;
  loginWithKakao: () => Promise<void>;
  restoreWithKakao: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  restoreWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  restoreWithApple: () => Promise<void>;
  completeOnboarding: (
    request: components["schemas"]["OnboardingCompleteRequest"],
  ) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function resolveEntryState(): Promise<AuthState> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    logger.debug("auth.entry", "no valid local token; entering unauthenticated");
    return { status: "unauthenticated" };
  }

  try {
    const session = await getSession(accessToken);
    logger.debug("auth.entry", "session check resolved", { nextAction: session.nextAction });
    return session.nextAction === "COMPLETE_ONBOARDING"
      ? { status: "onboarding_required", account: session.account }
      : { status: "active", account: session.account };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "ACCOUNT_LOCKED") {
        return { status: "account_locked" };
      }
      if (error.code === "ACCOUNT_PENDING_DELETION") {
        return {
          status: "account_pending_deletion",
          scheduledDeletionAt: error.context?.scheduledDeletionAt as string | undefined,
        };
      }
      // 재발급까지 마친 Access Token이 세션 확인에서만 거부된 경우(세션 폐기 등) — 다시 쓸 수 없는
      // 로컬 세션을 남겨두지 않고 재로그인으로 유도한다.
      logger.warn("auth.entry", "session check rejected; clearing local session", { code: error.code });
      await clearInvalidSession();
      return { status: "unauthenticated" };
    }
    logger.error("auth.entry", "session check failed with a non-API error (offline?)");
    return { status: "check_failed" };
  }
}

function applyLoginResult(result: SocialLoginResult): AuthState {
  return result.nextAction === "COMPLETE_ONBOARDING"
    ? { status: "onboarding_required", account: result.account }
    : { status: "active", account: result.account };
}

// 탈퇴 유예 계정은 오류로 끝내지 않고 복구 확인 화면으로 보낸다 - 로그인만으로 자동 복구하지는
// 않는다(Account Deletion Rules). "복구하기"를 명시적으로 눌러야 restoreWith*가 호출된다.
function pendingDeletionStateFrom(error: unknown): AuthState | null {
  if (error instanceof ApiError && error.code === "ACCOUNT_PENDING_DELETION") {
    return {
      status: "account_pending_deletion",
      scheduledDeletionAt: error.context?.scheduledDeletionAt as string | undefined,
    };
  }
  return null;
}

async function currentDeviceInfo(): Promise<DeviceInfo> {
  return {
    installationKey: await getOrCreateInstallationKey(),
    platform: getDevicePlatform(),
    appVersion: Constants.expoConfig?.version ?? "0.0.0",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    resolveEntryState().then((next) => {
      if (!cancelled) {
        setState(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  // 로그인 직후가 아니라 정말로 앱을 쓸 수 있는 상태(온보딩까지 끝남)가 됐을 때만 권한을 물어본다 -
  // 첫 화면부터 권한 팝업을 띄우지 않기 위함(IA §17 알림 표현 원칙).
  useEffect(() => {
    if (state.status !== "active") {
      return;
    }
    (async () => {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await registerForPushNotificationsAsync(accessToken);
      }
    })();
  }, [state.status]);

  const handleLoginWithKakao = useCallback(async () => {
    try {
      const providerAccessToken = await requestKakaoProviderAccessToken();
      const device = await currentDeviceInfo();
      const result = await loginWithKakao(providerAccessToken, device);
      logger.debug("auth.login", "kakao login succeeded", { nextAction: result.nextAction });
      setState(applyLoginResult(result));
    } catch (error) {
      const pending = pendingDeletionStateFrom(error);
      if (pending) {
        logger.debug("auth.login", "account pending deletion; showing restore confirmation");
        setState(pending);
        return;
      }
      logger.error("auth.login", "kakao login failed", {
        code: error instanceof ApiError ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }, []);

  const handleRestoreWithKakao = useCallback(async () => {
    try {
      const providerAccessToken = await requestKakaoProviderAccessToken();
      const device = await currentDeviceInfo();
      const result = await restoreAccountSession(providerAccessToken, device);
      logger.debug("auth.restore", "account restored", { nextAction: result.nextAction });
      setState(applyLoginResult(result));
    } catch (error) {
      logger.error("auth.restore", "kakao account restore failed", {
        code: error instanceof ApiError ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }, []);

  // Google/Apple SDK는 사용자가 계정 선택 화면을 닫으면 에러 대신 null을 돌려준다(각 native login 모듈
  // 참고) - 그 경우 에러 토스트 없이 조용히 로그인 화면을 유지한다.
  const handleLoginWithGoogle = useCallback(async () => {
    try {
      const idToken = await requestGoogleIdToken();
      if (!idToken) {
        return;
      }
      const device = await currentDeviceInfo();
      const result = await loginWithGoogle(idToken, device);
      logger.debug("auth.login", "google login succeeded", { nextAction: result.nextAction });
      setState(applyLoginResult(result));
    } catch (error) {
      const pending = pendingDeletionStateFrom(error);
      if (pending) {
        logger.debug("auth.login", "account pending deletion; showing restore confirmation");
        setState(pending);
        return;
      }
      logger.error("auth.login", "google login failed", {
        code: error instanceof ApiError ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }, []);

  const handleRestoreWithGoogle = useCallback(async () => {
    try {
      const idToken = await requestGoogleIdToken();
      if (!idToken) {
        return;
      }
      const device = await currentDeviceInfo();
      const result = await restoreAccountWithGoogle(idToken, device);
      logger.debug("auth.restore", "account restored", { nextAction: result.nextAction });
      setState(applyLoginResult(result));
    } catch (error) {
      logger.error("auth.restore", "google account restore failed", {
        code: error instanceof ApiError ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }, []);

  const handleLoginWithApple = useCallback(async () => {
    try {
      const credential = await requestAppleCredential();
      if (!credential) {
        return;
      }
      const device = await currentDeviceInfo();
      const result = await loginWithApple(credential.identityToken, credential.rawNonce, credential.fullName, device);
      logger.debug("auth.login", "apple login succeeded", { nextAction: result.nextAction });
      setState(applyLoginResult(result));
    } catch (error) {
      const pending = pendingDeletionStateFrom(error);
      if (pending) {
        logger.debug("auth.login", "account pending deletion; showing restore confirmation");
        setState(pending);
        return;
      }
      logger.error("auth.login", "apple login failed", {
        code: error instanceof ApiError ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }, []);

  const handleRestoreWithApple = useCallback(async () => {
    try {
      const credential = await requestAppleCredential();
      if (!credential) {
        return;
      }
      const device = await currentDeviceInfo();
      const result = await restoreAccountWithApple(
        credential.identityToken,
        credential.rawNonce,
        credential.fullName,
        device,
      );
      logger.debug("auth.restore", "account restored", { nextAction: result.nextAction });
      setState(applyLoginResult(result));
    } catch (error) {
      logger.error("auth.restore", "apple account restore failed", {
        code: error instanceof ApiError ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }, []);

  const handleCompleteOnboarding = useCallback(
    async (request: components["schemas"]["OnboardingCompleteRequest"]) => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          setState({ status: "unauthenticated" });
          return;
        }
        const result = await completeOnboarding(accessToken, request);
        logger.debug("auth.onboarding", "onboarding complete succeeded");
        setState({ status: "active", account: result.account });
      } catch (error) {
        logger.error("auth.onboarding", "onboarding complete failed", {
          code: error instanceof ApiError ? error.code : undefined,
        });
        throw error;
      }
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    await logoutSession();
    setState({ status: "unauthenticated" });
  }, []);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setRetryToken((token) => token + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      loginWithKakao: handleLoginWithKakao,
      restoreWithKakao: handleRestoreWithKakao,
      loginWithGoogle: handleLoginWithGoogle,
      restoreWithGoogle: handleRestoreWithGoogle,
      loginWithApple: handleLoginWithApple,
      restoreWithApple: handleRestoreWithApple,
      completeOnboarding: handleCompleteOnboarding,
      logout: handleLogout,
      retry,
    }),
    [
      state,
      handleLoginWithKakao,
      handleRestoreWithKakao,
      handleLoginWithGoogle,
      handleRestoreWithGoogle,
      handleLoginWithApple,
      handleRestoreWithApple,
      handleCompleteOnboarding,
      handleLogout,
      retry,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
