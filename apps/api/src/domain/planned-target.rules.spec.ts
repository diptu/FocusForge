import { validatePlannedTargetInput, computeAdherencePercent } from "./planned-target.rules";

describe("validatePlannedTargetInput", () => {
  it("normalizes weekStartDate to the Monday of its week", () => {
    // 2026-07-08 is a Wednesday
    const result = validatePlannedTargetInput({
      targetMinutes: 300,
      weekStartDate: new Date("2026-07-08T15:00:00.000Z"),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.weekStartDate.toISOString().slice(0, 10)).toBe("2026-07-06");
    }
  });

  it("rejects zero or negative targetMinutes", () => {
    expect(
      validatePlannedTargetInput({ targetMinutes: 0, weekStartDate: new Date() }).ok,
    ).toBe(false);
    expect(
      validatePlannedTargetInput({ targetMinutes: -10, weekStartDate: new Date() }).ok,
    ).toBe(false);
  });
});

describe("computeAdherencePercent", () => {
  it("computes the ratio as a rounded percentage", () => {
    expect(computeAdherencePercent(150, 300)).toBe(50);
    expect(computeAdherencePercent(300, 300)).toBe(100);
    expect(computeAdherencePercent(450, 300)).toBe(150);
  });

  it("returns 0 when target is 0 (no divide-by-zero)", () => {
    expect(computeAdherencePercent(100, 0)).toBe(0);
  });
});
