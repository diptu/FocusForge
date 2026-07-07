import { validateNewSkillName, validateNewSubSkillName, slugify } from "./skill.rules";

describe("validateNewSkillName / validateNewSubSkillName", () => {
  it("accepts a normal name and derives a slug", () => {
    const result = validateNewSkillName("Linear Algebra");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: "Linear Algebra", slug: "linear-algebra" });
    }
  });

  it("trims surrounding whitespace", () => {
    const result = validateNewSkillName("  Statistics  ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Statistics");
    }
  });

  it("rejects an empty name", () => {
    expect(validateNewSkillName("").ok).toBe(false);
    expect(validateNewSkillName("   ").ok).toBe(false);
  });

  it("rejects a name longer than 60 characters", () => {
    expect(validateNewSkillName("a".repeat(61)).ok).toBe(false);
    expect(validateNewSkillName("a".repeat(60)).ok).toBe(true);
  });

  it("rejects a name that slugifies to nothing", () => {
    const result = validateNewSkillName("!!!");
    expect(result).toEqual({
      ok: false,
      error: { code: "NAME_INVALID", message: expect.any(String) },
    });
  });

  it("validateNewSubSkillName applies the same rules", () => {
    expect(validateNewSubSkillName("Linear Algebra").ok).toBe(true);
    expect(validateNewSubSkillName("").ok).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and dashes separators", () => {
    expect(slugify("Linear Algebra")).toBe("linear-algebra");
  });

  it("maps & to and", () => {
    expect(slugify("Async & Promises")).toBe("async-and-promises");
  });

  it("strips leading/trailing dashes from punctuation", () => {
    expect(slugify("-- Stats! --")).toBe("stats");
  });
});
