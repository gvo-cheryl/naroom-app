import { kakaoLogin, logout as logoutRequest, refreshToken as refreshTokenRequest } from "@/api/auth";
import type { DeviceInfo, KakaoLoginResult } from "@/api/types";
import { getOrCreateInstallationKey } from "@/auth/deviceIdentity";
import { clearSession, loadSession, saveSession, type StoredSession } from "@/auth/tokenStorage";
import { logger } from "@/lib/logger";

// 만료 직전(레이스 컨디션 방지용 여유 구간)이면 이미 만료된 것으로 취급한다.
const EXPIRY_SAFETY_MARGIN_MS = 30_000;

function isExpired(expiresAtIso: string): boolean {
  return new Date(expiresAtIso).getTime() - EXPIRY_SAFETY_MARGIN_MS <= Date.now();
}

// 동시에 여러 요청이 만료를 감지해도 재발급은 한 번만 나가도록 진행 중인 재발급을 공유한다.
// 재발급 자체가 실패하면 재시도하지 않고 세션을 지운다(무한 재시도 방지).
let inFlightRefresh: Promise<string | null> | null = null;

export async function loginWithKakao(
  providerAccessToken: string,
  device: DeviceInfo,
): Promise<KakaoLoginResult> {
  const result = await kakaoLogin({ providerAccessToken, device });
  await saveSession(toStoredSession(result));
  return result;
}

// 유효한 Access Token을 반환한다. 저장된 세션이 없거나 재발급까지 실패하면 null을 반환한다.
// null은 "로그인 화면으로 보내라"는 신호다 — 호출하는 쪽에서 에러로 다루지 않는다.
export async function getValidAccessToken(): Promise<string | null> {
  const session = await loadSession();
  if (!session) {
    return null;
  }

  if (!isExpired(session.accessTokenExpiresAt)) {
    return session.accessToken;
  }

  if (isExpired(session.refreshTokenExpiresAt)) {
    await clearSession();
    return null;
  }

  if (!inFlightRefresh) {
    inFlightRefresh = performRefresh(session).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function performRefresh(session: StoredSession): Promise<string | null> {
  try {
    const installationKey = await getOrCreateInstallationKey();
    const result = await refreshTokenRequest({ refreshToken: session.refreshToken, installationKey });
    await saveSession({
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      sessionId: result.session.id,
      sessionExpiresAt: result.session.expiresAt,
    });
    return result.accessToken;
  } catch {
    // 실패 원인(코드·traceId)은 api/client.ts가 이미 로그로 남긴다. 여기서는 그 결과로
    // 로컬 세션을 지운다는 것만 남긴다 — 재발급 실패 후 왜 로그인 화면으로 돌아갔는지 추적용.
    logger.warn("auth.refresh", "clearing local session after refresh failure");
    await clearSession();
    return null;
  }
}

// 세션 확인(getSession)이 회원 상태가 아니라 세션 자체를 거부한 경우(폐기된 세션 등) 호출한다.
// 재사용할 수 없는 로컬 토큰을 남겨두지 않는다.
export async function clearInvalidSession(): Promise<void> {
  await clearSession();
}

export async function logout(): Promise<void> {
  const session = await loadSession();
  try {
    if (session) {
      await logoutRequest(session.accessToken);
    }
  } catch {
    // authentication.md: 앱은 응답 성공 여부와 무관하게 로컬 토큰과 민감 캐시를 제거한다.
    // 서버 쪽 세션 폐기가 안 됐을 수 있다는 것만 남기고 로컬 정리는 그대로 진행한다.
    logger.warn("auth.logout", "server-side revoke failed; clearing local session anyway");
  } finally {
    await clearSession();
  }
}

function toStoredSession(result: KakaoLoginResult): StoredSession {
  return {
    accessToken: result.accessToken,
    accessTokenExpiresAt: result.accessTokenExpiresAt,
    refreshToken: result.refreshToken,
    refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    sessionId: result.session.id,
    sessionExpiresAt: result.session.expiresAt,
  };
}
