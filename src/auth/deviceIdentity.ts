import * as Crypto from "expo-crypto";
import * as SecureStore from "@/lib/secureStorage";
import { Platform } from "react-native";

import type { DeviceInfo } from "@/api/types";

// installationKey는 세션 발급 시 등록한 값과 재발급 요청 때 반드시 같아야 한다(AUTH_DEVICE_MISMATCH 방지).
// 로그인 세션과 무관하게(로그아웃해도) 이 설치를 계속 식별해야 하므로 tokenStorage의 세션 정리 대상에 넣지 않는다.
const INSTALLATION_KEY = "naroom_installation_key";

let cachedInstallationKey: string | null = null;

export async function getOrCreateInstallationKey(): Promise<string> {
  if (cachedInstallationKey) {
    return cachedInstallationKey;
  }

  const existing = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (existing) {
    cachedInstallationKey = existing;
    return existing;
  }

  const generated = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_KEY, generated);
  cachedInstallationKey = generated;
  return generated;
}

export function getDevicePlatform(): DeviceInfo["platform"] {
  return Platform.OS === "ios" ? "IOS" : "ANDROID";
}
