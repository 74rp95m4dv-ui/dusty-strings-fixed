import {
  clamp,
  fmt,
  getTrackDevelopment,
  type AlbumCampaignAction,
  type CareerIdentity,
  type GameState,
} from "../gameLogic";

type AwardIdentity = (state: GameState, identity: CareerIdentity, amount: number) => void;

export type AlbumCampaignResult = "queued" | "rejected";

/** Validates and queues a campaign move. Resolution happens during the weekly tick. */
export function queueAlbumCampaignAction(
  state: GameState,
  action: AlbumCampaignAction,
  trackIndex?: number,
): AlbumCampaignResult {
  const campaign = state.activeAlbumCampaign;
  if (!campaign || campaign.pendingAction) {
    state.pendingEvent = { msg: "That campaign week already has a move planned.", type: "bad" };
    return "rejected";
  }
  const release = state.catalog.find(item => item.id === campaign.releaseId);
  if (!release || campaign.actionsUsed.includes(action)) {
    state.pendingEvent = { msg: "That campaign move has already been used.", type: "bad" };
    return "rejected";
  }
  if (action === "follow_up_single") {
    if (trackIndex === undefined || trackIndex === release.leadTrackIndex || !release.tracks[trackIndex]) {
      state.pendingEvent = { msg: "Choose a non-lead album track as the follow-up single.", type: "bad" };
      return "rejected";
    }
    campaign.followUpTrackIndex = trackIndex;
  }
  if ((action === "radio_push" || action === "music_video") && campaign.followUpTrackIndex === null) {
    state.pendingEvent = { msg: "Choose a follow-up single before promoting it.", type: "bad" };
    return "rejected";
  }
  campaign.pendingAction = action;
  campaign.actionTakenWeek = state.week;
  state.pendingEvent = {
    msg: `${action === "hold_steady" ? "Holding steady" : "Campaign move locked in"}. It resolves when you end the week.`,
    type: "good",
  };
  return "queued";
}

/** Applies one queued campaign action. Randomness is injected for deterministic tests. */
export function resolveAlbumCampaignWeek(
  state: GameState,
  random: () => number,
  awardIdentity: AwardIdentity,
): void {
  const campaign = state.activeAlbumCampaign;
  if (!campaign) return;
  const release = state.catalog.find(item => item.id === campaign.releaseId);
  if (!release) {
    state.activeAlbumCampaign = null;
    return;
  }
  const action = campaign.pendingAction ?? "hold_steady";
  let outcome = "Held steady and let the record breathe.";
  const followUp = campaign.followUpTrackIndex === null ? null : release.tracks[campaign.followUpTrackIndex];

  if (action === "follow_up_single" && followUp) {
    const appeal = getTrackDevelopment(followUp).appealRating ?? release.appeal ?? 5;
    const boost = 1.12 + appeal * 0.055;
    release.weeklyStreams = Math.max(release.weeklyStreams, Math.floor(release.weeklyStreams * boost + appeal * 90));
    const fans = Math.floor(180 + appeal * 95);
    state.fans += fans;
    awardIdentity(state, "radio_favorite", appeal >= 7 ? 2 : 1);
    outcome = `"${followUp.name}" became the follow-up single (+${fmt(fans)} fans).`;
  } else if (action === "radio_push") {
    const cost = 1000;
    if (followUp && state.money >= cost) {
      state.money -= cost;
      const appeal = getTrackDevelopment(followUp).appealRating ?? release.appeal ?? 5;
      const chance = clamp(0.28 + appeal * 0.045 + (state.currentCareerIdentity === "radio_favorite" ? 0.14 : 0) + (state.campaignRadioBoostWeeks > 0 ? state.campaignRadioBoost : 0), 0.15, 0.88);
      if (random() < chance) {
        release.weeklyStreams = Math.floor(release.weeklyStreams * 1.6 + 500);
        state.fame = clamp(state.fame + 4, 0, 100);
        state.hype = clamp(state.hype + 10, 0, 100);
        outcome = `Radio broke for "${followUp.name}" — streams and fame climbed.`;
        awardIdentity(state, "radio_favorite", 3);
      } else {
        release.weeklyStreams = Math.floor(release.weeklyStreams * 1.13);
        outcome = `Radio push for "${followUp.name}" found some spins, but no breakthrough.`;
        awardIdentity(state, "radio_favorite", 1);
      }
    } else outcome = "Radio push could not be funded; the team held steady.";
  } else if (action === "music_video") {
    const cost = 1200;
    if (followUp && !release.hasMusicVideo && state.money >= cost) {
      state.money -= cost;
      release.hasMusicVideo = true;
      release.weeklyStreams = Math.floor(release.weeklyStreams * 1.35 + 250);
      state.fame = clamp(state.fame + 3, 0, 100);
      state.rep = clamp(state.rep + 2, 0, 100);
      state.hype = clamp(state.hype + 22, 0, 100);
      state.fans += 900;
      awardIdentity(state, "radio_favorite", 2);
      outcome = `Music video for "${followUp.name}" landed (+900 fans).`;
    } else outcome = "Video could not be completed; the team held steady.";
  } else if (action === "live_appearance") {
    if (state.energy >= 15) {
      state.energy -= 15;
      const fans = state.currentCareerIdentity === "crossover_act" ? 850 : 700;
      state.fans += fans;
      state.hype = clamp(state.hype + 14, 0, 100);
      state.campaignLiveBoost = Math.max(state.campaignLiveBoost, 0.10);
      state.campaignLiveBoostWeeks = Math.max(state.campaignLiveBoostWeeks, 4);
      awardIdentity(state, "road_warrior", 2);
      outcome = `Live appearance brought ${fmt(fans)} new fans and lifted tour demand.`;
    } else outcome = "Too drained for a live appearance; the team held steady.";
  } else if (action === "hold_steady") {
    state.burnout = Math.max(0, (state.burnout ?? 0) - 3);
  }

  if (action !== "hold_steady" && !campaign.actionsUsed.includes(action)) campaign.actionsUsed.push(action);
  campaign.actionHistory.push({ week: state.week, action, outcome });
  campaign.pendingAction = null;
  campaign.actionTakenWeek = null;
  release.albumCampaign = { startedWeek: campaign.startWeek, followUpTrackIndex: campaign.followUpTrackIndex, actions: [...campaign.actionHistory] };
  state.log.unshift({ week: state.week, msg: `Album campaign: ${outcome}`, type: action === "hold_steady" ? "neutral" : "great" });
  if (state.week >= campaign.endWeek) {
    release.albumCampaign.endedWeek = state.week;
    state.log.unshift({ week: state.week, msg: `Album campaign complete: "${campaign.releaseTitle}" finished its four-week run with ${campaign.actionHistory.length} weekly moves.`, type: "great" });
    state.activeAlbumCampaign = null;
  }
}
