import * as SecureStore from "expo-secure-store";

// AGENTS.md 인증 규칙: Refresh Token은 AsyncStorage 등 비암호화 저장소에 두지 않는다.
// Access Token도 같은 승인된 보안 저장소(SecureStore)에 함께 둔다.
// 값은 절대 로그로 남기지 않는다.

const KEYS = {
  accessToken: "naroom_access_token",
  accessTokenExpiresAt: "naroom_access_token_expires_at",
  refreshToken: "naroom_refresh_token",
  refreshTokenExpiresAt: "naroom_refresh_token_expires_at",
  sessionId: "naroom_session_id",
  sessionExpiresAt: "naroom_session_expires_at",
} as const;

export interface StoredSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
  sessionExpiresAt: string;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
    SecureStore.setItemAsync(KEYS.accessTokenExpiresAt, session.accessTokenExpiresAt),
    SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
    SecureStore.setItemAsync(KEYS.refreshTokenExpiresAt, session.refreshTokenExpiresAt),
    SecureStore.setItemAsync(KEYS.sessionId, session.sessionId),
    SecureStore.setItemAsync(KEYS.sessionExpiresAt, session.sessionExpiresAt),
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, sessionId, sessionExpiresAt] =
    await Promise.all([
      SecureStore.getItemAsync(KEYS.accessToken),
      SecureStore.getItemAsync(KEYS.accessTokenExpiresAt),
      SecureStore.getItemAsync(KEYS.refreshToken),
      SecureStore.getItemAsync(KEYS.refreshTokenExpiresAt),
      SecureStore.getItemAsync(KEYS.sessionId),
      SecureStore.getItemAsync(KEYS.sessionExpiresAt),
    ]);

  // 토큰이 없다는 것은 앱 시작 단계의 정상 상태다(authentication.md).
  if (!accessToken || !accessTokenExpiresAt || !refreshToken || !refreshTokenExpiresAt || !sessionId || !sessionExpiresAt) {
    return null;
  }

  return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, sessionId, sessionExpiresAt };
}

export async function clearSession(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)));
}
