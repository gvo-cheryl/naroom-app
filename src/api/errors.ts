// error-response.md 공통 오류 계약(RFC 9457 ProblemDetail)과 1:1로 대응한다.
export type ErrorStage =
  | "REQUEST"
  | "DEVICE"
  | "LOGIN"
  | "TOKEN"
  | "SESSION"
  | "ACCOUNT"
  | "ONBOARDING"
  | "PERSISTENCE"
  | "EXTERNAL"
  | "INTERNAL"
  | (string & {});

export type ErrorAction =
  | "NONE"
  | "RETRY"
  | "CHECK_REQUEST"
  | "CHECK_DEVICE"
  | "LOGIN_REQUIRED"
  | "REFRESH_REQUIRED"
  | "CLEAR_SESSION_AND_LOGIN"
  | "COMPLETE_ONBOARDING"
  | "CONFIRM_ACCOUNT_RECOVERY"
  | "RELOAD_RESOURCE"
  | "CONTACT_SUPPORT"
  | (string & {});

export interface ApiViolation {
  field: string;
  code: string;
  message: string;
}

interface ProblemDetailBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  stage?: string;
  action?: string;
  retryable?: boolean;
  timestamp?: string;
  traceId?: string;
  context?: Record<string, unknown>;
  violations?: ApiViolation[];
}

// 서버가 code로 응답한 경우: 앱은 title/detail을 화면에 그대로 노출하지 않고 code로 분기한다.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly stage: ErrorStage;
  readonly action: ErrorAction;
  readonly retryable: boolean;
  readonly traceId?: string;
  readonly context?: Record<string, unknown>;
  readonly violations?: ApiViolation[];

  constructor(status: number, body: ProblemDetailBody) {
    super(body.detail ?? body.title ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code ?? "COMMON_INTERNAL_ERROR";
    this.stage = (body.stage as ErrorStage) ?? "INTERNAL";
    this.action = (body.action as ErrorAction) ?? "CONTACT_SUPPORT";
    this.retryable = body.retryable ?? false;
    this.traceId = body.traceId;
    this.context = body.context;
    this.violations = body.violations;
  }
}

// 응답 자체를 받지 못한 경우(오프라인, 타임아웃, DNS 실패 등) — 서버가 준 code가 없다.
export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super("Network request failed");
    this.name = "ApiNetworkError";
    this.cause = cause;
  }
}
