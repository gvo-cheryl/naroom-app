import * as SecureStore from "@/lib/secureStorage";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "naroom_theme_preference";

// 새 저장소 의존성을 추가하는 대신, 이미 세션에 쓰고 있는 SecureStore를 재사용한다.
// 값 자체는 민감정보가 아니지만 앱 전체에서 이미 링크된 저장소라 네이티브 재빌드를 피할 수 있다.
export async function loadThemePreference(): Promise<ThemePreference> {
  const value = await SecureStore.getItemAsync(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, preference);
}
