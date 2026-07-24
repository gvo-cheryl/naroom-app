import type { components } from "./generated/openapi.types";

// openapi-typescript는 springdoc이 required를 표시하지 않는 필드를 전부 optional로 생성한다.
// 이 파일은 실제 계약(성공 응답에서는 항상 채워지는 필드)을 기준으로 좁힌 도메인 타입과
// 변환 함수를 둔다. 생성 파일(src/api/generated)은 직접 수정하지 않는다.

export type AccountStatus = components["schemas"]["AccountSummary"]["status"] & string;
export type NextAction = components["schemas"]["KakaoLoginResponse"]["nextAction"] & string;

export interface AccountSummary {
  memberId: string;
  displayName: string;
  status: AccountStatus;
  onboardingCompletedAt: string | null;
  version: number;
}

export interface SessionSummary {
  id: string;
  expiresAt: string;
}

export interface DeviceInfo {
  installationKey: string;
  platform: "IOS" | "ANDROID";
  appVersion: string;
}

export interface KakaoLoginResult {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  session: SessionSummary;
  account: AccountSummary;
  nextAction: NextAction;
}

export interface RefreshResult {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  session: SessionSummary;
}

export interface SessionCheckResult {
  authenticated: boolean;
  session: SessionSummary;
  account: AccountSummary;
  nextAction: NextAction;
}

export interface OnboardingCompleteResult {
  account: AccountSummary;
  nextAction: NextAction;
}

// 성공 응답의 data가 계약대로라면 항상 있어야 하는데 비어 있으면, 조용히 넘어가지 않고
// 바로 알 수 있는 에러로 실패시킨다(뒤에서 undefined 관련 버그로 나타나는 것보다 낫다).
export function requireData<T>(data: T | undefined, context: string): T {
  if (data === undefined) {
    throw new Error(`${context}: response body is missing "data"`);
  }
  return data;
}

function requireField<T>(value: T | null | undefined, field: string, context: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${context}: missing required field "${field}"`);
  }
  return value;
}

export function toAccountSummary(
  raw: components["schemas"]["AccountSummary"] | undefined,
  context: string,
): AccountSummary {
  const account = requireField(raw, "account", context);
  return {
    memberId: requireField(account.memberId, "account.memberId", context),
    displayName: requireField(account.displayName, "account.displayName", context),
    status: requireField(account.status, "account.status", context),
    onboardingCompletedAt: account.onboardingCompletedAt ?? null,
    version: requireField(account.version, "account.version", context),
  };
}

export function toSessionSummary(
  raw: components["schemas"]["SessionSummary"] | undefined,
  context: string,
): SessionSummary {
  const session = requireField(raw, "session", context);
  return {
    id: requireField(session.id, "session.id", context),
    expiresAt: requireField(session.expiresAt, "session.expiresAt", context),
  };
}
