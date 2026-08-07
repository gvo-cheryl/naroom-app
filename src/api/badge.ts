import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import { requireData, toMemberBadgeSummary, type MemberBadgeSummary } from "./types";

export async function getEarnedBadges(accessToken: string): Promise<MemberBadgeSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["MemberBadgeResponse"][]>("/api/v1/badges", { accessToken }),
    "getEarnedBadges",
  );
  return data.map((item, index) => toMemberBadgeSummary(item, `getEarnedBadges[${index}]`));
}
