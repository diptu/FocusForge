import { validateStudySessionInput } from "./study-session.rules";

const now = new Date("2026-07-07T12:00:00.000Z");

describe("validateStudySessionInput", () => {
  it("accepts a positive duration on a past date", () => {
    const result = validateStudySessionInput(
      { durationMinutes: 45, occurredAt: new Date("2026-07-01T00:00:00.000Z") },
      now,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts today's date", () => {
    const result = validateStudySessionInput(
      { durationMinutes: 10, occurredAt: new Date("2026-07-07T23:00:00.000Z") },
      now,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects zero duration", () => {
    const result = validateStudySessionInput(
      { durationMinutes: 0, occurredAt: now },
      now,
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "DURATION_NOT_POSITIVE", message: expect.any(String) },
    });
  });

  it("rejects negative duration", () => {
    const result = validateStudySessionInput(
      { durationMinutes: -5, occurredAt: now },
      now,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts tomorrow's date (timezone slack — see study-session.rules.ts)", () => {
    const result = validateStudySessionInput(
      { durationMinutes: 30, occurredAt: new Date("2026-07-08T00:00:00.000Z") },
      now,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a date beyond the 1-day tolerance", () => {
    const result = validateStudySessionInput(
      { durationMinutes: 30, occurredAt: new Date("2026-07-09T00:00:00.000Z") },
      now,
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "OCCURRED_AT_IN_FUTURE", message: expect.any(String) },
    });
  });
});
