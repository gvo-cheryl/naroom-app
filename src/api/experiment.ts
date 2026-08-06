import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toExperimentActiveProgramSummary,
  toExperimentPastProgramSummary,
  toExperimentProgramDetailSummary,
  toExperimentProgramSummary,
  toExperimentRandomProgramSummary,
  toExperimentRecommendationSummary,
  toExperimentSavedProgramSummary,
  toExperimentStartedProgramSummary,
  toExperimentTopicSummary,
  type ExperimentActiveProgramSummary,
  type ExperimentPastProgramSummary,
  type ExperimentProgramDetailSummary,
  type ExperimentProgramSummary,
  type ExperimentRandomProgramSummary,
  type ExperimentRecommendationSummary,
  type ExperimentSavedProgramSummary,
  type ExperimentStartedProgramSummary,
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

export async function getExperimentProgramDetail(
  accessToken: string,
  programId: string,
): Promise<ExperimentProgramDetailSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentProgramDetailResponse"]>(
      `/api/v1/experiments/programs/${programId}`,
      { accessToken },
    ),
    "getExperimentProgramDetail",
  );
  return toExperimentProgramDetailSummary(data, "getExperimentProgramDetail");
}

export async function getRandomExperimentProgram(
  accessToken: string,
  durationDays: number,
): Promise<ExperimentRandomProgramSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentRandomProgramResponse"]>(
      `/api/v1/experiments/programs/random?days=${durationDays}`,
      { accessToken },
    ),
    "getRandomExperimentProgram",
  );
  return toExperimentRandomProgramSummary(data, "getRandomExperimentProgram");
}

export interface StartOrSaveExperimentProgramOptions {
  recommendationId?: string;
  replaceActiveProgram?: boolean;
}

export async function startExperimentProgram(
  accessToken: string,
  programId: string,
  options: StartOrSaveExperimentProgramOptions = {},
): Promise<ExperimentStartedProgramSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentProgramStartResponse"]>(
      `/api/v1/experiments/programs/${programId}/start`,
      {
        method: "POST",
        body: {
          recommendationId: options.recommendationId,
          replaceActiveProgram: options.replaceActiveProgram ?? false,
        },
        accessToken,
      },
    ),
    "startExperimentProgram",
  );
  return toExperimentStartedProgramSummary(data, "startExperimentProgram");
}

export async function saveExperimentProgram(
  accessToken: string,
  programId: string,
  options: StartOrSaveExperimentProgramOptions = {},
): Promise<ExperimentSavedProgramSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentProgramSaveResponse"]>(
      `/api/v1/experiments/programs/${programId}/save`,
      {
        method: "POST",
        body: {
          recommendationId: options.recommendationId,
          replaceActiveProgram: options.replaceActiveProgram ?? false,
        },
        accessToken,
      },
    ),
    "saveExperimentProgram",
  );
  return toExperimentSavedProgramSummary(data, "saveExperimentProgram");
}

export async function startRandomExperimentProgram(
  accessToken: string,
  durationDays: number,
  replaceActiveProgram = false,
): Promise<ExperimentStartedProgramSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["ExperimentProgramStartResponse"]>(
      "/api/v1/experiments/programs/random/start",
      {
        method: "POST",
        body: { durationDays, replaceActiveProgram },
        accessToken,
      },
    ),
    "startRandomExperimentProgram",
  );
  return toExperimentStartedProgramSummary(data, "startRandomExperimentProgram");
}
