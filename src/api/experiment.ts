import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toExperimentActiveProgramSummary,
  toExperimentPastProgramSummary,
  toExperimentProgramSummary,
  toExperimentRecommendationSummary,
  toExperimentTopicSummary,
  type ExperimentActiveProgramSummary,
  type ExperimentPastProgramSummary,
  type ExperimentProgramSummary,
  type ExperimentRecommendationSummary,
  type ExperimentTopicSummary,
} from "./types";

export async function getExperimentTopics(accessToken: string): Promise<ExperimentTopicSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentTopicResponse"][]>("/api/v1/experiments/topics", { accessToken }),
    "getExperimentTopics",
  );
  return data.map((topic, index) => toExperimentTopicSummary(topic, `getExperimentTopics[${index}]`));
}

export interface ExperimentProgramListFilter {
  durationDays?: number;
  topicCode?: string;
  featured?: boolean;
  beginner?: boolean;
}

export async function getExperimentPrograms(
  accessToken: string,
  filter: ExperimentProgramListFilter = {},
): Promise<ExperimentProgramSummary[]> {
  const params = new URLSearchParams();
  if (filter.durationDays !== undefined) {
    params.set("durationDays", String(filter.durationDays));
  }
  if (filter.topicCode !== undefined) {
    params.set("topicCode", filter.topicCode);
  }
  if (filter.featured !== undefined) {
    params.set("featured", String(filter.featured));
  }
  if (filter.beginner !== undefined) {
    params.set("beginner", String(filter.beginner));
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentProgramSummaryResponse"][]>(
      `/api/v1/experiments/programs${query}`,
      { accessToken },
    ),
    "getExperimentPrograms",
  );
  return data.map((program, index) => toExperimentProgramSummary(program, `getExperimentPrograms[${index}]`));
}

export async function getActiveExperimentProgram(accessToken: string): Promise<ExperimentActiveProgramSummary | null> {
  const data = await apiFetch<components["schemas"]["ExperimentActiveProgramResponse"]>(
    "/api/v1/experiments/user-programs/active",
    { accessToken },
  );
  return toExperimentActiveProgramSummary(data ?? null, "getActiveExperimentProgram");
}

export async function getPastExperimentPrograms(accessToken: string): Promise<ExperimentPastProgramSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentPastProgramResponse"][]>(
      "/api/v1/experiments/user-programs/past",
      { accessToken },
    ),
    "getPastExperimentPrograms",
  );
  return data.map((program, index) => toExperimentPastProgramSummary(program, `getPastExperimentPrograms[${index}]`));
}

export async function getExperimentRecommendations(accessToken: string): Promise<ExperimentRecommendationSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentRecommendationResponse"][]>(
      "/api/v1/experiments/recommendations",
      { accessToken },
    ),
    "getExperimentRecommendations",
  );
  return data.map((recommendation, index) =>
    toExperimentRecommendationSummary(recommendation, `getExperimentRecommendations[${index}]`),
  );
}
