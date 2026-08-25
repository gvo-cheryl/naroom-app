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

// preview session이 관리자 화면에서 지정한 DRAFT(또는 임의 상태) 버전을 그대로 돌려준다.
// 회원 API와 응답 스키마(QuoteResponse)가 같아 매퍼(toQuoteSummary)를 그대로 재사용한다.
export async function getPreviewTodayQuote(previewToken: string): Promise<QuoteSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["QuoteResponse"]>("/api/v1/preview/content/quotes/today", {
      previewToken,
    }),
    "getPreviewTodayQuote",
  );
  return toQuoteSummary(data, "getPreviewTodayQuote");
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
