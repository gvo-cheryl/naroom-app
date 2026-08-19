import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toAccountSummary,
  toSessionSummary,
  type DeviceInfo,
  type OnboardingCompleteResult,
  type RefreshResult,
  type SessionCheckResult,
  type SocialLoginResult,
} from "./types";

function toSocialLoginResult(
  data: components["schemas"]["SocialLoginResponse"],
  label: string,
): SocialLoginResult {
  return {
    tokenType: data.tokenType ?? "Bearer",
    accessToken: requireDefined(data.accessToken, `${label}.accessToken`),
    accessTokenExpiresAt: requireDefined(data.accessTokenExpiresAt, `${label}.accessTokenExpiresAt`),
    refreshToken: requireDefined(data.refreshToken, `${label}.refreshToken`),
    refreshTokenExpiresAt: requireDefined(data.refreshTokenExpiresAt, `${label}.refreshTokenExpiresAt`),
    session: toSessionSummary(data.session, `${label}.session`),
    account: toAccountSummary(data.account, `${label}.account`),
    nextAction: requireDefined(data.nextAction, `${label}.nextAction`),
  };
}

export async function kakaoLogin(request: {
  providerAccessToken: string;
  device: DeviceInfo;
}): Promise<SocialLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SocialLoginResponse"]>("/api/v1/auth/kakao/login", {
      method: "POST",
      body: request,
    }),
    "kakaoLogin",
  );
  return toSocialLoginResult(data, "kakaoLogin");
}

// PENDING_DELETION 상태에서 카카오 재인증으로 명시적 복구를 확인하는 전용 엔드포인트다.
// kakaoLogin과 요청·응답 계약은 같지만, 로그인만으로 자동 복구되지 않도록 별도 경로로 분리했다.
export async function restoreAccount(request: {
  providerAccessToken: string;
  device: DeviceInfo;
}): Promise<SocialLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SocialLoginResponse"]>("/api/v1/auth/restore", {
      method: "POST",
      body: request,
    }),
    "restoreAccount",
  );
  return toSocialLoginResult(data, "restoreAccount");
}

export async function googleLogin(request: {
  idToken: string;
  device: DeviceInfo;
}): Promise<SocialLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SocialLoginResponse"]>("/api/v1/auth/google/login", {
      method: "POST",
      body: request,
    }),
    "googleLogin",
  );
  return toSocialLoginResult(data, "googleLogin");
}

// PENDING_DELETION 상태에서 Google 재인증으로 명시적 복구를 확인하는 전용 엔드포인트다.
export async function googleRestore(request: {
  idToken: string;
  device: DeviceInfo;
}): Promise<SocialLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SocialLoginResponse"]>("/api/v1/auth/google/restore", {
      method: "POST",
      body: request,
    }),
    "googleRestore",
  );
  return toSocialLoginResult(data, "googleRestore");
}

export async function appleLogin(request: {
  identityToken: string;
  rawNonce: string;
  fullName?: string;
  device: DeviceInfo;
}): Promise<SocialLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SocialLoginResponse"]>("/api/v1/auth/apple/login", {
      method: "POST",
      body: request,
    }),
    "appleLogin",
  );
  return toSocialLoginResult(data, "appleLogin");
}

// PENDING_DELETION 상태에서 Apple 재인증으로 명시적 복구를 확인하는 전용 엔드포인트다.
export async function appleRestore(request: {
  identityToken: string;
  rawNonce: string;
  fullName?: string;
  device: DeviceInfo;
}): Promise<SocialLoginResult> {
  const data = requireData(
    await apiFetch<components["schemas"]["SocialLoginResponse"]>("/api/v1/auth/apple/restore", {
      method: "POST",
      body: request,
    }),
    "appleRestore",
  );
  return toSocialLoginResult(data, "appleRestore");
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
