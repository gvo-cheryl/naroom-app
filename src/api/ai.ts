import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toAiFeedbackReportSummary,
  toAiFeedbackSummary,
  type AiFeedbackHelpfulness,
  type AiFeedbackReportSummary,
  type AiFeedbackSummary,
} from "./types";

export async function submitAiFeedback(
  accessToken: string,
  generationRunId: string,
  request: { helpfulness: AiFeedbackHelpfulness; reasonCode?: string; customReason?: string },
): Promise<AiFeedbackSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["AiFeedbackResponse"]>(
      `/api/v1/ai/generation-runs/${generationRunId}/feedback`,
      { method: "PUT", body: request, accessToken },
    ),
    "submitAiFeedback",
  );
  return toAiFeedbackSummary(data, "submitAiFeedback");
}

export async function confirmAiFeedbackLongTerm(
  accessToken: string,
  generationRunId: string,
  applyLongTerm: boolean,
): Promise<AiFeedbackSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["AiFeedbackResponse"]>(
      `/api/v1/ai/generation-runs/${generationRunId}/feedback/long-term`,
      { method: "PATCH", body: { applyLongTerm }, accessToken },
    ),
    "confirmAiFeedbackLongTerm",
  );
  return toAiFeedbackSummary(data, "confirmAiFeedbackLongTerm");
}

export async function reportAiGeneration(
  accessToken: string,
  generationRunId: string,
  request: { reasonCode: string; comment?: string },
): Promise<AiFeedbackReportSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["AiFeedbackReportResponse"]>(
      `/api/v1/ai/generation-runs/${generationRunId}/reports`,
      { method: "POST", body: request, accessToken },
    ),
    "reportAiGeneration",
  );
  return toAiFeedbackReportSummary(data, "reportAiGeneration");
}
