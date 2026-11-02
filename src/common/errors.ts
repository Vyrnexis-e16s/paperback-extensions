export type ExtensionErrorClass =
  | "network-unavailable"
  | "dns-failure"
  | "tls-error"
  | "timeout"
  | "rate-limited"
  | "authentication-required"
  | "authorization-denied"
  | "content-removed"
  | "website-maintenance"
  | "unexpected-structure"
  | "invalid-json"
  | "empty-chapter-list"
  | "broken-image"
  | "broken-cover"
  | "missing-metadata"
  | "source-unmaintained"
  | "unsupported-format"
  | "registry-manifest-failure"

export class ClassifiedError extends Error {
  readonly errorClass: ExtensionErrorClass
  readonly retryable: boolean
  readonly retryAfterMs?: number

  constructor(
    errorClass: ExtensionErrorClass,
    message: string,
    options?: { retryable?: boolean; retryAfterMs?: number; cause?: unknown },
  ) {
    super(message)
    this.name = "ClassifiedError"
    this.errorClass = errorClass
    this.retryable = options?.retryable ?? false
    this.retryAfterMs = options?.retryAfterMs
    if (options?.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

export function classifyHttpStatus(status: number): ExtensionErrorClass {
  if (status === 401) return "authentication-required"
  if (status === 403) return "authorization-denied"
  if (status === 404) return "content-removed"
  if (status === 408) return "timeout"
  if (status === 429) return "rate-limited"
  if (status === 503) return "website-maintenance"
  if (status >= 500) return "website-maintenance"
  return "unexpected-structure"
}

export function isRetryable(errorClass: ExtensionErrorClass): boolean {
  return (
    errorClass === "timeout" ||
    errorClass === "rate-limited" ||
    errorClass === "website-maintenance" ||
    errorClass === "network-unavailable"
  )
}
