import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import { toCheckInSummary, type CheckInSummary } from "./types";

export async function getTodayCheckIn(accessToken: string): Promise<CheckInSummary | null> {
  const data = await apiFetch<components["schemas"]["CheckInResponse"]>("/api/v1/checkin/today", { accessToken });
  return toCheckInSummary(data ?? null, "getTodayCheckIn");
}

export async function getCheckIn(accessToken: string, date: string): Promise<CheckInSummary | null> {
  const data = await apiFetch<components["schemas"]["CheckInResponse"]>(
    `/api/v1/checkin?date=${encodeURIComponent(date)}`,
    { accessToken },
  );
  return toCheckInSummary(data ?? null, "getCheckIn");
}

export async function upsertCheckIn(
  accessToken: string,
  request: {
    checkInDate: string;
    emotionIntensity?: number;
    energyLevel?: number;
    memorableEvent?: string;
    gratitudeNote?: string;
    currentNeed?: string;
    emotionTagIds?: string[];
  },
): Promise<CheckInSummary> {
  const data = await apiFetch<components["schemas"]["CheckInResponse"]>("/api/v1/checkin", {
    method: "PUT",
    body: request,
    accessToken,
  });
  const summary = toCheckInSummary(data ?? null, "upsertCheckIn");
  if (!summary) {
    throw new Error("upsertCheckIn: response body is missing \"data\"");
  }
  return summary;
}
