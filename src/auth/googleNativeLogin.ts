import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { logger } from "@/lib/logger";

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) {
    return;
  }
  // Firebase 미사용 - 자체 백엔드가 idToken을 직접 검증한다(naroom-api GoogleClient).
  // webClientId는 서버가 aud로 허용하는 값과 같아야 한다(GOOGLE_OAUTH_WEB_CLIENT_ID).
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  isConfigured = true;
}

// Google 네이티브 SDK가 돌려주는 원문 토큰은 저장하거나 로그로 남기지 않는다.
// 백엔드 교환(googleLogin/googleRestore API)에 즉시 사용하고 그 자리에서 버린다.
// 사용자가 계정 선택 화면을 닫은 취소는 에러가 아니라 null로 알려, 호출부가 에러 토스트 없이
// 로그인 화면을 유지할 수 있게 한다.
export async function requestGoogleIdToken(): Promise<string | null> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") {
      return null;
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error("Google sign-in succeeded without an idToken");
    }
    return idToken;
  } catch (error) {
    logger.error("auth.googleSdk", "google native login failed", {
      name: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : undefined,
    });
    throw error;
  }
}
