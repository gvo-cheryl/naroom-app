import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export const PREVIEW_TOKEN_MESSAGE_TYPE = "naroom-admin:preview-token";
export const PREVIEW_READY_MESSAGE_TYPE = "naroom-app:preview-ready";

interface PreviewTokenMessage {
  type: typeof PREVIEW_TOKEN_MESSAGE_TYPE;
  token: string;
}

function isPreviewTokenMessage(data: unknown): data is PreviewTokenMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === PREVIEW_TOKEN_MESSAGE_TYPE &&
    typeof (data as { token?: unknown }).token === "string"
  );
}

// Admin Web Implementation Spec §16.2/16.5: token은 URL query에 장기간 남기지 않고 iframe 초기
// handshake(postMessage) 후 메모리에서만 쓴다. naroom-admin이 EXPO_PUBLIC_ADMIN_ORIGIN과 같은
// origin으로 { type, token }을 보내면 그 값을 우선한다. 쿼리 파라미터는 iframe 밖(직접 접속)
// 로컬 개발·디버깅용 폴백으로만 남겨둔다.
export function usePreviewToken(): string | undefined {
  const { token: queryToken } = useLocalSearchParams<{ token?: string }>();
  const [messageToken, setMessageToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }
    const allowedOrigin = process.env.EXPO_PUBLIC_ADMIN_ORIGIN;
    function handleMessage(event: MessageEvent) {
      if (allowedOrigin && event.origin !== allowedOrigin) {
        return;
      }
      if (isPreviewTokenMessage(event.data)) {
        setMessageToken(event.data.token);
      }
    }
    window.addEventListener("message", handleMessage);

    // iframe.onLoad는 문서·리소스 로드 시점일 뿐 이 리스너가 걸리기 전일 수 있다(특히 dev 서버처럼
    // 번들을 그때그때 컴파일하는 경우) - 리스너가 실제로 준비된 뒤 "ready"를 보내 admin이 그 신호를
    // 받고 나서 토큰을 보내도록 한다(진짜 handshake). window.top이 아니라 window.parent를 쓰는 이유는
    // 중첩 iframe이 아니라 바로 위 프레임(관리자 페이지)에게만 알리면 되기 때문이다.
    if (window.parent !== window) {
      window.parent.postMessage({ type: PREVIEW_READY_MESSAGE_TYPE }, allowedOrigin || "*");
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return messageToken ?? queryToken;
}
