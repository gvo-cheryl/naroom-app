import { apiFetch } from "./client";
import type { components } from "./generated/openapi.types";
import {
  requireData,
  toNotificationPreferenceSummary,
  type NotificationPreferenceSummary,
  type NotificationType,
} from "./types";

export async function updateDevicePushToken(
  accessToken: string,
  installationKey: string,
  pushToken: string,
): Promise<void> {
  await apiFetch<never>("/api/v1/account/device/push-token", {
    method: "PATCH",
    accessToken,
    body: { installationKey, pushToken } satisfies components["schemas"]["DevicePushTokenUpdateRequest"],
  });
}

export async function getNotificationPreferences(accessToken: string): Promise<NotificationPreferenceSummary[]> {
  const data = requireData(
    await apiFetch<components["schemas"]["NotificationPreferenceResponse"][]>(
      "/api/v1/account/notification-preferences",
      { accessToken },
    ),
    "getNotificationPreferences",
  );
  return data.map((item, index) => toNotificationPreferenceSummary(item, `getNotificationPreferences[${index}]`));
}

export async function requestAccountWithdrawal(accessToken: string): Promise<string> {
  const data = requireData(
    await apiFetch<components["schemas"]["AccountWithdrawalResponse"]>("/api/v1/account/withdrawal", {
      method: "POST",
      accessToken,
    }),
    "requestAccountWithdrawal",
  );
  if (!data.scheduledDeletionAt) {
    throw new Error("requestAccountWithdrawal: response body is missing \"scheduledDeletionAt\"");
  }
  return data.scheduledDeletionAt;
}

export async function updateNotificationPreference(
  accessToken: string,
  type: NotificationType,
  request: { enabled: boolean; localTime?: string | null; dayOfWeek?: number | null },
): Promise<NotificationPreferenceSummary> {
  const data = requireData(
    await apiFetch<components["schemas"]["NotificationPreferenceResponse"]>(
      `/api/v1/account/notification-preferences/${type}`,
      {
        method: "PUT",
        accessToken,
        body: {
          enabled: request.enabled,
          localTime: request.localTime ?? undefined,
          dayOfWeek: request.dayOfWeek ?? undefined,
        } satisfies components["schemas"]["NotificationPreferenceUpdateRequest"],
      },
    ),
    "updateNotificationPreference",
  );
  return toNotificationPreferenceSummary(data, "updateNotificationPreference");
}
