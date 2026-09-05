import { describe, expect, it } from "vitest";
import { CITIES, INITIAL_STATE, createTrackDevelopment, type GameState, type RecordingProject } from "../gameLogic";
import { normalizeGameState } from "../stateIntegrity";
import { getTrackRatingBounds } from "../recordingForecast";
import { canChangeProjectDirection, getLiveCatalogMultiplier, getRegionalDemand, getSongStrengths } from "./careerDepth";
import { advanceWithSimulation } from "../useGameState";
import { createSimulation } from "../simulation";

function state(): GameState { return structuredClone(INITIAL_STATE); }
function project(): RecordingProject {
  return { type: "Single", title: "New sound", genre: "Country", producerId: "self", studioId: "home_studio", tracks: [{ name: "First", development: createTrackDevelopment() }], weeksLeft: 3, totalWeeks: 3, minTracks: 1, maxTracks: 1, marketingBudget: 0 };
}

describe("regional audiences", () => {
  it("grows only the visited region, caps growth, and recovers city demand after eight weeks", () => {
    const s = state();
    s.city = "Nashville, TN";
    const home = CITIES.find(city => city.name === s.city)!;
    const away = CITIES.find(city => city.region !== home.region)!;
    const baseline = getRegionalDemand(s, home.name).multiplier;
    s.regional[home.region] = 100;
    expect(getRegionalDemand(s, home.name).multiplier).toBeCloseTo(baseline + 0.3);
    expect(getRegionalDemand(s, away.name).multiplier).toBe(1);
    s.cityLastPlayed = { [home.name]: 10 };
    expect(getRegionalDemand(s, home.name, 11).returnPenalty).toBeGreaterThan(0);
    expect(getRegionalDemand(s, home.name, 18).returnPenalty).toBe(0);
  });

  it("loads old saves without inventing show history", () => {
    const s = state();
    delete s.cityLastPlayed;
    const restored = normalizeGameState(JSON.parse(JSON.stringify(s)));
    expect(restored.cityLastPlayed).toEqual({});
    expect(restored.regional).toEqual(s.regional);
    expect(getLiveCatalogMultiplier(restored)).toBe(1);
  });

  it("records a completed show and never sells more seats than the venue holds", () => {
    const s = state();
    const city = CITIES[0];
    const venue = city.venues[0];
    s.simulation = createSimulation(123);
    s.fans = 100000; s.energy = 100; s.money = 100000;
    s.tourActive = { shows: [{ cityName: city.name, region: city.region, genreMod: city.genreMod, travelCost: city.travelCost, venueName: venue.name, venueTier: venue.tier, venueCap: venue.cap, venueCost: venue.cost }], progress: 0, ticketMult: 1, demandDecayIndex: 0 };
    const next = advanceWithSimulation(s);
    expect(next.cityLastPlayed?.[city.name]).toBe(next.week);
    expect(next.regional[city.region]).toBe(1);
    expect(next.tourWrapPresentation?.bestShow?.attendancePct).toBeLessThanOrEqual(100);
  });
});

describe("creative direction", () => {
  it("trades radio appeal for intimate craft and preserves neutral defaults", () => {
    const s = state(), p = project(), track = p.tracks[0];
    const original = getTrackRatingBounds(s, p, track);
    p.creativeDirection = "balanced";
    expect(getTrackRatingBounds(s, p, track)).toEqual(original);
    p.creativeDirection = "intimate";
    const intimate = getTrackRatingBounds(s, p, track);
    expect(intimate.quality.expected).toBeGreaterThan(original.quality.expected);
    expect(intimate.appeal.expected).toBeLessThan(original.appeal.expected);
    expect(getSongStrengths(track, p).lyrics).toBeGreaterThan(getSongStrengths(track, { ...p, creativeDirection: "polished" }).lyrics);
  });

  it("locks direction after writing and saves the resulting live strengths", () => {
    const p = project();
    p.creativeDirection = "crowd_pleasing";
    expect(canChangeProjectDirection(p)).toBe(true);
    p.tracks[0].development!.writing.completed = true;
    expect(canChangeProjectDirection(p)).toBe(false);
    const strengths = getSongStrengths(p.tracks[0], p);
    p.tracks[0].development!.strengths = strengths;
    expect(getSongStrengths(JSON.parse(JSON.stringify(p.tracks[0])))).toEqual(strengths);
    expect(strengths.live).toBeGreaterThan(5);
  });
});
