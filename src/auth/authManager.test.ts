import { refreshToken as refreshTokenRequest, logout as logoutRequest } from "@/api/auth";
import { getOrCreateInstallationKey } from "@/auth/deviceIdentity";
import { clearSession, loadSession, saveSession } from "@/auth/tokenStorage";

import { getValidAccessToken, logout } from "./authManager";

jest.mock("@/api/auth", () => ({
  refreshToken: jest.fn(),
  logout: jest.fn(),
  kakaoLogin: jest.fn(),
}));
jest.mock("@/auth/tokenStorage", () => ({
  loadSession: jest.fn(),
  saveSession: jest.fn(),
  clearSession: jest.fn(),
}));
jest.mock("@/auth/deviceIdentity", () => ({
  getOrCreateInstallationKey: jest.fn(),
}));

const mockedRefreshTokenRequest = refreshTokenRequest as jest.Mock;
const mockedLogoutRequest = logoutRequest as jest.Mock;
const mockedLoadSession = loadSession as jest.Mock;
const mockedSaveSession = saveSession as jest.Mock;
const mockedClearSession = clearSession as jest.Mock;
const mockedGetOrCreateInstallationKey = getOrCreateInstallationKey as jest.Mock;

const HOUR_MS = 60 * 60 * 1000;

function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getValidAccessToken", () => {
  it("저장된 세션이 없으면 null(로그인 화면으로)을 반환한다", async () => {
    mockedLoadSession.mockResolvedValue(null);
    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
  });

  it("Access Token이 아직 유효하면 재발급 없이 그대로 반환한다", async () => {
    mockedLoadSession.mockResolvedValue({
      accessToken: "still-valid",
      accessTokenExpiresAt: isoIn(HOUR_MS),
      refreshToken: "refresh",
      refreshTokenExpiresAt: isoIn(HOUR_MS * 24),
      sessionId: "session-1",
      sessionExpiresAt: isoIn(HOUR_MS * 24),
    });

    await expect(getValidAccessToken()).resolves.toBe("still-valid");
    expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
  });

  it("Access Token 만료 + Refresh Token 만료면 세션을 지우고 null을 반환한다", async () => {
    mockedLoadSession.mockResolvedValue({
      accessToken: "expired",
      accessTokenExpiresAt: isoIn(-HOUR_MS),
      refreshToken: "also-expired",
      refreshTokenExpiresAt: isoIn(-HOUR_MS),
      sessionId: "session-1",
      sessionExpiresAt: isoIn(-HOUR_MS),
    });

    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(mockedClearSession).toHaveBeenCalled();
    expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
  });

  it("Access Token만 만료면 저장된 installationKey를 실어 재발급 요청을 보낸다", async () => {
    // 회귀 테스트: installationKey를 안 보내면 백엔드가 AUTH_DEVICE_MISMATCH로 거부한다.
    mockedLoadSession.mockResolvedValue({
      accessToken: "expired",
      accessTokenExpiresAt: isoIn(-HOUR_MS),
      refreshToken: "still-valid-refresh",
      refreshTokenExpiresAt: isoIn(HOUR_MS * 24),
      sessionId: "session-1",
      sessionExpiresAt: isoIn(HOUR_MS * 24),
    });
    mockedGetOrCreateInstallationKey.mockResolvedValue("stable-install-key");
    mockedRefreshTokenRequest.mockResolvedValue({
      tokenType: "Bearer",
      accessToken: "new-access-token",
      accessTokenExpiresAt: isoIn(HOUR_MS),
      refreshToken: "new-refresh-token",
      refreshTokenExpiresAt: isoIn(HOUR_MS * 24),
      session: { id: "session-1", expiresAt: isoIn(HOUR_MS * 24) },
    });

    await expect(getValidAccessToken()).resolves.toBe("new-access-token");
    expect(mockedRefreshTokenRequest).toHaveBeenCalledWith({
      refreshToken: "still-valid-refresh",
      installationKey: "stable-install-key",
    });
    expect(mockedSaveSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "new-access-token", refreshToken: "new-refresh-token" }),
    );
  });

  it("재발급 자체가 실패하면 재시도하지 않고 세션을 지운 뒤 null을 반환한다", async () => {
    mockedLoadSession.mockResolvedValue({
      accessToken: "expired",
      accessTokenExpiresAt: isoIn(-HOUR_MS),
      refreshToken: "rejected-refresh",
      refreshTokenExpiresAt: isoIn(HOUR_MS * 24),
      sessionId: "session-1",
      sessionExpiresAt: isoIn(HOUR_MS * 24),
    });
    mockedGetOrCreateInstallationKey.mockResolvedValue("stable-install-key");
    mockedRefreshTokenRequest.mockRejectedValue(new Error("ACCOUNT_LOCKED"));

    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(mockedRefreshTokenRequest).toHaveBeenCalledTimes(1);
    expect(mockedClearSession).toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("서버 로그아웃이 실패해도 로컬 세션은 항상 지운다", async () => {
    mockedLoadSession.mockResolvedValue({
      accessToken: "access-token",
      accessTokenExpiresAt: isoIn(HOUR_MS),
      refreshToken: "refresh",
      refreshTokenExpiresAt: isoIn(HOUR_MS * 24),
      sessionId: "session-1",
      sessionExpiresAt: isoIn(HOUR_MS * 24),
    });
    mockedLogoutRequest.mockRejectedValue(new Error("network error"));

    await logout();

    expect(mockedClearSession).toHaveBeenCalled();
  });

  it("로컬에 세션이 없으면 서버 호출 없이 로컬 정리만 한다", async () => {
    mockedLoadSession.mockResolvedValue(null);

    await logout();

    expect(mockedLogoutRequest).not.toHaveBeenCalled();
    expect(mockedClearSession).toHaveBeenCalled();
  });
});
