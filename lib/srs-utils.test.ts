import { describe, it, expect } from "vitest";
import { calculateNextReviewDate, getInitialReviewDate, SRS_INTERVALS } from "./srs-utils";
import { format } from "date-fns";

describe("SRS Utils", () => {
  const baseDate = new Date(2026, 3, 4); // April 4, 2026

  it("should calculate the initial review date correctly", () => {
    const nextDate = getInitialReviewDate(baseDate);
    expect(format(nextDate, "yyyy-MM-dd HH:mm")).toBe("2026-04-05 10:00");
  });

  it("should calculate the 1st review date (after step 0 review)", () => {
    const nextDate = calculateNextReviewDate(0, baseDate);
    // Interval 0 is 1 day
    expect(format(nextDate!, "yyyy-MM-dd HH:mm")).toBe("2026-04-05 10:00");
  });

  it("should calculate the 2nd review date (after step 1 review)", () => {
    const nextDate = calculateNextReviewDate(1, baseDate);
    // Interval 1 is 3 days
    expect(format(nextDate!, "yyyy-MM-dd HH:mm")).toBe("2026-04-07 10:00");
  });

  it("should calculate the 3rd review date (after step 2 review)", () => {
    const nextDate = calculateNextReviewDate(2, baseDate);
    // Interval 2 is 7 days
    expect(format(nextDate!, "yyyy-MM-dd HH:mm")).toBe("2026-04-11 10:00");
  });

  it("should calculate the 4th review date (after step 3 review)", () => {
    const nextDate = calculateNextReviewDate(3, baseDate);
    // Interval 3 is 30 days
    expect(format(nextDate!, "yyyy-MM-dd HH:mm")).toBe("2026-05-04 10:00");
  });

  it("should return null after all review stages are completed", () => {
      const nextDate = calculateNextReviewDate(SRS_INTERVALS.length, baseDate);
      expect(nextDate).toBeNull();
  });
});
