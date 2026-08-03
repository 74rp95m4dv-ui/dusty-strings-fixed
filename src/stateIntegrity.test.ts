import { describe, expect, it } from "vitest";
import { INITIAL_STATE, type GameState } from "./gameLogic";
import { createGameEntityId, normalizeGameState } from "./stateIntegrity";

function makeState(): GameState {
  return JSON.parse(JSON.stringify(INITIAL_STATE)) as GameState;
}

describe("normalizeGameState", () => {
  it("repairs corrupted numeric values and tour routes without changing valid money", () => {
    const state = makeState();
    state.money = -275;
    state.week = -4;
    state.energy = 140;
    state.fans = -1;
    state.superfans = 50;
    state.tourTicketMult = 99;
    state.tourQueue = [
      { cityName: "Nashville, TN", venueName: "A", venueCap: 1, venueCost: 1, venueTier: 1, travelCost: 1, region: "South", genreMod: {} },
      { cityName: "Nashville, TN", venueName: "B", venueCap: 1, venueCost: 1, venueTier: 1, travelCost: 1, region: "South", genreMod: {} },
      { cityName: "Not a city", venueName: "C", venueCap: 1, venueCost: 1, venueTier: 1, travelCost: 1, region: "South", genreMod: {} },
    ];
    state.festivalBookings = [
      { festivalId: "fest", festivalName: "Festival", stage: "main", pay: 1, fanExposure: 1, bookedWeek: 1, performanceWeek: 2, completed: false },
      { festivalId: "fest", festivalName: "Festival", stage: "main", pay: 1, fanExposure: 1, bookedWeek: 1, performanceWeek: 2, completed: false },
    ];

    normalizeGameState(state);

    expect(state.money).toBe(-275);
    expect(state.week).toBe(1);
    expect(state.energy).toBe(100);
    expect(state.fans).toBe(0);
    expect(state.superfans).toBe(0);
    expect(state.tourTicketMult).toBe(2.5);
    expect(state.tourQueue).toHaveLength(1);
    expect(state.festivalBookings).toHaveLength(1);
  });

  it("creates deterministic entity IDs from the active simulation", () => {
    const a = makeState();
    const b = makeState();
    a.simulation = b.simulation = { seed: 7, cursor: 3 };
    const originalRandom = Math.random;
    Math.random = () => 0.125;
    try {
      expect(createGameEntityId(a, "release")).toBe(createGameEntityId(b, "release"));
    } finally {
      Math.random = originalRandom;
    }
  });
});
