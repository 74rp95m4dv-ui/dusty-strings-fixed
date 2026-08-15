import { describe, expect, it } from "vitest";
import { createTrackDevelopment, INITIAL_STATE, type GameState } from "../gameLogic";
import { queueAlbumCampaignAction, resolveAlbumCampaignWeek } from "./albumCampaign";

function campaignState(): GameState {
  const state = structuredClone(INITIAL_STATE) as GameState;
  state.week = 8;
  state.money = 2_000;
  state.catalog = [{
    id: "release-1", title: "Test Album", type: "Album", genre: "Country", quality: 75, appeal: 7,
    outcome: "Moderate", lifecycle: "Normal", decayRate: 0.9, streamFloor: 0,
    weeklyStreams: 1_000, peakStreams: 1_000, totalStreams: 1_000, releasedWeek: 4, weeksActive: 4,
    promoted: false, comebackCooldown: 0, hasMusicVideo: false, leadTrackIndex: 0,
    tracks: [
      { id: "lead", name: "Lead", development: createTrackDevelopment() },
      { id: "follow-up", name: "Follow-up", development: { ...createTrackDevelopment(), appealRating: 8 } },
    ],
  }] as any;
  state.activeAlbumCampaign = {
    releaseId: "release-1", releaseTitle: "Test Album", startWeek: 5, endWeek: 9,
    followUpTrackIndex: null, actionsUsed: [], actionHistory: [], pendingAction: null, actionTakenWeek: null,
  };
  return state;
}

describe("album campaign system", () => {
  it("rejects a follow-up choice that duplicates the lead track", () => {
    const state = campaignState();
    expect(queueAlbumCampaignAction(state, "follow_up_single", 0)).toBe("rejected");
    expect(state.activeAlbumCampaign?.pendingAction).toBeNull();
  });

  it("resolves a radio push deterministically and records the outcome", () => {
    const state = campaignState();
    queueAlbumCampaignAction(state, "follow_up_single", 1);
    resolveAlbumCampaignWeek(state, () => 0.99, () => undefined);
    queueAlbumCampaignAction(state, "radio_push");
    resolveAlbumCampaignWeek(state, () => 0.99, () => undefined);

    expect(state.money).toBe(1_000);
    expect(state.catalog[0].weeklyStreams).toBe(2_576);
    expect(state.activeAlbumCampaign?.actionHistory).toHaveLength(2);
    expect(state.log[0].msg).toContain("no breakthrough");
  });
});
