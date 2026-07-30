import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import { requireData, toQuoteSummary, toSavedQuoteSummary, type QuoteSummary, type SavedQuoteSummary } from "./types";

export async function getTodayQuote(accessToken: string): Promise<QuoteSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["QuoteResponse"]>("/api/v1/content/quotes/today", { accessToken }),
    "getTodayQuote",
  );
  return toQuoteSummary(data, "getTodayQuote");
}

export async function saveQuote(accessToken: string, quoteId: string): Promise<void> {
  await apiFetch<never>(`/api/v1/content/quotes/${quoteId}/save`, { method: "POST", accessToken });
}

export async function unsaveQuote(accessToken: string, quoteId: string): Promise<void> {
  await apiFetch<never>(`/api/v1/content/quotes/${quoteId}/save`, { method: "DELETE", accessToken });
}

export async function getSavedQuotes(accessToken: string): Promise<SavedQuoteSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["SavedQuoteResponse"][]>("/api/v1/content/quotes/saved", { accessToken }),
    "getSavedQuotes",
  );
  return data.map((item, index) => toSavedQuoteSummary(item, `getSavedQuotes[${index}]`));
}
