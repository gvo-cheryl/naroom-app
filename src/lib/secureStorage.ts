import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// expo-secure-store는 웹에서 getValueWithKeyAsync를 제공하지 않아 세션/테마 로드 시점에 앱 전체가
// 멈춘다(Expo Web preview mode 도입 작업에서 실제로 겪음). 네이티브(iOS/Android)는 그대로 SecureStore를
// 쓰고, 웹만 localStorage로 대체한다 - 미리보기는 naroom-api §16.2의 격리된 합성 세션/짧은 수명 preview
// token을 쓰므로, 실제 사용자 refresh token을 웹에 평문 저장하는 상황 자체가 없다.
const isWeb = Platform.OS === "web";

export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
