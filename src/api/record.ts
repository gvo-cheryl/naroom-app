import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toEntrySummary,
  toEntryTagSummary,
  toTagSummary,
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

export async function rejectEntryTag(accessToken: string, entryId: string, entryTagId: string): Promise<void> {
  await apiFetch<components["schemas"]["EntryTagResponse"]>(
    `/api/v1/record/entries/${entryId}/tags/${entryTagId}/reject`,
    { method: "POST", accessToken },
  );
}

export async function getSystemTags(accessToken: string): Promise<TagSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["TagResponse"][]>("/api/v1/record/tags/system", { accessToken }),
    "getSystemTags",
  );
  return data.map((item, index) => toTagSummary(item, `getSystemTags[${index}]`));
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
