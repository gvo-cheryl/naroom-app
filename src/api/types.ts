import type { components } from "./generated/openapi.types";

// openapi-typescript는 springdoc이 required를 표시하지 않는 필드를 전부 optional로 생성한다.
// 이 파일은 실제 계약(성공 응답에서는 항상 채워지는 필드)을 기준으로 좁힌 도메인 타입과
// 변환 함수를 둔다. 생성 파일(src/api/generated)은 직접 수정하지 않는다.

export type AccountStatus = components["schemas"]["AccountSummary"]["status"] & string;
export type NextAction = components["schemas"]["KakaoLoginResponse"]["nextAction"] & string;
export type EntryType = components["schemas"]["EntryResponse"]["entryType"] & string;
export type EntryStatus = components["schemas"]["EntryResponse"]["status"] & string;
export type TagCategory = components["schemas"]["TagResponse"]["category"] & string;
export type TagScope = components["schemas"]["TagResponse"]["scope"] & string;
export type EntryTagState = components["schemas"]["EntryTagResponse"]["state"] & string;
export type AiJobStatus = components["schemas"]["EntryAiReflectionResponse"]["status"] & string;

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

export interface EntrySummary {
  id: string;
  entryType: EntryType;
  status: EntryStatus;
  title: string | null;
  body: string | null;
  recordDate: string;
  quoteId: string | null;
  aiProcessingAllowed: boolean;
  publishedAt: string | null;
  version: number;
}

export interface TagSummary {
  id: string;
  scope: TagScope;
  category: TagCategory;
  name: string;
}

export interface EntryTagSummary {
  id: string;
  tag: TagSummary;
  state: EntryTagState;
}

export interface QuoteSummary {
  id: string;
  text: string;
  authorName: string | null;
  sourceName: string | null;
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

export function toEntrySummary(
  raw: components["schemas"]["EntryResponse"] | undefined,
  context: string,
): EntrySummary {
  const entry = requireField(raw, "entry", context);
  return {
    id: requireField(entry.id, "entry.id", context),
    entryType: requireField(entry.entryType, "entry.entryType", context),
    status: requireField(entry.status, "entry.status", context),
    title: entry.title ?? null,
    body: entry.body ?? null,
    recordDate: requireField(entry.recordDate, "entry.recordDate", context),
    quoteId: entry.quoteId ?? null,
    aiProcessingAllowed: requireField(entry.aiProcessingAllowed, "entry.aiProcessingAllowed", context),
    publishedAt: entry.publishedAt ?? null,
    version: requireField(entry.version, "entry.version", context),
  };
}

export function toTagSummary(raw: components["schemas"]["TagResponse"] | undefined, context: string): TagSummary {
  const tag = requireField(raw, "tag", context);
  return {
    id: requireField(tag.id, "tag.id", context),
    scope: requireField(tag.scope, "tag.scope", context),
    category: requireField(tag.category, "tag.category", context),
    name: requireField(tag.name, "tag.name", context),
  };
}

export function toEntryTagSummary(
  raw: components["schemas"]["EntryTagResponse"] | undefined,
  context: string,
): EntryTagSummary {
  const entryTag = requireField(raw, "entryTag", context);
  return {
    id: requireField(entryTag.id, "entryTag.id", context),
    tag: toTagSummary(entryTag.tag, `${context}.tag`),
    state: requireField(entryTag.state, "entryTag.state", context),
  };
}

export function toQuoteSummary(
  raw: components["schemas"]["QuoteResponse"] | undefined,
  context: string,
): QuoteSummary {
  const quote = requireField(raw, "quote", context);
  return {
    id: requireField(quote.id, "quote.id", context),
    text: requireField(quote.text, "quote.text", context),
    authorName: quote.authorName ?? null,
    sourceName: quote.sourceName ?? null,
  };
}
