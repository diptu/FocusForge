/**
 * Domain layer has zero infra dependencies (no Nest, no Prisma, no HTTP) —
 * see services/api/architecture/persistence_patterns.md. Domain rule
 * violations are values, not exceptions; only unexpected faults throw.
 */
export type DomainError = { code: string; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(code: string, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}
