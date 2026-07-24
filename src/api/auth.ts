import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toAccountSummary,
  toSessionSummary,
  type DeviceInfo,
  type KakaoLoginResult,
  type OnboardingCompleteResult,
  type RefreshResult,
  type SessionCheckResult,
} from "./types";

export async function kakaoLogin(request: {
  providerAccessToken: string;
  device: DeviceInfo;
}): Promise<KakaoLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["KakaoLoginResponse"]>("/api/v1/auth/kakao/login", {
      method: "POST",
      body: request,
    }),
    "kakaoLogin",
  );
  return {
    tokenType: data.tokenType ?? "Bearer",
    accessToken: requireDefined(data.accessToken, "kakaoLogin.accessToken"),
    accessTokenExpiresAt: requireDefined(data.accessTokenExpiresAt, "kakaoLogin.accessTokenExpiresAt"),
    refreshToken: requireDefined(data.refreshToken, "kakaoLogin.refreshToken"),
    refreshTokenExpiresAt: requireDefined(data.refreshTokenExpiresAt, "kakaoLogin.refreshTokenExpiresAt"),
    session: toSessionSummary(data.session, "kakaoLogin.session"),
    account: toAccountSummary(data.account, "kakaoLogin.account"),
    nextAction: requireDefined(data.nextAction, "kakaoLogin.nextAction"),
  };
}

export async function refreshToken(request: {
  refreshToken: string;
  installationKey?: string;
}): Promise<RefreshResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["RefreshResponse"]>("/api/v1/auth/refresh", {
      method: "POST",
      body: request,
    }),
    "refreshToken",
  );
  return {
    tokenType: data.tokenType ?? "Bearer",
    accessToken: requireDefined(data.accessToken, "refreshToken.accessToken"),
    accessTokenExpiresAt: requireDefined(data.accessTokenExpiresAt, "refreshToken.accessTokenExpiresAt"),
    refreshToken: requireDefined(data.refreshToken, "refreshToken.refreshToken"),
    refreshTokenExpiresAt: requireDefined(data.refreshTokenExpiresAt, "refreshToken.refreshTokenExpiresAt"),
    session: toSessionSummary(data.session, "refreshToken.session"),
  };
}

export async function getSession(accessToken: string): Promise<SessionCheckResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SessionCheckResponse"]>("/api/v1/auth/session", {
      method: "GET",
      accessToken,
    }),
    "getSession",
  );
  return {
    authenticated: data.authenticated ?? true,
    session: toSessionSummary(data.session, "getSession.session"),
    account: toAccountSummary(data.account, "getSession.account"),
    nextAction: requireDefined(data.nextAction, "getSession.nextAction"),
  };
}

export async function logout(accessToken: string): Promise<void> {
  await apiFetch<never>("/api/v1/auth/logout", { method: "POST", accessToken });
}

export async function completeOnboarding(
  accessToken: string,
  request: components["schemas"]["OnboardingCompleteRequest"],
): Promise<OnboardingCompleteResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["OnboardingCompleteResponse"]>("/api/v1/account/onboarding/complete", {
      method: "POST",
      body: request,
      accessToken,
    }),
    "completeOnboarding",
  );
  return {
    account: toAccountSummary(data.account, "completeOnboarding.account"),
    nextAction: requireDefined(data.nextAction, "completeOnboarding.nextAction"),
  };
}

function requireDefined<T>(value: T | undefined, field: string): T {
  if (value === undefined) {
    throw new Error(`Missing required field "${field}" in API response`);
  }
  return value;
}
