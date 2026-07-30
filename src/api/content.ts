import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import { requireData, toQuoteSummary, type QuoteSummary } from "./types";

export async function getTodayQuote(accessToken: string): Promise<QuoteSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["QuoteResponse"]>("/api/v1/content/quotes/today", { accessToken }),
    "getTodayQuote",
  );
  return toQuoteSummary(data, "getTodayQuote");
}
