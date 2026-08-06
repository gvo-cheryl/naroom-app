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
export type AiFeedbackHelpfulness = components["schemas"]["AiFeedbackSubmitRequest"]["helpfulness"] & string;

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
  saved: boolean;
}

export interface SavedQuoteSummary {
  quote: QuoteSummary;
  savedAt: string;
}

export interface EntryAiReflectionSummary {
  status: AiJobStatus | null;
  generationRunId: string | null;
  reflectionText: string | null;
  reflectionQuestion: string | null;
}

export interface AiFeedbackSummary {
  id: string;
  generationRunId: string;
  helpfulness: AiFeedbackHelpfulness;
  applyLongTerm: boolean | null;
}

export interface AiFeedbackReportSummary {
  id: string;
  generationRunId: string;
}

export interface EntrySelfReflectionSummary {
  id: string;
  content: string;
}

export interface EmotionTagTopicSummary {
  id: string;
  code: string;
  name: string;
  tags: TagSummary[];
}

export interface CheckInSummary {
  id: string;
  checkInDate: string;
  emotionIntensity: number | null;
  energyLevel: number | null;
  memorableEvent: string | null;
  gratitudeNote: string | null;
  currentNeed: string | null;
  emotions: TagSummary[];
}

export type PeriodReflectionFeatureType = "THREE_DAY_REFLECTION" | "WEEKLY_REFLECTION";

export interface PeriodReflectionInsightsSummary {
  repeatedEmotionsAndSituations: string[];
  difficultMoments: string[];
  gratefulMoments: string[];
  triedResponses: string[];
  helpfulConditions: string[];
}

export interface PeriodReflectionSummary {
  id: string;
  entryId: string;
  featureType: PeriodReflectionFeatureType;
  periodStart: string;
  periodEnd: string;
  status: AiJobStatus;
  summaryText: string | null;
  insights: PeriodReflectionInsightsSummary | null;
  questionText: string | null;
  requestedAt: string;
}

export interface CalendarDaySummary {
  date: string;
  hasEntry: boolean;
  hasCheckIn: boolean;
}

