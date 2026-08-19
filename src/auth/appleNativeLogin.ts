import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

import { logger } from "@/lib/logger";

export interface AppleLoginCredential {
  identityToken: string;
  rawNonce: string;
  fullName?: string;
}

// Apple 공식 가이드: 원문 nonce를 만들고 그 SHA-256 해시를 authorization 요청에 실어 보내면,
// identity token의 nonce claim에는 해시값이 들어간다. 서버(AppleClient)는 원문 nonce를 다시
// 해시해 비교하므로, 원문은 여기서만 쓰고 그대로 백엔드에 넘긴다.
async function createHashedNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  return { rawNonce, hashedNonce };
}

function toFullName(name: AppleAuthentication.AppleAuthenticationFullName | null): string | undefined {
  if (!name) {
    return undefined;
  }
  const parts = [name.familyName, name.givenName].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(" ") : undefined;
}

// Apple 네이티브 SDK가 돌려주는 identityToken 원문은 저장하거나 로그로 남기지 않는다.
// 백엔드 교환(appleLogin/appleRestore API)에 즉시 사용하고 그 자리에서 버린다.
// fullName은 최초 승인 때만 내려오므로(재로그인 시 undefined), 있을 때만 백엔드로 넘긴다.
// 사용자가 취소하면(ERR_REQUEST_CANCELED) 에러가 아니라 null을 반환해, 호출부가 에러 토스트 없이
// 로그인 화면을 유지할 수 있게 한다.
export async function requestAppleCredential(): Promise<AppleLoginCredential | null> {
  try {
    const { rawNonce, hashedNonce } = await createHashedNonce();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error("Apple sign-in succeeded without an identityToken");
    }

    return {
      identityToken: credential.identityToken,
      rawNonce,
      fullName: toFullName(credential.fullName),
    };
  } catch (error) {
    const nativeError = error as { code?: string } | undefined;
    if (nativeError?.code === "ERR_REQUEST_CANCELED") {
      return null;
    }
    logger.error("auth.appleSdk", "apple native login failed", {
      code: nativeError?.code,
      message: error instanceof Error ? error.message : undefined,
    });
    throw error;
  }
}
