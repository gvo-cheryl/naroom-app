import { completeOnboarding, getSession, kakaoLogin, logout, refreshToken } from "./auth";
import { apiFetch } from "./client";

jest.mock("./client", () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = apiFetch as jest.Mock;

const account = {
  memberId: "4d8b1818-38dc-4ee8-9b14-b8676f353e06",
  displayName: "지연",
  status: "ACTIVE",
  onboardingCompletedAt: null,
  version: 0,
};
const session = { id: "session-1", expiresAt: "2026-08-06T09:30:15.123Z" };

beforeEach(() => {
  mockedApiFetch.mockReset();
});

describe("kakaoLogin", () => {
  it("POST /api/v1/auth/kakao/login으로 device·providerAccessToken을 그대로 보낸다", async () => {
    mockedApiFetch.mockResolvedValue({
      tokenType: "Bearer",
      accessToken: "access-token",
      accessTokenExpiresAt: "2026-07-23T10:30:15.123Z",
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: "2026-08-06T09:30:15.123Z",
      session,
      account,
      nextAction: "COMPLETE_ONBOARDING",
    });

    const device = { installationKey: "install-1", platform: "IOS" as const, appVersion: "1.0.0" };
    const result = await kakaoLogin({ providerAccessToken: "kakao-token", device });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/auth/kakao/login", {
      method: "POST",
      body: { providerAccessToken: "kakao-token", device },
    });
    expect(result.accessToken).toBe("access-token");
    expect(result.account.displayName).toBe("지연");
    expect(result.nextAction).toBe("COMPLETE_ONBOARDING");
  });
});

describe("refreshToken", () => {
  it("installationKey를 함께 보낸다(누락되면 AUTH_DEVICE_MISMATCH로 거부됨)", async () => {
    mockedApiFetch.mockResolvedValue({
      tokenType: "Bearer",
      accessToken: "new-access-token",
      accessTokenExpiresAt: "2026-07-23T11:30:15.123Z",
      refreshToken: "new-refresh-token",
      refreshTokenExpiresAt: "2026-08-06T09:30:15.123Z",
      session,
    });

    await refreshToken({ refreshToken: "old-refresh-token", installationKey: "install-1" });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/auth/refresh", {
      method: "POST",
      body: { refreshToken: "old-refresh-token", installationKey: "install-1" },
    });
  });
});

describe("getSession", () => {
  it("GET /api/v1/auth/session에 accessToken을 실어 보낸다", async () => {
    mockedApiFetch.mockResolvedValue({ authenticated: true, session, account, nextAction: "ENTER_APP" });

    const result = await getSession("access-token");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/auth/session", {
      method: "GET",
      accessToken: "access-token",
    });
    expect(result.nextAction).toBe("ENTER_APP");
  });
});

describe("logout", () => {
  it("POST /api/v1/auth/logout에 accessToken을 실어 보낸다", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await logout("access-token");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/auth/logout", {
      method: "POST",
      accessToken: "access-token",
    });
  });
});

describe("completeOnboarding", () => {
  it("요청 바디를 그대로 전달하고 계약대로 응답을 옮긴다", async () => {
    mockedApiFetch.mockResolvedValue({ account: { ...account, onboardingCompletedAt: "2026-07-23T09:30:15.123Z" }, nextAction: "ENTER_APP" });

    const request = {
      version: 0,
      displayName: "지연",
      timezone: "Asia/Seoul",
      locale: "ko-KR",
      consents: [{ type: "TERMS" as const, documentVersion: "1.0", agreed: true }],
    };
    const result = await completeOnboarding("access-token", request);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/account/onboarding/complete", {
      method: "POST",
      body: request,
      accessToken: "access-token",
    });
    expect(result.nextAction).toBe("ENTER_APP");
  });
});
