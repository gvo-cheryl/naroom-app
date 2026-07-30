import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toCalendarDaySummary,
  toEmotionEnergyPointSummary,
  toEntryTimelineSummary,
  toPeriodReflectionSummary,
  toPersonalSummarySummary,
  toTagDistributionSummary,
  type CalendarDaySummary,
  type EmotionEnergyPointSummary,
  type EntryTimelineSummary,
  type EntryType,
  type PeriodReflectionFeatureType,
  type PeriodReflectionSummary,
  type PersonalSummarySummary,
  type TagCategory,
  type TagDistributionSummary,
} from "./types";

export async function createPeriodReflection(
  accessToken: string,
  featureType: PeriodReflectionFeatureType,
): Promise<PeriodReflectionSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["PeriodReflectionResponse"]>("/api/v1/lifetime/period-reflections", {
      method: "POST",
      body: { featureType },
      accessToken,
    }),
    "createPeriodReflection",
  );
  return toPeriodReflectionSummary(data, "createPeriodReflection");
}

export async function getPeriodReflection(
  accessToken: string,
  periodReflectionId: string,
): Promise<PeriodReflectionSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["PeriodReflectionResponse"]>(
      `/api/v1/lifetime/period-reflections/${periodReflectionId}`,
      { accessToken },
    ),
    "getPeriodReflection",
  );
  return toPeriodReflectionSummary(data, "getPeriodReflection");
}

export async function getPeriodReflections(
  accessToken: string,
  featureType?: PeriodReflectionFeatureType,
): Promise<PeriodReflectionSummary[]> {
  const query = featureType ? `?featureType=${featureType}` : "";
  const data = requireData(
    await apiFetch<components["schemas"]["PeriodReflectionResponse"][]>(
      `/api/v1/lifetime/period-reflections${query}`,
      { accessToken },
    ),
    "getPeriodReflections",
  );
  return data.map((item, index) => toPeriodReflectionSummary(item, `getPeriodReflections[${index}]`));
}

export async function getCalendar(
  accessToken: string,
  year: number,
  month: number,
): Promise<CalendarDaySummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["CalendarDayResponse"][]>(
      `/api/v1/lifetime/calendar?year=${year}&month=${month}`,
      { accessToken },
    ),
    "getCalendar",
  );
  return data.map((item, index) => toCalendarDaySummary(item, `getCalendar[${index}]`));
}

export async function getTimeline(
  accessToken: string,
  params: { from?: string; to?: string; entryType?: EntryType } = {},
): Promise<EntryTimelineSummary[]> {
  const query = new URLSearchParams();
  if (params.from) {
    query.set("from", params.from);
  }
  if (params.to) {
    query.set("to", params.to);
  }
  if (params.entryType) {
    query.set("entryType", params.entryType);
  }
  const queryString = query.toString();
  const data = requireData(
    await apiFetch<components["schemas"]["EntryTimelineResponse"][]>(
      `/api/v1/lifetime/timeline${queryString ? `?${queryString}` : ""}`,
      { accessToken },
    ),
    "getTimeline",
  );
  return data.map((item, index) => toEntryTimelineSummary(item, `getTimeline[${index}]`));
}

export async function getCurrentPersonalSummary(accessToken: string): Promise<PersonalSummarySummary | null> {
  const data = await apiFetch<components["schemas"]["PersonalSummaryResponse"]>(
    "/api/v1/lifetime/personal-summaries/current",
    { accessToken },
  );
  return data ? toPersonalSummarySummary(data, "getCurrentPersonalSummary") : null;
}

export async function updateCurrentPersonalSummary(accessToken: string, content: string): Promise<PersonalSummarySummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["PersonalSummaryResponse"]>("/api/v1/lifetime/personal-summaries/current", {
      method: "PUT",
      body: { content },
      accessToken,
    }),
    "updateCurrentPersonalSummary",
  );
  return toPersonalSummarySummary(data, "updateCurrentPersonalSummary");
}

export async function getPersonalSummaryHistory(accessToken: string): Promise<PersonalSummarySummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["PersonalSummaryResponse"][]>("/api/v1/lifetime/personal-summaries", {
      accessToken,
    }),
    "getPersonalSummaryHistory",
  );
  return data.map((item, index) => toPersonalSummarySummary(item, `getPersonalSummaryHistory[${index}]`));
}

export async function getEmotionEnergyTrend(accessToken: string, range: 7 | 14 | 30): Promise<EmotionEnergyPointSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["EmotionEnergyPointResponse"][]>(
      `/api/v1/lifetime/analytics/emotion-energy?range=${range}`,
      { accessToken },
    ),
    "getEmotionEnergyTrend",
  );
  return data.map((item, index) => toEmotionEnergyPointSummary(item, `getEmotionEnergyTrend[${index}]`));
}

export async function getTagDistribution(
  accessToken: string,
  params: { category?: TagCategory; range?: 7 | 14 | 30 } = {},
): Promise<TagDistributionSummary[]> {
  const query = new URLSearchParams();
  if (params.category) {
    query.set("category", params.category);
  }
  if (params.range) {
    query.set("range", String(params.range));
  }
  const queryString = query.toString();
  const data = requireData(
    await apiFetch<components["schemas"]["TagDistributionResponse"][]>(
      `/api/v1/lifetime/analytics/tags${queryString ? `?${queryString}` : ""}`,
      { accessToken },
    ),
    "getTagDistribution",
  );
  return data.map((item, index) => toTagDistributionSummary(item, `getTagDistribution[${index}]`));
}

export async function getEntriesByTag(accessToken: string, tagId: string): Promise<EntryTimelineSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryTimelineResponse"][]>(`/api/v1/lifetime/analytics/tags/${tagId}/entries`, {
      accessToken,
    }),
    "getEntriesByTag",
  );
  return data.map((item, index) => toEntryTimelineSummary(item, `getEntriesByTag[${index}]`));
}
