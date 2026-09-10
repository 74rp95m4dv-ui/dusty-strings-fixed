import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./gameLogic";
import { generateNashvilleTimes } from "./nashvilleTimes";

describe("Nashville Times editorial balance", () => {
  it("caps routine player coverage while preserving a full world issue", () => {
    const issue = generateNashvilleTimes({
      ...INITIAL_STATE,
      artistName: "The Test Artist",
      fame: 70,
      fans: 12000,
      rep: 60,
      totalReleases: 8,
      currentYear: 1997,
      week: 40,
    });
    expect(issue.stories.length).toBe(18);
    expect(issue.stories.filter(story => story.isPlayer).length).toBeLessThanOrEqual(3);
    expect(issue.stories.filter(story => !story.isPlayer).length).toBeGreaterThanOrEqual(15);
  });

  it("keeps player mail to one letter while adding community voices", () => {
    const issue = generateNashvilleTimes({
      ...INITIAL_STATE,
      artistName: "The Test Artist",
      fame: 70,
      fans: 12000,
      rep: 60,
      totalReleases: 8,
      currentYear: 1997,
      week: 40,
    });
    const playerLetters = (issue.letters ?? []).filter(letter => letter.body.includes("The Test Artist"));
    expect(playerLetters.length).toBeLessThanOrEqual(1);
    expect((issue.letters ?? []).length).toBeGreaterThan(1);
  });
});
