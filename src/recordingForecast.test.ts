import { describe, expect, it } from "vitest";
import { createTrackDevelopment, INITIAL_STATE, type GameState } from "./gameLogic";
import { getRecordingSessionForecast, getTrackRatingBounds } from "./recordingForecast";

function recordingState(): GameState {
  const state = structuredClone(INITIAL_STATE) as GameState;
  state.energy = 100;
  state.project = {
    type: "Single", title: "Forecast Test", genre: "Country", producerId: "self", studioId: "garage",
    tracks: [{ name: "First Take", development: { ...createTrackDevelopment(), writing: { direction: "artistic", investment: "focused" } } }],
    weeksLeft: 3, totalWeeks: 3, minTracks: 1, maxTracks: 1, marketingBudget: 0, mode: "standard", pipelineStage: "writing", labelFunding: false,
  };
  return state;
}

describe("recording session forecast", () => {
  it("includes the next pass's rent, focused cost, and normal condition changes", () => {
    const forecast = getRecordingSessionForecast(recordingState());
    expect(forecast).toMatchObject({ status: "recording", studioCost: 75, focusedCost: 50, cashCost: 125, energyChange: -8, burnoutChange: 2 });
  });

  it("charges rent but not the creative pass when too exhausted to record", () => {
    const state = recordingState();
    state.energy = 0;
    const forecast = getRecordingSessionForecast(state);
    expect(forecast).toMatchObject({ status: "stalled", studioCost: 75, focusedCost: 0, cashCost: 75, energyChange: 0, burnoutChange: 0 });
  });

  it("uses the label fund before cash and keeps artistic uncertainty as a range", () => {
    const state = recordingState();
    state.project!.labelFunding = true;
    state.currentLabel = { recordingFund: 100, recordingFundUsed: 10, fundingFrozen: false } as any;
    const forecast = getRecordingSessionForecast(state);
    const rating = getTrackRatingBounds(state, state.project!, state.project!.tracks[0]);
    expect(forecast).toMatchObject({ labelFundCost: 90, cashCost: 35 });
    expect(rating.hasUnresolvedRisk).toBe(true);
    expect(rating.quality.min).toBeLessThan(rating.quality.max);
  });
});
