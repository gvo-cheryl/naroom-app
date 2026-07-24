import { ApiError, ApiNetworkError } from "./errors";

describe("ApiError", () => {
  it("error-response.md 계약 필드를 그대로 옮긴다", () => {
    const error = new ApiError(403, {
      code: "ACCOUNT_LOCKED",
      stage: "ACCOUNT",
      action: "CONTACT_SUPPORT",
      retryable: false,
      traceId: "trace-123",
      detail: "잠긴 회원",
    });

    expect(error.status).toBe(403);
    expect(error.code).toBe("ACCOUNT_LOCKED");
    expect(error.stage).toBe("ACCOUNT");
    expect(error.action).toBe("CONTACT_SUPPORT");
    expect(error.retryable).toBe(false);
    expect(error.traceId).toBe("trace-123");
    expect(error.message).toBe("잠긴 회원");
  });

  it("context와 violations를 보존한다", () => {
    const error = new ApiError(409, {
      code: "ACCOUNT_PENDING_DELETION",
      context: { scheduledDeletionAt: "2026-08-01T00:00:00Z" },
    });
    expect(error.context).toEqual({ scheduledDeletionAt: "2026-08-01T00:00:00Z" });

    const validationError = new ApiError(400, {
      code: "COMMON_VALIDATION_FAILED",
      violations: [{ field: "consents", code: "REQUIRED", message: "필수 동의를 확인해 주세요." }],
    });
    expect(validationError.violations).toEqual([
      { field: "consents", code: "REQUIRED", message: "필수 동의를 확인해 주세요." },
    ]);
  });

  it("서버가 code를 안 준 예상 밖 응답도 안전한 기본값으로 처리한다", () => {
    const error = new ApiError(500, {});
    expect(error.code).toBe("COMMON_INTERNAL_ERROR");
    expect(error.stage).toBe("INTERNAL");
    expect(error.action).toBe("CONTACT_SUPPORT");
    expect(error.retryable).toBe(false);
  });
});

describe("ApiNetworkError", () => {
  it("원인(cause)을 보존한다", () => {
    const cause = new TypeError("Network request failed");
    const error = new ApiNetworkError(cause);
    expect(error.name).toBe("ApiNetworkError");
    expect(error.cause).toBe(cause);
  });
});
