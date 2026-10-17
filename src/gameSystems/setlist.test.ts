import { describe, expect, it } from "vitest";
import { CITIES, INITIAL_STATE, calculateSetlistSatisfaction, type GameState, type SetlistConfig } from "../gameLogic";
import { advanceWithSimulation } from "../useGameState";
import { getSavedSetlist, getSetlistIssue, getSetlistRewards, getSetlistSlots, getTourSetlistIssue, saveSetlist } from "./setlist";

function career(stops = 0): GameState {
  const state = structuredClone(INITIAL_STATE);
  state.tourQueue = CITIES.slice(0, stops).map(city => {
    const venue = city.venues[0];
    return {
      cityName: city.name, region: city.region, genreMod: city.genreMod, travelCost: city.travelCost,
      venueName: venue.name, venueCap: venue.cap, venueCost: venue.cost, venueTier: venue.tier,
    };
  });
  return state;
}

describe("setlist context", () => {
  it.each([[0, 6], [5, 6], [6, 22]])("requires %i stops to use %i songs", (stops, slots) => {
    expect(getSetlistSlots(career(stops))).toBe(slots);
  });

  it("prioritizes an active tour and keeps its set length when the queue clears", () => {
    const state = career(6);
    state.tourActive = { shows: [...state.tourQueue], progress: 0, ticketMult: 1, demandDecayIndex: 0 };
    state.tourQueue = [];
    expect(getSetlistSlots(state)).toBe(22);
    state.tourActive.shows = state.tourActive.shows.slice(0, 5);
    state.tourQueue = career(6).tourQueue;
    expect(getSetlistSlots(state)).toBe(6);
  });

  it("keeps saved counts when the required length changes and requires manual adjustment", () => {
    const state = career(6);
    expect(getSetlistSlots(state)).toBe(22);
    expect(state.setlistConfig).toEqual(INITIAL_STATE.setlistConfig);
    expect(getTourSetlistIssue(state)).toContain("22-song");
    saveSetlist(state, { deepCutCount: 5, hitCount: 12, newMaterialCount: 5, totalSlots: 22 });
    expect(getTourSetlistIssue(state)).toBeNull();
    state.tourQueue = state.tourQueue.slice(0, 5);
    expect(state.setlistConfig.totalSlots).toBe(22);
    expect(getTourSetlistIssue(state)).toContain("6-song");
  });

  it("supports old saves missing setlist data without modifying the save", () => {
    const state = career();
    delete (state as Partial<GameState>).setlistConfig;
    expect(getSavedSetlist(state)).toEqual(INITIAL_STATE.setlistConfig);
    expect(getTourSetlistIssue(state)).toBeNull();
    expect(state.setlistConfig).toBeUndefined();
  });
});

describe("saving a setlist", () => {
  it("commits a valid rearrangement and copies the submitted draft", () => {
    const state = career();
    const draft = { deepCutCount: 2, hitCount: 3, newMaterialCount: 1, totalSlots: 6 };
    saveSetlist(state, draft);
    expect(state.setlistConfig).toEqual(draft);
    expect(state.pendingEvent?.msg).toContain("Setlist saved:");
    draft.deepCutCount = 0;
    expect(state.setlistConfig.deepCutCount).toBe(2);
  });

  const invalid: SetlistConfig[] = [
    { deepCutCount: -1, hitCount: 6, newMaterialCount: 1, totalSlots: 6 },
    { deepCutCount: 1.5, hitCount: 3.5, newMaterialCount: 1, totalSlots: 6 },
    { deepCutCount: NaN, hitCount: 4, newMaterialCount: 1, totalSlots: 6 },
    { deepCutCount: Infinity, hitCount: 4, newMaterialCount: 1, totalSlots: 6 },
    { deepCutCount: 2, hitCount: 4, newMaterialCount: 1, totalSlots: 6 },
    { deepCutCount: 1, hitCount: 4, newMaterialCount: 1, totalSlots: 22 },
  ];
  it.each(invalid)("rejects invalid drafts without changing the saved setlist or finances: %j", config => {
    const state = career(1);
    const before = structuredClone(state);
    expect(getSetlistIssue(config, 6)).not.toBeNull();
    saveSetlist(state, config);
    expect(state.setlistConfig).toEqual(before.setlistConfig);
    expect(state.money).toBe(before.money);
    expect(state.tourQueue).toEqual(before.tourQueue);
    expect(state.tourActive).toBe(before.tourActive);
    expect(state.pendingEvent?.type).toBe("bad");
  });

  it("accepts a 22-song setlist before the long tour has launched", () => {
    const state = career(6);
    saveSetlist(state, { deepCutCount: 5, hitCount: 12, newMaterialCount: 5, totalSlots: 22 });
    expect(state.setlistConfig.totalSlots).toBe(22);
    expect(getTourSetlistIssue(state)).toBeNull();
  });
});

describe("setlist show rewards", () => {
  it.each([
    { config: { deepCutCount: 1, hitCount: 4, newMaterialCount: 1, totalSlots: 6 }, rewards: { rep: 3, fans: 8 } },
    { config: { deepCutCount: 0, hitCount: 0, newMaterialCount: 22, totalSlots: 22 }, rewards: { rep: -1, fans: -2 } },
  ])("reports the combined fan reward with its actual sign: $rewards", ({ config, rewards }) => {
    const satisfaction = calculateSetlistSatisfaction(config, [], config.totalSlots);
    expect(getSetlistRewards(satisfaction)).toEqual(rewards);
  });

  it("keeps an existing mismatched setlist playable on an ongoing tour", () => {
    const state = career(6);
    state.money = 100000;
    state.energy = 100;
    state.tourActive = { shows: [...state.tourQueue], progress: 0, ticketMult: 1, demandDecayIndex: 0 };
    state.tourQueue = [];
    expect(state.setlistConfig.totalSlots).toBe(6);
    const next = advanceWithSimulation(state);
    expect(next.week).toBe(state.week + 1);
    expect(next.setlistConfig).toEqual(state.setlistConfig);
  });
});
