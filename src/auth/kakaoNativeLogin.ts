import { login } from "@react-native-seoul/kakao-login";

import { logger } from "@/lib/logger";

// 카카오 네이티브 SDK가 돌려주는 원문 토큰은 저장하거나 로그로 남기지 않는다.
// 백엔드 교환(kakaoLogin API)에 즉시 사용하고 그 자리에서 버린다.
export async function requestKakaoProviderAccessToken(): Promise<string> {
  try {
    const token = await login();
    return token.accessToken;
  } catch (error) {
    // 카카오 SDK 에러는 code(KOE101=앱 키 불일치, KOE320=사용자 취소 등)로 원인을 구분한다.
    // 실기기 테스트에서 "로그인이 안 된다"고 할 때 가장 먼저 봐야 하는 로그다.
    const nativeError = error as { code?: string; message?: string } | undefined;
    logger.error("auth.kakaoSdk", "kakao native login failed", {
      code: nativeError?.code,
      message: nativeError?.message,
    });
    throw error;
  }
}
