import { monthStartUTC, monthEndUTC, weekStartMonday, isAfterDateOnly } from "./date-utils";

describe("monthStartUTC", () => {
  it("returns the 1st of the given month", () => {
    expect(monthStartUTC(new Date("2026-07-15T10:00:00.000Z")).toISOString().slice(0, 10)).toBe(
      "2026-07-01",
    );
  });
});

describe("monthEndUTC", () => {
  it("returns the last day of a 31-day month", () => {
    expect(monthEndUTC(new Date("2026-07-15T10:00:00.000Z")).toISOString().slice(0, 10)).toBe(
      "2026-07-31",
    );
  });

  it("returns the last day of February in a leap year", () => {
    expect(monthEndUTC(new Date("2028-02-10T10:00:00.000Z")).toISOString().slice(0, 10)).toBe(
      "2028-02-29",
    );
  });
});

describe("weekStartMonday", () => {
  it("returns the same date when given a Monday", () => {
    expect(weekStartMonday(new Date("2026-07-06T00:00:00.000Z")).toISOString().slice(0, 10)).toBe(
      "2026-07-06",
    );
  });

  it("rolls a Sunday back to the preceding Monday", () => {
    expect(weekStartMonday(new Date("2026-07-12T00:00:00.000Z")).toISOString().slice(0, 10)).toBe(
      "2026-07-06",
    );
  });
});

describe("isAfterDateOnly", () => {
  it("ignores time-of-day, compares calendar dates only", () => {
    const a = new Date("2026-07-07T23:59:00.000Z");
    const b = new Date("2026-07-07T00:01:00.000Z");
    expect(isAfterDateOnly(a, b)).toBe(false);
  });
});
