import { validateGoalInput, validateGeneratedOptions } from "./goal-plan.rules";

describe("validateGoalInput", () => {
  it("accepts a well-formed goal with scores", () => {
    const result = validateGoalInput({
      description: "Complete GRE and IELTS",
      durationWeeks: 12,
      currentScores: [{ label: "GRE", score: "310" }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.durationWeeks).toBe(12);
      expect(result.value.currentScores).toEqual([{ label: "GRE", score: "310" }]);
    }
  });

  it("accepts a goal with no scores", () => {
    const result = validateGoalInput({ description: "Learn JS", durationWeeks: 8 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentScores).toEqual([]);
    }
  });

  it("rejects an empty description", () => {
    expect(validateGoalInput({ description: "   ", durationWeeks: 8 }).ok).toBe(false);
  });

  it("rejects durationWeeks outside 1-52", () => {
    expect(validateGoalInput({ description: "x", durationWeeks: 0 }).ok).toBe(false);
    expect(validateGoalInput({ description: "x", durationWeeks: 53 }).ok).toBe(false);
    expect(validateGoalInput({ description: "x", durationWeeks: 1.5 }).ok).toBe(false);
  });

  it("rejects a score missing a label or value", () => {
    const result = validateGoalInput({
      description: "x",
      durationWeeks: 8,
      currentScores: [{ label: "GRE", score: "" }],
    });
    expect(result.ok).toBe(false);
  });
});

function makeOption(weeklyHours: number) {
  return {
    weeklyHours,
    summary: `Plan for ${weeklyHours}h/week`,
    skills: [{ name: "GRE", isNewCategory: true, subSkills: ["Verbal"], weeklyMinutes: 600 }],
    tentativeScores: [{ label: "GRE", current: "310", projected: "320", note: "estimate" }],
  };
}

describe("validateGeneratedOptions", () => {
  it("accepts three well-formed options at 40/30/20 and sorts descending", () => {
    const result = validateGeneratedOptions({
      options: [makeOption(20), makeOption(40), makeOption(30)],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((o) => o.weeklyHours)).toEqual([40, 30, 20]);
    }
  });

  it("rejects a response with the wrong number of options", () => {
    const result = validateGeneratedOptions({ options: [makeOption(40), makeOption(30)] });
    expect(result.ok).toBe(false);
  });

  it("rejects a weeklyHours value outside {40,30,20}", () => {
    const result = validateGeneratedOptions({
      options: [makeOption(40), makeOption(30), makeOption(25)],
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "INVALID_WEEKLY_HOURS", message: expect.any(String) },
    });
  });

  it("rejects duplicate weeklyHours", () => {
    const result = validateGeneratedOptions({
      options: [makeOption(40), makeOption(40), makeOption(20)],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an option with no skills", () => {
    const bad = { ...makeOption(40), skills: [] };
    const result = validateGeneratedOptions({ options: [bad, makeOption(30), makeOption(20)] });
    expect(result.ok).toBe(false);
  });

  it("rejects a skill with non-positive weeklyMinutes", () => {
    const bad = {
      ...makeOption(40),
      skills: [{ name: "GRE", isNewCategory: true, subSkills: [], weeklyMinutes: 0 }],
    };
    const result = validateGeneratedOptions({ options: [bad, makeOption(30), makeOption(20)] });
    expect(result.ok).toBe(false);
  });

  it("defaults tentativeScores to [] when absent", () => {
    const noScores = { ...makeOption(40), tentativeScores: undefined };
    const result = validateGeneratedOptions({
      options: [noScores, makeOption(30), makeOption(20)],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.find((o) => o.weeklyHours === 40)?.tentativeScores).toEqual([]);
    }
  });
});
