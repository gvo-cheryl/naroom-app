import { logger } from "@/lib/logger";

import { ApiError, ApiNetworkError } from "./errors";

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: unknown;
  accessToken?: string;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }
  return baseUrl.replace(/\/$/, "");
}

// 성공 응답은 { data } 봉투를 벗겨서 반환하고, 실패 응답은 ApiError로 던진다.
// Authorization 헤더 값이나 요청/응답 바디는 어디에서도 로그로 남기지 않는다.
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T | undefined> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const method = options.method ?? "GET";
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { method, headers, body });
  } catch (cause) {
    logger.error("api.client", "network request failed", { method, path });
    throw new ApiNetworkError(cause);
  }

  if (response.status === 204) {
    return undefined;
  }

  const raw = await response.text();
  const parsed = raw.length > 0 ? JSON.parse(raw) : undefined;

  if (!response.ok) {
    const apiError = new ApiError(response.status, parsed ?? {});
    logger.error("api.client", "request failed", {
      method,
      path,
      status: apiError.status,
      code: apiError.code,
      traceId: apiError.traceId,
    });
    throw apiError;
  }

  logger.debug("api.client", "request succeeded", { method, path, status: response.status });
  return (parsed as { data?: T } | undefined)?.data;
}
