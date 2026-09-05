import { describe, expect, it } from "vitest";
import { createTrackDevelopment, INITIAL_STATE, type GameState } from "../gameLogic";
import { campaignActionUnavailable, getListenerFavorites, queueAlbumCampaignAction, resolveAlbumCampaignWeek } from "./albumCampaign";

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
  it("keeps a twelve-week campaign alive until the last week and preserves old deadlines", () => {
    const s = campaignState();
    s.activeAlbumCampaign!.endWeek = 17;
    for (s.week = 9; s.week < 17; s.week++) {
      resolveAlbumCampaignWeek(s, () => 0.5, () => undefined);
      expect(s.activeAlbumCampaign).not.toBeNull();
    }
    resolveAlbumCampaignWeek(s, () => 0.5, () => undefined);
    expect(s.activeAlbumCampaign).toBeNull();
    const old = campaignState();
    old.week = 9;
    resolveAlbumCampaignWeek(old, () => 0.5, () => undefined);
    expect(old.activeAlbumCampaign).toBeNull();
  });

  it("gates acoustic revival and converts existing listeners without creating extra fans", () => {
    const s = campaignState();
    s.activeAlbumCampaign!.endWeek = 17;
    expect(queueAlbumCampaignAction(s, "acoustic_session")).toBe("rejected");
    s.week = 10; s.energy = 100; s.fans = 1000; s.superfans = 50;
    expect(queueAlbumCampaignAction(s, "acoustic_session")).toBe("queued");
    resolveAlbumCampaignWeek(s, () => 0.5, () => undefined);
    expect(s.money).toBe(1600);
    expect(s.energy).toBe(90);
    expect(s.fans).toBe(1000);
    expect(s.superfans).toBeGreaterThan(50);
    expect(s.catalog[0].streamFloor).toBeGreaterThan(0);
    expect(queueAlbumCampaignAction(s, "acoustic_session")).toBe("rejected");
  });

  it("allows repeat promotion only after its cooldown, and rejects unaffordable choices", () => {
    const s = campaignState();
    s.activeAlbumCampaign!.endWeek = 17;
    s.activeAlbumCampaign!.followUpTrackIndex = 1;
    queueAlbumCampaignAction(s, "radio_push");
    resolveAlbumCampaignWeek(s, () => 0.5, () => undefined);
    expect(campaignActionUnavailable(s, "radio_push")).toContain("three weeks");
    s.week += 3;
    expect(campaignActionUnavailable(s, "radio_push")).toBeNull();
    s.money = 0;
    expect(queueAlbumCampaignAction(s, "radio_push")).toBe("rejected");
  });

  it("derives listener favorites from song strengths without consuming randomness", () => {
    const s = campaignState();
    s.fans = 1000; s.superfans = 0;
    expect(getListenerFavorites(s)[0].name).toBe("Follow-up");
    s.week = 4;
    expect(getListenerFavorites(s)).toEqual([]);
  });
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
