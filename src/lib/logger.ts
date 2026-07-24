// 시뮬레이터/실기기에서 사용자가 직접 확인해야 하는 흐름(카카오 로그인 등)은 내가 직접 화면을
// 보고 디버깅할 수 없다. 실패 지점마다 무슨 코드로 왜 실패했는지 터미널/Xcode 콘솔에서 바로 보이도록
// 이 로거를 거쳐서만 로그를 남긴다 — 토큰·Authorization 헤더·카카오 원문 응답은 절대 넣지 않는다.

type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /token|password|secret|authorization|providerAccessToken/i;

// 호출부가 실수로 민감한 값을 context에 넣어도 마지막 방어선으로 한 번 더 가린다.
function sanitize(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : value;
  }
  return sanitized;
}

function format(scope: string, message: string): string {
  return `[${scope}] ${message}`;
}

export const logger = {
  // 정상 흐름의 상태 전환 등 상세 추적용. 개발 빌드에서만 남긴다.
  debug(scope: string, message: string, context?: LogContext) {
    if (__DEV__) {
      console.log(format(scope, message), sanitize(context) ?? "");
    }
  },
  warn(scope: string, message: string, context?: LogContext) {
    console.warn(format(scope, message), sanitize(context) ?? "");
  },
  // 사용자가 화면에서 겪은 실패와 1:1로 대응하는 로그. 항상 남긴다(빌드 종류와 무관).
  error(scope: string, message: string, context?: LogContext) {
    console.error(format(scope, message), sanitize(context) ?? "");
  },
};
