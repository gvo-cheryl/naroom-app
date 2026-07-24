import { requireData, toAccountSummary, toSessionSummary } from "./types";

describe("requireData", () => {
  it("data가 있으면 그대로 반환한다", () => {
    expect(requireData({ a: 1 }, "ctx")).toEqual({ a: 1 });
  });

  it("data가 없으면 바로 알 수 있는 에러를 던진다", () => {
    expect(() => requireData(undefined, "kakaoLogin")).toThrow(/kakaoLogin/);
  });
});

describe("toAccountSummary", () => {
  const validRaw = {
    memberId: "4d8b1818-38dc-4ee8-9b14-b8676f353e06",
    displayName: "지연",
    status: "ACTIVE" as const,
    onboardingCompletedAt: undefined,
    version: 0,
  };

  it("계약대로 채워진 응답을 도메인 타입으로 옮긴다", () => {
    const result = toAccountSummary(validRaw, "ctx");
    expect(result).toEqual({
      memberId: validRaw.memberId,
      displayName: "지연",
      status: "ACTIVE",
      onboardingCompletedAt: null,
      version: 0,
    });
  });

  it("onboardingCompletedAt이 있으면 null로 바꾸지 않는다", () => {
    const result = toAccountSummary({ ...validRaw, onboardingCompletedAt: "2026-07-23T09:30:15.123Z" }, "ctx");
    expect(result.onboardingCompletedAt).toBe("2026-07-23T09:30:15.123Z");
  });

  it("계약상 항상 있어야 하는 필드가 비면 조용히 넘어가지 않고 던진다", () => {
    expect(() => toAccountSummary({ ...validRaw, displayName: undefined }, "getSession")).toThrow(
      /getSession.*account\.displayName/,
    );
    expect(() => toAccountSummary(undefined, "getSession")).toThrow(/getSession.*account/);
  });
});

describe("toSessionSummary", () => {
  it("계약대로 채워진 응답을 옮긴다", () => {
    const result = toSessionSummary({ id: "session-1", expiresAt: "2026-08-06T09:30:15.123Z" }, "ctx");
    expect(result).toEqual({ id: "session-1", expiresAt: "2026-08-06T09:30:15.123Z" });
  });

  it("필드 누락 시 던진다", () => {
    expect(() => toSessionSummary({ id: undefined, expiresAt: "x" }, "refreshToken")).toThrow(
      /refreshToken.*session\.id/,
    );
  });
});