export interface PersonalSummarySummary {
  id: string;
  content: string;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionEnergyPointSummary {
  date: string;
  emotionIntensity: number | null;
  energyLevel: number | null;
}

export interface TagDistributionSummary {
  tagId: string;
  tagName: string;
  category: TagCategory;
  count: number;
}

export interface EntryTimelineSummary {
  id: string;
  entryType: EntryType;
  status: EntryStatus;
  title: string | null;
  body: string | null;
  recordDate: string;
  tags: EntryTagSummary[];
  aiStatus: AiJobStatus | null;
  hasSelfReflection: boolean;
  createdAt: string;
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

// EntryAiReflectionResponse는 AI 작업이 아직 생성되지 않았을 때 필드가 전부 비어 있을 수 있는
// 유일한 응답이라(entry.aiProcessingAllowed=false 등), 다른 to*Summary와 달리 raw 자체가
// undefined일 때만 예외를 던지고 나머지 필드는 전부 null 허용으로 다룬다.
export function toEntryAiReflectionSummary(
  raw: components["schemas"]["EntryAiReflectionResponse"] | undefined,
  context: string,
): EntryAiReflectionSummary {
  const reflection = requireField(raw, "reflection", context);
  return {
    status: reflection.status ?? null,
    generationRunId: reflection.generationRunId ?? null,
    reflectionText: reflection.reflectionText ?? null,
    reflectionQuestion: reflection.reflectionQuestion ?? null,
  };
}

export function toAiFeedbackSummary(
  raw: components["schemas"]["AiFeedbackResponse"] | undefined,
  context: string,
): AiFeedbackSummary {
  const feedback = requireField(raw, "feedback", context);
  return {
    id: requireField(feedback.id, "feedback.id", context),
    generationRunId: requireField(feedback.generationRunId, "feedback.generationRunId", context),
    helpfulness: requireField(feedback.helpfulness, "feedback.helpfulness", context),
    applyLongTerm: feedback.applyLongTerm ?? null,
  };
}

export function toAiFeedbackReportSummary(
  raw: components["schemas"]["AiFeedbackReportResponse"] | undefined,
  context: string,
): AiFeedbackReportSummary {
  const report = requireField(raw, "report", context);
  return {
    id: requireField(report.id, "report.id", context),
    generationRunId: requireField(report.generationRunId, "report.generationRunId", context),
  };
}

export function toEntrySelfReflectionSummary(
  raw: components["schemas"]["EntrySelfReflectionResponse"] | undefined,
  context: string,
): EntrySelfReflectionSummary {
  const reflection = requireField(raw, "reflection", context);
  return {
    id: requireField(reflection.id, "reflection.id", context),
    content: requireField(reflection.content, "reflection.content", context),
  };
}

export function toEmotionTagTopicSummary(
  raw: components["schemas"]["EmotionTagTopicResponse"] | undefined,
  context: string,
): EmotionTagTopicSummary {
  const topic = requireField(raw, "topic", context);
  return {
    id: requireField(topic.id, "topic.id", context),
    code: requireField(topic.code, "topic.code", context),
    name: requireField(topic.name, "topic.name", context),
    tags: (topic.tags ?? []).map((tag, index) => toTagSummary(tag, `${context}.tags[${index}]`)),
  };
}

// 오늘 체크인이 아직 없으면 서버가 {"data": null}을 200으로 돌려준다 - requireData로 다루면
// 안 되는 유일한 응답이라 별도로 null 허용 매퍼를 둔다.
export function toCheckInSummary(
  raw: components["schemas"]["CheckInResponse"] | null | undefined,
  context: string,
): CheckInSummary | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  return {
    id: requireField(raw.id, "checkIn.id", context),
    checkInDate: requireField(raw.checkInDate, "checkIn.checkInDate", context),
    emotionIntensity: raw.emotionIntensity ?? null,
    energyLevel: raw.energyLevel ?? null,
    memorableEvent: raw.memorableEvent ?? null,
    gratitudeNote: raw.gratitudeNote ?? null,
    currentNeed: raw.currentNeed ?? null,
    emotions: (raw.emotions ?? []).map((tag, index) => toTagSummary(tag, `${context}.emotions[${index}]`)),
  };
}

export function toPeriodReflectionSummary(
  raw: components["schemas"]["PeriodReflectionResponse"] | undefined,
  context: string,
): PeriodReflectionSummary {
  const reflection = requireField(raw, "reflection", context);
  const insights = reflection.insights;
  return {
    id: requireField(reflection.id, "reflection.id", context),
    entryId: requireField(reflection.entryId, "reflection.entryId", context),
    featureType: requireField(
      reflection.featureType,
      "reflection.featureType",
      context,
    ) as PeriodReflectionFeatureType,
    periodStart: requireField(reflection.periodStart, "reflection.periodStart", context),
    periodEnd: requireField(reflection.periodEnd, "reflection.periodEnd", context),
    status: requireField(reflection.status, "reflection.status", context),
    requestedAt: requireField(reflection.requestedAt, "reflection.requestedAt", context),
    summaryText: reflection.summaryText ?? null,
    insights: insights
      ? {
          repeatedEmotionsAndSituations: insights.repeatedEmotionsAndSituations ?? [],
          difficultMoments: insights.difficultMoments ?? [],
          gratefulMoments: insights.gratefulMoments ?? [],
          triedResponses: insights.triedResponses ?? [],
          helpfulConditions: insights.helpfulConditions ?? [],
        }
      : null,
    questionText: reflection.questionText ?? null,
  };
}

export function toCalendarDaySummary(
  raw: components["schemas"]["CalendarDayResponse"] | undefined,
  context: string,
): CalendarDaySummary {
  const day = requireField(raw, "day", context);
  return {
    date: requireField(day.date, "day.date", context),
    hasEntry: day.hasEntry ?? false,
    hasCheckIn: day.hasCheckIn ?? false,
  };
}

export function toPersonalSummarySummary(
  raw: components["schemas"]["PersonalSummaryResponse"] | undefined,
  context: string,
): PersonalSummarySummary {
  const summary = requireField(raw, "summary", context);
  return {
    id: requireField(summary.id, "summary.id", context),
    content: requireField(summary.content, "summary.content", context),
    archived: summary.archived ?? false,
    archivedAt: summary.archivedAt ?? null,
    createdAt: requireField(summary.createdAt, "summary.createdAt", context),
    updatedAt: requireField(summary.updatedAt, "summary.updatedAt", context),
  };
}

export function toEmotionEnergyPointSummary(
  raw: components["schemas"]["EmotionEnergyPointResponse"] | undefined,
  context: string,
): EmotionEnergyPointSummary {
  const point = requireField(raw, "point", context);
  return {
    date: requireField(point.date, "point.date", context),
    emotionIntensity: point.emotionIntensity ?? null,
    energyLevel: point.energyLevel ?? null,
  };
}

export function toTagDistributionSummary(
  raw: components["schemas"]["TagDistributionResponse"] | undefined,
  context: string,
): TagDistributionSummary {
  const distribution = requireField(raw, "distribution", context);
  return {
    tagId: requireField(distribution.tagId, "distribution.tagId", context),
    tagName: requireField(distribution.tagName, "distribution.tagName", context),
    category: requireField(distribution.category, "distribution.category", context),
    count: requireField(distribution.count, "distribution.count", context),
  };
}

export function toEntryTimelineSummary(
  raw: components["schemas"]["EntryTimelineResponse"] | undefined,
  context: string,
): EntryTimelineSummary {
  const entry = requireField(raw, "entry", context);
  return {
    id: requireField(entry.id, "entry.id", context),
    entryType: requireField(entry.entryType, "entry.entryType", context),
    status: requireField(entry.status, "entry.status", context),
    title: entry.title ?? null,
    body: entry.body ?? null,
    recordDate: requireField(entry.recordDate, "entry.recordDate", context),
    tags: (entry.tags ?? []).map((tag, index) => toEntryTagSummary(tag, `${context}.tags[${index}]`)),
    aiStatus: entry.aiStatus ?? null,
    hasSelfReflection: entry.hasSelfReflection ?? false,
    createdAt: requireField(entry.createdAt, "entry.createdAt", context),
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
    saved: quote.saved ?? false,
  };
}

export function toSavedQuoteSummary(
  raw: components["schemas"]["SavedQuoteResponse"] | undefined,
  context: string,
): SavedQuoteSummary {
  const saved = requireField(raw, "saved", context);
  return {
    quote: toQuoteSummary(saved.quote, `${context}.quote`),
    savedAt: requireField(saved.savedAt, "saved.savedAt", context),
  };
}

// 작은 실험(Experiment) 도메인. 홈·탐색(9-A)에서 필요한 범위만 좁힌다.

export type ExperimentProgramStatus = components["schemas"]["ExperimentPastProgramResponse"]["status"] & string;
export type ExperimentRecommendationSourceType = components["schemas"]["ExperimentRecommendationResponse"]["sourceType"] & string;
export type ExperimentRecommendationStatus = "SHOWN" | "VIEWED" | "ACCEPTED" | "DISMISSED" | "EXPIRED";

export interface ExperimentTopicSummary {
  id: string;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface ExperimentProgramSummary {
  programId: string;
  code: string;
  title: string;
  durationDays: number;
  topicCode: string;
  description: string;
  estimatedMinutesMin: number;
  estimatedMinutesMax: number;
  missionCount: number;
}

export interface ExperimentTodayMissionSummary {
  dayNumber: number;
  missionId: string;
  missionCode: string;
  title: string;
  missionType: string;
  estimatedMinutes: number;
  userProgramMissionId: string;
}

export interface ExperimentActiveProgramSummary {
  userExperimentProgramId: string;
  status: ExperimentProgramStatus;
  title: string;
  durationDays: number;
  currentDay: number;
  lookedAtMissionCount: number;
  restedDateCount: number;
  todayMission: ExperimentTodayMissionSummary | null;
}

export interface ExperimentPastProgramSummary {
  userExperimentProgramId: string;
  status: ExperimentProgramStatus;
  title: string;
  durationDays: number;
  currentDay: number;
  startedAt: string | null;
  completedAt: string | null;
  endedEarlyAt: string | null;
}

export interface ExperimentRecommendationSummary {
  recommendationId: string;
  program: ExperimentProgramSummary;
  sourceType: ExperimentRecommendationSourceType;
  reasonText: string;
  status: ExperimentRecommendationStatus;
  createdAt: string;
}

export function toExperimentTopicSummary(
  raw: components["schemas"]["ExperimentTopicResponse"] | undefined,
  context: string,
): ExperimentTopicSummary {
  const topic = requireField(raw, "topic", context);
  return {
    id: requireField(topic.id, "topic.id", context),
    code: requireField(topic.code, "topic.code", context),
    name: requireField(topic.name, "topic.name", context),
    description: requireField(topic.description, "topic.description", context),
    displayOrder: requireField(topic.displayOrder, "topic.displayOrder", context),
  };
}

export function toExperimentProgramSummary(
  raw: components["schemas"]["ExperimentProgramSummaryResponse"] | undefined,
  context: string,
): ExperimentProgramSummary {
  const program = requireField(raw, "program", context);
  const estimatedMinutes = requireField(program.estimatedMinutes, "program.estimatedMinutes", context);
  return {
    programId: requireField(program.programId, "program.programId", context),
    code: requireField(program.code, "program.code", context),
    title: requireField(program.title, "program.title", context),
    durationDays: requireField(program.durationDays, "program.durationDays", context),
    topicCode: requireField(program.topicCode, "program.topicCode", context),
    description: requireField(program.description, "program.description", context),
    estimatedMinutesMin: requireField(estimatedMinutes.min, "program.estimatedMinutes.min", context),
    estimatedMinutesMax: requireField(estimatedMinutes.max, "program.estimatedMinutes.max", context),
    missionCount: requireField(program.missionCount, "program.missionCount", context),
  };
}

export function toExperimentActiveProgramSummary(
  raw: components["schemas"]["ExperimentActiveProgramResponse"] | null | undefined,
  context: string,
): ExperimentActiveProgramSummary | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  return {
    userExperimentProgramId: requireField(raw.userExperimentProgramId, "program.userExperimentProgramId", context),
    status: requireField(raw.status, "program.status", context) as ExperimentProgramStatus,
    title: requireField(raw.title, "program.title", context),
    durationDays: requireField(raw.durationDays, "program.durationDays", context),
    currentDay: requireField(raw.currentDay, "program.currentDay", context),
    lookedAtMissionCount: requireField(raw.lookedAtMissionCount, "program.lookedAtMissionCount", context),
    restedDateCount: requireField(raw.restedDateCount, "program.restedDateCount", context),
    todayMission: raw.todayMission
      ? {
          dayNumber: requireField(raw.todayMission.dayNumber, "program.todayMission.dayNumber", context),
          missionId: requireField(raw.todayMission.missionId, "program.todayMission.missionId", context),
          missionCode: requireField(raw.todayMission.missionCode, "program.todayMission.missionCode", context),
          title: requireField(raw.todayMission.title, "program.todayMission.title", context),
          missionType: requireField(raw.todayMission.missionType, "program.todayMission.missionType", context),
          estimatedMinutes: requireField(
            raw.todayMission.estimatedMinutes,
            "program.todayMission.estimatedMinutes",
            context,
          ),
          userProgramMissionId: requireField(
            raw.todayMission.userProgramMissionId,
            "program.todayMission.userProgramMissionId",
            context,
          ),
        }
      : null,
  };
}

export function toExperimentPastProgramSummary(
  raw: components["schemas"]["ExperimentPastProgramResponse"] | undefined,
  context: string,
): ExperimentPastProgramSummary {
  const program = requireField(raw, "program", context);
  return {
    userExperimentProgramId: requireField(program.userExperimentProgramId, "program.userExperimentProgramId", context),
    status: requireField(program.status, "program.status", context) as ExperimentProgramStatus,
    title: requireField(program.title, "program.title", context),
    durationDays: requireField(program.durationDays, "program.durationDays", context),
    currentDay: requireField(program.currentDay, "program.currentDay", context),
    startedAt: program.startedAt ?? null,
    completedAt: program.completedAt ?? null,
    endedEarlyAt: program.endedEarlyAt ?? null,
  };
}

export function toExperimentRecommendationSummary(
  raw: components["schemas"]["ExperimentRecommendationResponse"] | undefined,
  context: string,
): ExperimentRecommendationSummary {
  const recommendation = requireField(raw, "recommendation", context);
  return {
    recommendationId: requireField(recommendation.recommendationId, "recommendation.recommendationId", context),
    program: toExperimentProgramSummary(recommendation.program, `${context}.program`),
    sourceType: requireField(recommendation.sourceType, "recommendation.sourceType", context) as ExperimentRecommendationSourceType,
    reasonText: requireField(recommendation.reasonText, "recommendation.reasonText", context),
    status: requireField(recommendation.status, "recommendation.status", context) as ExperimentRecommendationStatus,
    createdAt: requireField(recommendation.createdAt, "recommendation.createdAt", context),
  };
}
