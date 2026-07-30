import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toEmotionTagTopicSummary,
  toEntryAiReflectionSummary,
  toEntrySelfReflectionSummary,
  toEntrySummary,
  toEntryTagSummary,
  toTagSummary,
  type EmotionTagTopicSummary,
  type EntryAiReflectionSummary,
  type EntrySelfReflectionSummary,
  type EntrySummary,
  type EntryTagSummary,
  type EntryType,
  type TagCategory,
  type TagSummary,
} from "./types";

export async function createEntry(
  accessToken: string,
  request: {
    entryType: EntryType;
    title?: string;
    body?: string;
    recordDate: string;
    quoteId?: string;
    promptSnapshot?: string;
  },
): Promise<EntrySummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryResponse"]>("/api/v1/record/entries", {
      method: "POST",
      body: request,
      accessToken,
    }),
    "createEntry",
  );
  return toEntrySummary(data, "createEntry");
}

export async function listEntries(
  accessToken: string,
  params: { entryType?: EntryType; recordDate?: string } = {},
): Promise<EntrySummary[]> {
  const query = new URLSearchParams();
  if (params.entryType) {
    query.set("entryType", params.entryType);
  }
  if (params.recordDate) {
    query.set("recordDate", params.recordDate);
  }
  const queryString = query.toString();
  const data = requireData(
    await apiFetch<components["schemas"]["EntryResponse"][]>(
      `/api/v1/record/entries${queryString ? `?${queryString}` : ""}`,
      { accessToken },
    ),
    "listEntries",
  );
  return data.map((item, index) => toEntrySummary(item, `listEntries[${index}]`));
}

export async function publishEntry(accessToken: string, entryId: string): Promise<EntrySummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryResponse"]>(`/api/v1/record/entries/${entryId}/publish`, {
      method: "POST",
      accessToken,
    }),
    "publishEntry",
  );
  return toEntrySummary(data, "publishEntry");
}

export async function getEntry(accessToken: string, entryId: string): Promise<EntrySummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryResponse"]>(`/api/v1/record/entries/${entryId}`, { accessToken }),
    "getEntry",
  );
  return toEntrySummary(data, "getEntry");
}

export async function updateEntry(
  accessToken: string,
  entryId: string,
  request: { title?: string; body?: string; version: number },
): Promise<EntrySummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryResponse"]>(`/api/v1/record/entries/${entryId}`, {
      method: "PATCH",
      body: request,
      accessToken,
    }),
    "updateEntry",
  );
  return toEntrySummary(data, "updateEntry");
}

export async function deleteEntry(accessToken: string, entryId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/record/entries/${entryId}`, { method: "DELETE", accessToken });
}

export async function getEntryTags(accessToken: string, entryId: string): Promise<EntryTagSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryTagResponse"][]>(`/api/v1/record/entries/${entryId}/tags`, {
      accessToken,
    }),
    "getEntryTags",
  );
  return data.map((item, index) => toEntryTagSummary(item, `getEntryTags[${index}]`));
}

export async function attachEntryTag(
  accessToken: string,
  entryId: string,
  tagId: string,
): Promise<EntryTagSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryTagResponse"]>(`/api/v1/record/entries/${entryId}/tags`, {
      method: "POST",
      body: { tagId },
      accessToken,
    }),
    "attachEntryTag",
  );
  return toEntryTagSummary(data, "attachEntryTag");
}

export async function confirmEntryTag(
  accessToken: string,
  entryId: string,
  entryTagId: string,
): Promise<EntryTagSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryTagResponse"]>(
      `/api/v1/record/entries/${entryId}/tags/${entryTagId}/confirm`,
      { method: "POST", accessToken },
    ),
    "confirmEntryTag",
  );
  return toEntryTagSummary(data, "confirmEntryTag");
}

export async function rejectEntryTag(accessToken: string, entryId: string, entryTagId: string): Promise<void> {
  await apiFetch<components["schemas"]["EntryTagResponse"]>(
    `/api/v1/record/entries/${entryId}/tags/${entryTagId}/reject`,
    { method: "POST", accessToken },
  );
}

export async function getEntryAiReflection(accessToken: string, entryId: string): Promise<EntryAiReflectionSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntryAiReflectionResponse"]>(
      `/api/v1/record/entries/${entryId}/ai-reflection`,
      { accessToken },
    ),
    "getEntryAiReflection",
  );
  return toEntryAiReflectionSummary(data, "getEntryAiReflection");
}

export async function createSelfReflection(
  accessToken: string,
  entryId: string,
  request: { content: string; aiReflectionId?: string },
): Promise<EntrySelfReflectionSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntrySelfReflectionResponse"]>(
      `/api/v1/record/entries/${entryId}/reflections`,
      { method: "POST", body: request, accessToken },
    ),
    "createSelfReflection",
  );
  return toEntrySelfReflectionSummary(data, "createSelfReflection");
}

export async function getSelfReflections(accessToken: string, entryId: string): Promise<EntrySelfReflectionSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntrySelfReflectionResponse"][]>(
      `/api/v1/record/entries/${entryId}/reflections`,
      { accessToken },
    ),
    "getSelfReflections",
  );
  return data.map((item, index) => toEntrySelfReflectionSummary(item, `getSelfReflections[${index}]`));
}

export async function updateSelfReflection(
  accessToken: string,
  entryId: string,
  reflectionId: string,
  request: { content: string },
): Promise<EntrySelfReflectionSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["EntrySelfReflectionResponse"]>(
      `/api/v1/record/entries/${entryId}/reflections/${reflectionId}`,
      { method: "PATCH", body: request, accessToken },
    ),
    "updateSelfReflection",
  );
  return toEntrySelfReflectionSummary(data, "updateSelfReflection");
}

export async function getSystemTags(accessToken: string): Promise<TagSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["TagResponse"][]>("/api/v1/record/tags/system", { accessToken }),
    "getSystemTags",
  );
  return data.map((item, index) => toTagSummary(item, `getSystemTags[${index}]`));
}

export async function getEmotionTagTopics(accessToken: string): Promise<EmotionTagTopicSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["EmotionTagTopicResponse"][]>("/api/v1/record/tags/emotion-topics", {
      accessToken,
    }),
    "getEmotionTagTopics",
  );
  return data.map((item, index) => toEmotionTagTopicSummary(item, `getEmotionTagTopics[${index}]`));
}

export async function createMyTag(
  accessToken: string,
  request: { category: TagCategory; name: string },
): Promise<TagSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["TagResponse"]>("/api/v1/record/tags", {
      method: "POST",
      body: request,
      accessToken,
    }),
    "createMyTag",
  );
  return toTagSummary(data, "createMyTag");
}
