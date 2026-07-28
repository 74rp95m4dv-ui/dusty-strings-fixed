import { describe, expect, it } from "vitest";
import { calculateRecordingWeeks, clamp, runPublishingAccounting, type SignedPublishing } from "./gameLogic";

describe("core career economy", () => {
  it("keeps recording schedules within the three-week minimum", () => {
    expect(calculateRecordingWeeks("Single", 1, "home_studio", "self", "rush")).toBeGreaterThanOrEqual(3);
  });

  it("caps player-facing values to their requested bounds", () => {
    expect(clamp(-4, 0, 100)).toBe(0);
    expect(clamp(104, 0, 100)).toBe(100);
    expect(clamp(45, 0, 100)).toBe(45);
  });

  it("uses publishing income to recoup advances before paying the artist share", () => {
    const publishing: SignedPublishing = {
      id: "test", publisherName: "Test Music", type: "co_pub", advance: 1000, advanceRecouped: 900,
      artistSplit: 0.5, termWeeks: 52, weeksLeft: 52, isRecouped: false, signedAtWeek: 1,
    };
    expect(runPublishingAccounting(publishing, 400)).toEqual({ artistShare: 200, recouped: 100, isRecouped: true });
  });
});
