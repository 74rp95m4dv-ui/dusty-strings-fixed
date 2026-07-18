import { useState, useCallback } from "react";
import {
  GameState, Genre, ReleaseType, SongLifecycle,
  INITIAL_STATE, ARCHETYPES, CITIES, PRODUCERS, FEATURES, getFeature, getFeatureEffectiveCost, generateFeatureRequest,
  GRIND_ACTIONS, BRAND_DEALS, AWARDS, CRITIC_REVIEWS, RANDOM_SCENARIOS,
  ScenarioEffect, CatalogEntry, TourStop,
  RIVALS, RivalState, STORY_ARCS, getStoryArc, ArcInstance, StoryArc,
  Award, TourWrapPresentation, SigningPresentation, AwardPresentation, CareerMilestonePresentation,
  CAREER_TIERS, getCareerTierIdx,
  burnoutQualityPenalty, burnoutShowMult, burnoutCancelChance, getBurnoutTier, pickRivalTitle,
  MerchType, MerchItem, MERCH_TEMPLATES, generateMerchReview,
  getPressingVariants, isPhysicalFormat, MERCH_EDITIONS, priceDemandMultiplier,
  STUDIOS, getStudio,
  THEMES, getSignatureTheme, pickTrendTheme,
  TREND_THEME_SCORE_MULT, TREND_THEME_FAN_MULT,
  PRODUCER_THEMES, PRODUCER_SPECIALTY_QUALITY_BONUS,
  getProducerRelationship, getProducerEffectiveCost,
  computeAlbumWritingMix,
  createTrackDevelopment, getTrackDevelopment, getProjectPipelineStage,
  countFocusedStages, getFocusedSessionCost, SONG_STAGES,
  getHook, getLyric,
  LABELS, MANAGERS, getLabel, getManager,
  generateLabelOffers, generateManagerOffers,
  getLabelDeliverySummary, getLabelRecoupableBalance, getLabelRecoupmentRemaining,
  rnd, roll, clamp, fmt, fmtMoney,
  genAlbumName, genFanReviews, genThemedTrackName,
  // Recording time system (v2.0)
  RecordingMode, calculateRecordingWeeks, getStandardRecordingWeeks,
  STUDIO_TIME_MODIFIERS, PRODUCER_TIME_MODIFIERS, RECORDING_MODE_CONFIG,
  BASE_WEEKS_BY_FORMAT,
  // Streaming platform system (v2.0)
  STREAMING_PLATFORMS, BASE_STREAMING_RATE, GEO_RATE_MODIFIERS, PREMIUM_SPLIT, PREMIUM_MULTIPLIER,
  SPOTIFY_MIN_STREAMS, DEFAULT_GEO_DIST,
  // Touring Features v2.0
  calculateSetlistSatisfaction,
  getVenueReputation,
  getVenuePerkForVenue,
  getVenuePerkDisplay,
  generateOpeningActOffer,
  generateFestivalOffers,
  rollBusBreakdown,
  type SetlistConfig,
  type SetlistSatisfaction,
  type VenueReputation,
  type OpeningActOffer,
  type FestivalBooking,
  type BusBreakdownEvent,
  type SongStage,
  type SongDevelopmentStage,
  type SongDirection,
  type SessionInvestment,
  type TrackEntry,
  type CampaignAllocation,
  type LabelSubmission,
  MARKET_ERAS, getMarketEra, getReleaseFormat,
  type ReleaseFormat,
  BUS_BREAKDOWN_EVENTS,
  VENUE_PERKS,
  FESTIVALS,
  OPENING_ACT_HEADLINERS,
  // Publishing & Sync
  generatePublishingOffers, generateSyncOffers, runPublishingAccounting,
  type PublishingOffer, type SyncOffer,
  // Brand deals v2
  BRAND_DEALS_V2, getBrandDealSellout,
} from "./gameLogic";
import { generateNashvilleTimes } from "./nashvilleTimes";

const SAVE_KEY = "dusty_strings_v1";

function archHas(arch: string, bonus: string) { return ARCHETYPES[arch]?.bonus === bonus; }
function archVal(arch: string): number { const v = ARCHETYPES[arch]?.bonusVal; return typeof v === "number" ? v : 1; }
function tourCostMult(arch: string) { return archHas(arch,"tourCostDiscount") ? archVal(arch) : 1; }
function showRevBonus(arch: string, managerPct: number) { return (archHas(arch,"midwestShowBonus") ? 1 : 1) * (1 + managerPct); }
function evergreenMult(arch: string) { return archHas(arch,"evergreenBoost") ? archVal(arch) : 1; }
function featCostMult(arch: string) { return archHas(arch,"featureCostDisc") ? archVal(arch) : 1; }
function applyArchQuality(arch: string, q: number) {
  if (archHas(arch,"selfProdQuality")) q += archVal(arch);
  if (archHas(arch,"trackQualBonus"))  q += archVal(arch);
  if (archHas(arch,"acousticQBonus"))  q += archVal(arch);
  return q;
}

/** Charge an eligible recording cost from the opted-in label fund before cash. */
function payRecordingCost(state: GameState, project: NonNullable<GameState["project"]>, amount: number) {
  const label = state.currentLabel;
  const canUseFund = !!(project.labelFunding && label && !label.fundingFrozen);
  const fundAvailable = canUseFund ? Math.max(0, label!.recordingFund - label!.recordingFundUsed) : 0;
  const fromFund = Math.min(fundAvailable, Math.max(0, amount));
  const fromCash = Math.max(0, amount - fromFund);
  if (fromFund && label) label.recordingFundUsed += fromFund;
  state.money -= fromCash;
  return { fromFund, fromCash };
}

function getRecordingFundAvailable(state: GameState, project: NonNullable<GameState["project"]>) {
  if (!project.labelFunding || !state.currentLabel || state.currentLabel.fundingFrozen) return 0;
  return Math.max(0, state.currentLabel.recordingFund - state.currentLabel.recordingFundUsed);
}

function updateLabelDeliveryStatus(state: GameState) {
  const label = state.currentLabel;
  if (!label) return;
  const delivery = getLabelDeliverySummary(label, state.week);
  label.deliveryDeadlineWeek = delivery.deadlineWeek;
  label.deliveryStatus = delivery.status;

  if (delivery.albumsRemaining === 0) return;
  if ([12, 6, 2].includes(delivery.weeksRemaining)) {
    state.log.unshift({
      week: state.week,
      msg: `${label.name}: ${delivery.albumsRemaining} album${delivery.albumsRemaining === 1 ? "" : "s"} due in ${delivery.weeksRemaining} weeks.`,
      type: delivery.weeksRemaining <= 2 ? "bad" : "neutral",
    });
  }
  if (delivery.status !== "breach" || label.lastDeliveryPenaltyWeek === state.week) return;

  const extensionWeeks = label.suspensionRights ? 8 : 12;
  label.deliveryExtensions = (label.deliveryExtensions ?? 0) + 1;
  label.lastDeliveryPenaltyWeek = state.week;
  label.deliveryDeadlineWeek = state.week + extensionWeeks;
  label.deliveryStatus = "breach";
  label.fundingFrozen = true;
  state.rep = clamp(state.rep - (label.suspensionRights ? 5 : 3), 0, 100);
  state.log.unshift({
    week: state.week,
    msg: label.suspensionRights
      ? `${label.name} placed you on delivery notice. No new label-funded sessions until you deliver an album. ${extensionWeeks} weeks to cure the breach.`
      : `${label.name} extended your album deadline by ${extensionWeeks} weeks. Your standing with the label took a hit.`,
    type: "bad",
  });
}

const EMPTY_CAMPAIGN: CampaignAllocation = { streaming: 25, radio: 25, press: 25, live: 25 };

function isValidCampaign(allocation: CampaignAllocation) {
  const values = Object.values(allocation);
  return values.every(value => Number.isFinite(value) && value >= 0 && value <= 100) &&
    values.reduce((sum, value) => sum + value, 0) === 100;
}

function labelRequiresReleaseApproval(label: NonNullable<GameState["currentLabel"]>) {
  return label.approvalRights.includes("singles") || label.approvalRights.includes("release date");
}

function processLabelSubmissionReview(state: GameState) {
  const submission = state.pendingLabelSubmission;
  const label = state.currentLabel;
  if (!submission || !label || submission.status !== "under_review" || state.week < submission.reviewWeek) return;
  const project = state.unreleased.find(item => item.id === submission.projectId);
  const lead = project?.tracks[submission.leadTrackIndex];
  if (!project || !lead) {
    state.pendingLabelSubmission = null;
    return;
  }
  const leadAppeal = getTrackDevelopment(lead).appealRating ?? project.avgAppeal ?? 5;
  const averageAppeal = project.avgAppeal ?? 5;
  const commercialShare = (submission.allocation.streaming + submission.allocation.radio) / 100;
  const approvalScore = leadAppeal * 0.6 + averageAppeal * 0.25 + commercialShare * 2.5 + (project.avgQuality / 10) * 0.15;
  const threshold = label.creativeControl < 40 ? 7.1 : label.creativeControl < 70 ? 6.4 : 5.8;
  if (approvalScore >= threshold) {
    submission.status = "approved";
    submission.reviewNote = `${label.exec} approved the release and released the full campaign allocation.`;
    state.log.unshift({ week: state.week, msg: `${label.name} approved "${project.title}" for release.`, type: "great" });
    return;
  }
  if (!submission.revisionUsed) {
    submission.status = "revision_requested";
    submission.reviewNote = `${label.exec} wants a stronger lead or a more commercial campaign mix before approving the release.`;
    state.log.unshift({ week: state.week, msg: `${label.name} sent notes on "${project.title}". One revision window is open.`, type: "neutral" });
    return;
  }
  submission.status = "held";
  submission.reviewNote = `${label.exec} is holding the release. You can revise later or override the label and launch with reduced support.`;
  state.log.unshift({ week: state.week, msg: `${label.name} held "${project.title}" after final review.`, type: "bad" });
}

function migrateMarketState(saved: Partial<GameState>) {
  const currentYear = saved.currentYear ?? 2018;
  const era = getMarketEra(currentYear);
  return {
    currentYear,
    marketEraId: saved.marketEraId ?? era.id,
    catalog: (saved.catalog ?? []).map(item => ({
      ...item,
      format: item.format ?? "streaming" as ReleaseFormat,
      releasedEraId: item.releasedEraId ?? "platform_era",
      reissuedEraIds: item.reissuedEraIds ?? [],
      weeklyRevenueBreakdown: item.weeklyRevenueBreakdown ?? { physical:0, download:0, streaming:item.weeklyRevenue ?? 0 },
      lifetimeRevenueBreakdown: item.lifetimeRevenueBreakdown ?? { physical:0, download:0, streaming:item.lifetimeRevenue ?? 0 },
    })),
    discography: (saved.discography ?? []).map(item => ({ ...item, format:item.format ?? "streaming" as ReleaseFormat, releasedEraId:item.releasedEraId ?? "platform_era" })),
  };
}

const SONG_STAGE_NEXT: Record<SongStage, SongStage> = { writing: "recording", recording: "mixing", mixing: "complete", complete: "complete" };
const SONG_DIRECTION_EFFECTS: Record<SongDirection, { quality: number; appeal: number; risky: boolean }> = {
  commercial: { quality: -0.15, appeal: 0.75, risky: false },
  balanced:   { quality: 0.20, appeal: 0.20, risky: false },
  artistic:   { quality: 0.55, appeal: -0.25, risky: true },
};

function recalculateProjectWeeks(project: NonNullable<GameState["project"]>) {
  const elapsed = project.totalWeeks - project.weeksLeft;
  const total = calculateRecordingWeeks(
    project.type,
    Math.max(project.minTracks, project.tracks.length),
    project.studioId,
    project.producerId,
    project.mode ?? "standard",
    countFocusedStages(project.tracks),
  );
  project.totalWeeks = total;
  project.weeksLeft = Math.max(0, total - elapsed);
}

function resolveTrackRating(state: GameState, project: NonNullable<GameState["project"]>, track: TrackEntry) {
  const development = getTrackDevelopment(track);
  const producer = PRODUCERS.find(item => item.id === project.producerId);
  const studio = getStudio(project.studioId);
  const relationship = producer ? getProducerRelationship(producer.id, state.producerWorkCounts) : null;
  const themeFit = producer && project.themeId && (PRODUCER_THEMES[producer.id] ?? []).includes(project.themeId) ? 0.35 : 0;
  const stages = SONG_STAGES.map(stage => development[stage]);
  const directionQuality = stages.reduce((sum, stage) => sum + SONG_DIRECTION_EFFECTS[stage.direction].quality + (stage.riskQuality ?? 0), 0);
  const directionAppeal = stages.reduce((sum, stage) => sum + SONG_DIRECTION_EFFECTS[stage.direction].appeal + (stage.riskAppeal ?? 0), 0);
  const focused = stages.filter(stage => stage.investment === "focused").length;
  const archetypeBonus = (applyArchQuality(state.archetype, state.qualityBase) - state.qualityBase) / 10;
  const burnoutPenalty = burnoutQualityPenalty(state.burnout ?? 0) / 10;
  const pushPenalty = -0.2 * (project.pushThroughCount ?? 0);
  const modeBonus = RECORDING_MODE_CONFIG[project.mode ?? "standard"].qualityMod / 10;
  const coWriterBonus = track.cowriterId ? 0.30 : 0;
  const featureAppeal = track.featId ? 0.45 : 0;
  const quality = clamp(
    1.55 + state.qualityBase * 0.06 + (producer?.qB ?? 0) * 0.045 + (studio?.qB ?? 0) * 0.035 +
    (relationship?.qBonus ?? 0) * 0.04 + themeFit + directionQuality + focused * 0.22 + coWriterBonus + archetypeBonus + burnoutPenalty + pushPenalty + modeBonus,
    1, 10,
  );
  const appeal = clamp(
    3.5 + (producer?.tier ?? 0) * 0.13 + (studio?.tier ?? 0) * 0.09 + directionAppeal + focused * 0.10 + featureAppeal + (track.cowriterId ? 0.12 : 0),
    1, 10,
  );
  return {
    quality: Number(quality.toFixed(1)),
    appeal: Number(appeal.toFixed(1)),
    qualityBreakdown: {
      craft: Number((1.55 + state.qualityBase * 0.06).toFixed(2)), team: Number(((producer?.qB ?? 0) * 0.045 + (studio?.qB ?? 0) * 0.035 + (relationship?.qBonus ?? 0) * 0.04 + themeFit).toFixed(2)),
      choices: Number((directionQuality + focused * 0.22 + coWriterBonus).toFixed(2)), condition: Number((archetypeBonus + burnoutPenalty + pushPenalty + modeBonus).toFixed(2)),
    },
    appealBreakdown: {
      direction: Number(directionAppeal.toFixed(2)), team: Number(((producer?.tier ?? 0) * 0.13 + (studio?.tier ?? 0) * 0.09).toFixed(2)),
      collaboration: Number((featureAppeal + (track.cowriterId ? 0.12 : 0)).toFixed(2)), focused: Number((focused * 0.10).toFixed(2)),
    },
  };
}

/** Resolves one project-wide creative pass. Returns false when a paid pass cannot run. */
function resolveProjectSongSession(state: GameState, project: NonNullable<GameState["project"]>): boolean {
  const stage = getProjectPipelineStage(project);
  project.pipelineStage = stage;
  if (stage === "complete") return true;
  if (project.tracks.length < project.minTracks) {
    state.pendingEvent = { msg: `Add at least ${project.minTracks} track${project.minTracks === 1 ? "" : "s"} before the ${stage} pass.`, type: "bad" };
    return false;
  }
  const studio = getStudio(project.studioId);
  const focusedTracks = project.tracks.filter(track => getTrackDevelopment(track)[stage].investment === "focused");
  const focusedCost = focusedTracks.length * getFocusedSessionCost(studio?.tier ?? 0);
  let featureCost = 0;
  if (stage === "recording") {
    for (const track of project.tracks) {
      if (!track.featId) continue;
      const feature = FEATURES.find(item => item.id === track.featId);
      if (feature) featureCost += getFeatureEffectiveCost(feature, state.featureWorkCounts, featCostMult(state.archetype));
    }
  }
  const totalSessionCost = focusedCost + featureCost;
  const fundAvailable = getRecordingFundAvailable(state, project);
  const cashRequired = Math.max(0, totalSessionCost - fundAvailable);
  if (state.money < cashRequired) {
    state.pendingEvent = { msg: `Need ${fmtMoney(cashRequired)} more to run this ${stage} pass after label funding.`, type: "bad" };
    return false;
  }
  const payment = payRecordingCost(state, project, totalSessionCost);
  if (payment.fromFund > 0) {
    state.log.unshift({ week: state.week, msg: `${fmtMoney(payment.fromFund)} of this ${stage} pass came from the label recording fund.`, type: "neutral" });
  }
  if (stage === "recording") {
    for (const track of project.tracks) {
      if (!track.featId) continue;
      state.featureWorkCounts ??= {};
      state.featureWorkCounts[track.featId] = (state.featureWorkCounts[track.featId] ?? 0) + 1;
    }
  }
  for (const track of project.tracks) {
    const development = getTrackDevelopment(track);
    const pass = development[stage];
    if (SONG_DIRECTION_EFFECTS[pass.direction].risky && pass.riskQuality === undefined) {
      const riskScale = pass.investment === "focused" ? 0.65 : 1;
      pass.riskQuality = Number((((Math.random() * 2 - 1) * 1.5) * riskScale).toFixed(2));
      pass.riskAppeal = Number((((Math.random() * 2 - 1) * 0.65) * riskScale).toFixed(2));
    }
    pass.completed = true;
    development.stage = SONG_STAGE_NEXT[stage];
    track.development = development;
  }
  project.pipelineStage = SONG_STAGE_NEXT[stage];
  const moneyNote = focusedCost > 0 ? ` · ${fmtMoney(focusedCost)} focused work` : "";
  state.log.unshift({ week: state.week, msg: `${stage[0].toUpperCase() + stage.slice(1)} pass completed for ${project.tracks.length} track${project.tracks.length === 1 ? "" : "s"}${moneyNote}.`, type: "good" });
  return true;
}

function calcTourDemand(fans:number, fame:number, rep:number, genreMod:Record<string,number>, genre:Genre, decayIdx:number) {
  const base = fans*0.06 + fame*50 + rep*20;
  const gMod = genreMod[genre] ?? 1.0;
  return Math.floor(base * gMod * Math.max(0.5, 1 - decayIdx*0.04));
}
function calcFill(demand:number, cap:number, mult:number) {
  return Math.min(1, (demand/cap) * (mult<=0.7?1.15 : 1.0 - Math.max(0,mult-1.0)*0.2));
}
function calcCrewCost(tier:number) { return ({1:120,2:180,3:280,4:450,5:750,6:1500,7:3500} as Record<number,number>)[tier]??120; }

function calcMarketRevenue(s: GameState, labelCut: number) {
  const era = getMarketEra(s.currentYear);
  let grossTotal = 0;
  let artistTotal = 0;
  for (const t of s.catalog) {
    const format = t.format ?? "streaming";
    const isAvailable = era.formats.includes(format);
    const isReissued = t.reissuedEraIds?.includes(era.id) ?? false;
    const availability = isReissued ? 1.25 : isAvailable ? 1 : 0.55;
    const formatInfo = getReleaseFormat(format);
    const primaryChannel = ["cassette", "vinyl", "cd"].includes(format) ? "physical" : format === "download" ? "download" : "streaming";
    const channelBoost = (channel: "physical" | "download" | "streaming") => channel === primaryChannel ? formatInfo.launchMult * availability : availability;
    const attention = t.weeklyStreams;
    const breakdown = {
      physical: Math.floor(attention * era.revenueMix.physical * 0.008 * channelBoost("physical")),
      download: Math.floor(attention * era.revenueMix.download * 0.0045 * channelBoost("download")),
      streaming: Math.floor(attention * era.revenueMix.streaming * 0.00272 * channelBoost("streaming")),
    };
    const gross = breakdown.physical + breakdown.download + breakdown.streaming;
    const artist = Math.floor(gross * (1 - labelCut));
    t.weeklyRevenueBreakdown = breakdown;
    const lifetime = t.lifetimeRevenueBreakdown ?? { physical:0, download:0, streaming:0 };
    lifetime.physical += breakdown.physical;
    lifetime.download += breakdown.download;
    lifetime.streaming += breakdown.streaming;
    t.lifetimeRevenueBreakdown = lifetime;
    t.weeklyRevenue = artist;
    if (t.streamStats) t.streamStats.weeklyRevenue = breakdown.streaming;
    grossTotal += gross;
    artistTotal += artist;
  }
  return { gross: grossTotal, artist: artistTotal };
}

function classifyLifecycle(quality:number, outcome:string, mkt:number, score:number, arch:string): SongLifecycle {
  const roll2 = Math.random()*100;
  const adj = roll2
    + Math.max(0,(quality-50)/10)*3
    + (({Flop:-20,Moderate:0,Hit:15,Viral:30} as Record<string,number|undefined>)[outcome] ?? 0)
    + Math.min(8,mkt/2500)
    + Math.max(0,(score-60)/4);
  const evT = archHas(arch,"evergreenBoost") ? Math.round(92/evergreenMult(arch)) : 92;
  if (adj >= evT) return "Evergreen";
  if (adj >= 72)  return "Hit";
  return "Normal";
}

function runAwardCheck(s:GameState): Award|null {
  for (const award of AWARDS) {
    if (s.awardsWon.includes(award.id)) continue;
    if (s.fame>=award.fameReq && s.rep>=award.repReq && Math.random()<0.08) {
      s.awardsWon.push(award.id);
      s.money += award.money; s.fame=clamp(s.fame+award.famePerk,0,100); s.rep=clamp(s.rep+award.repPerk,0,100);
      s.log.unshift({week:s.week,msg:`WON: ${award.name} — ${fmtMoney(award.money)}`,type:"great"});
      return award;
    }
  }
  return null;
}

function saveToDisk(s:GameState) { try { localStorage.setItem(SAVE_KEY,JSON.stringify(s)); } catch {} }
function loadFromDisk(): GameState|null { try { const r=localStorage.getItem(SAVE_KEY); return r?JSON.parse(r):null; } catch { return null; } }

// ─── RIVALS / ARCS HELPERS ─────────────────────────────────
function seedRivals(playerFame: number): RivalState[] {
  return RIVALS.map(r => ({
    id: r.id,
    fame: clamp(playerFame + r.startFameOffset, 0, 100),
    fans: r.startFans,
    rep: 35 + Math.floor(Math.random() * 30),
    relationship: r.personality === "friendly" ? +15
                : r.personality === "hostile"  ? -20
                : 0,
    weeksSinceRelease: 4 + Math.floor(Math.random() * 12),
    releasesCount: r.personality === "friendly" ? 8 : 4,
    lastReleaseTitle: null,
    lastReleaseQuality: 60,
    lastReleaseWeek: 0,
    awardsWon: r.personality === "friendly" ? 2 : 0,
    beefHeat: r.personality === "hostile" ? 18 : 0,
  }));
}

function tickRivals(s: GameState): void {
  if (!s.rivals?.length) return;
  for (let i = 0; i < s.rivals.length; i++) {
    const r = s.rivals[i];
    const def = RIVALS.find(x => x.id === r.id);
    if (!def) continue;
    r.weeksSinceRelease++;
    // Slow fan drift — friendly/legacy rivals stay steady, climbers grow,
    // hostile road dogs erode without releases.
    const drift =
      def.personality === "friendly"    ?  0.001
    : def.personality === "competitive" ?  0.004
    : def.personality === "hostile"     ? -0.002
    :                                       0.000;
    r.fans = Math.max(500, Math.floor(r.fans * (1 + drift + (Math.random() - 0.5) * 0.01)));
    // Fame oscillates around their tier baseline (set at seed).
    r.fame = clamp(r.fame + (Math.random() - 0.5) * 0.6, 0, 100);
    // Hostile rivals occasionally take public shots — small player rep ding.
    if (def.personality === "hostile" && r.beefHeat > 30 && Math.random() < 0.04) {
      s.rep = clamp(s.rep - 1, 0, 100);
      s.log.unshift({ week: s.week, msg: `${def.name} took a shot at you in an interview. -1 rep.`, type: "bad" });
    }
    // Hostile beefHeat decays slowly.
    if (r.beefHeat > 0) r.beefHeat = Math.max(0, r.beefHeat - 0.5);
    // Releases on a 9-15 week cadence depending on personality.
    const cadence = def.personality === "competitive" ? 9
                  : def.personality === "friendly"    ? 14
                  :                                     12;
    if (r.weeksSinceRelease >= cadence + Math.floor(Math.random() * 4)) {
      const title = pickRivalTitle(def.genre, Math.random);
      const q = clamp(55 + def.craftBias + (Math.random() * 30 - 15), 25, 95);
      r.lastReleaseTitle = title;
      r.lastReleaseQuality = q;
      r.lastReleaseWeek = s.week;
      r.releasesCount++;
      r.weeksSinceRelease = 0;
      // Scene buzz from a strong rival drop nudges market saturation up
      // (it's noisy out there) and bumps rival fans modestly.
      const fanG = Math.floor(r.fans * (q > 75 ? 0.04 : q > 60 ? 0.02 : 0.005));
      r.fans += fanG;
      if (q > 70) {
        s.marketSaturation = Math.min(100, (s.marketSaturation ?? 0) + 4);
      }
      s.log.unshift({
        week: s.week,
        msg: `${def.name} dropped "${title}" — ${q > 75 ? "critics raving" : q > 55 ? "solid reception" : "muted reaction"}.`,
        type: q > 70 ? "neutral" : "good",
      });
      // Competitive rivals taunt you when they outchart you.
      if (def.personality === "competitive" && q > 70 && r.fans > s.fans) {
        r.beefHeat = Math.min(100, r.beefHeat + 12);
      }
    }
    // Periodic award wins for legend-tier rivals.
    if (def.personality === "friendly" && Math.random() < 0.005) {
      r.awardsWon++;
      s.log.unshift({ week: s.week, msg: `${def.name} won another award. The Bluebird is buzzing.`, type: "neutral" });
    }
  }
}

function refreshInboundOffers(s: GameState): void {
  if (!s.currentManager && (!s.pendingManagerOffers || s.pendingManagerOffers.length === 0)) {
    const offers = generateManagerOffers(s);
    if (offers.length) {
      s.pendingManagerOffers = offers;
      s.log.unshift({ week: s.week, msg: `${offers.length} manager${offers.length > 1 ? "s" : ""} reached out.`, type: "good" });
    }
  }
  if (!s.currentLabel && (!s.pendingLabelOffers || s.pendingLabelOffers.length === 0)) {
    const offers = generateLabelOffers(s);
    if (offers.length) {
      s.pendingLabelOffers = offers;
      s.log.unshift({ week: s.week, msg: `${offers.length} label${offers.length > 1 ? "s" : ""} sent offers.`, type: "good" });
    }
  }
  if (!s.currentPublishing && (!s.pendingPublishingOffers || s.pendingPublishingOffers.length === 0)) {
    const offers = generatePublishingOffers(s);
    if (offers.length) {
      s.pendingPublishingOffers = offers;
      s.log.unshift({ week: s.week, msg: `${offers.length} publishing offer${offers.length > 1 ? "s" : ""} on the table.`, type: "good" });
    }
  }
}

function tickArcs(s: GameState): { firedChoice: boolean } {
  if (!s.activeArcs?.length) return { firedChoice: false };
  for (const inst of s.activeArcs) {
    if (inst.currentStep < 0) continue;
    const arc = getStoryArc(inst.arcId);
    if (!arc) { inst.currentStep = -1; continue; }
    const step = arc.steps[inst.currentStep];
    if (!step) { inst.currentStep = -1; continue; }
    // Apply weekly passive effect (per week step is pending and not yet fired).
    if (step.passive && s.week < inst.fireOnWeek) {
      const e = step.passive;
      if (e.energy) s.energy = clamp(s.energy + e.energy, 0, 100);
      if (e.money)  s.money += e.money;
      if (e.rep)    s.rep   = clamp(s.rep + e.rep, 0, 100);
      if (e.fame)   s.fame  = clamp(s.fame + e.fame, 0, 100);
      if (e.fans)   s.fans  = Math.max(0, s.fans + e.fans);
      if (e.hype)   s.hype  = clamp(s.hype + e.hype, 0, 100);
    }
    // Fire the choice modal once we hit the trigger week.
    if (s.week >= inst.fireOnWeek && !s.pendingArcChoice && !s.pendingScenarioId) {
      s.pendingArcChoice = { arcId: inst.arcId, stepIndex: inst.currentStep };
      return { firedChoice: true };
    }
  }
  return { firedChoice: false };
}

function arcEligible(arc: StoryArc, s: GameState): boolean {
  if (s.completedArcs?.includes(arc.id)) return false;
  if (s.activeArcs?.some(a => a.arcId === arc.id && a.currentStep >= 0)) return false;
  const t = arc.trigger;
  if (!t) return true;
  if (t.minFame     !== undefined && s.fame          < t.minFame)     return false;
  if (t.maxFame     !== undefined && s.fame          > t.maxFame)     return false;
  if (t.minReleases !== undefined && s.totalReleases < t.minReleases) return false;
  if (t.minRep      !== undefined && s.rep           < t.minRep)      return false;
  if (t.minBurnout  !== undefined && (s.burnout ?? 0) < t.minBurnout) return false;
  if (t.minWeek     !== undefined && s.week          < t.minWeek)     return false;
  if (t.hasManager  !== undefined && t.hasManager !== !!s.currentManager) return false;
  if (t.hasEvergreen) {
    if (!s.catalog.some(c => c.lifecycle === "Evergreen")) return false;
  }
  return true;
}

function maybeSpawnArc(s: GameState): void {
  // Don't pile arcs on top of pending modals or active arcs.
  if (s.pendingArcChoice || s.pendingScenarioId) return;
  if (s.activeArcs?.some(a => a.currentStep >= 0)) return;
  // Low base spawn chance (~5%/week); higher if a long while since last arc.
  if (Math.random() > 0.06) return;
  const eligible = STORY_ARCS.filter(a => arcEligible(a, s));
  if (!eligible.length) return;
  const totalW = eligible.reduce((sum, a) => sum + a.weight, 0);
  let r = Math.random() * totalW;
  const chosen = eligible.find(a => { r -= a.weight; return r <= 0; }) ?? eligible[0];
  const firstStep = chosen.steps[0];
  const inst: ArcInstance = {
    arcId: chosen.id,
    startedWeek: s.week,
    currentStep: 0,
    fireOnWeek: s.week + (firstStep?.delay ?? 1),
    choicePath: [],
  };
  s.activeArcs = [...(s.activeArcs ?? []), inst];
  s.log.unshift({
    week: s.week,
    msg: `New chapter: ${chosen.title} — ${chosen.subtitle.toLowerCase()}.`,
    type: "neutral",
  });
}

// ─── ADVANCE WEEK ─────────────────────────────────────────
function advance(prev:GameState): GameState {
  const s:GameState = JSON.parse(JSON.stringify(prev));
  s.pendingEvent = null; s.modal = null;
  s.week++; s.weeksSinceRelease++;
  const previousEra = getMarketEra(s.currentYear ?? 2018);
  s.currentYear = 1990 + Math.floor((s.week - 1) / 52);
  const currentEra = getMarketEra(s.currentYear);
  s.marketEraId = currentEra.id;
  if (currentEra.id !== previousEra.id) {
    s.log.unshift({ week:s.week, msg:`Market shift: ${currentEra.name}. ${currentEra.marketNote}`, type:"great" });
    s.pendingEvent = { msg:`${currentEra.name} begins. ${currentEra.promotionNote}`, type:"gold" };
  }
  if (s.pendingReissue) {
    const reissue = s.pendingReissue;
    const entry = s.catalog.find(item => item.id === reissue.releaseId);
    if (entry) {
      entry.format = reissue.format;
      entry.reissuedEraIds = [...(entry.reissuedEraIds ?? []), reissue.eraId];
      entry.weeklyStreams = Math.min(Math.floor(entry.peakStreams * 1.15), Math.floor(entry.weeklyStreams * 1.5 + 50));
      s.hype = clamp(s.hype + 5, 0, 100);
      s.log.unshift({ week:s.week, msg:`Reissue arrived: "${entry.title}" is back in market on ${getReleaseFormat(reissue.format).label}.`, type:"great" });
    }
    s.pendingReissue = null;
  }
  if (s.campaignLiveBoostWeeks > 0) {
    s.campaignLiveBoostWeeks--;
    if (s.campaignLiveBoostWeeks === 0) s.campaignLiveBoost = 0;
  }
  if (s.campaignRadioBoostWeeks > 0) {
    s.campaignRadioBoostWeeks--;
    if (s.campaignRadioBoostWeeks === 0) s.campaignRadioBoost = 0;
  }
  for (const k of Object.keys(s.cooldowns)) if(s.cooldowns[k]>0) s.cooldowns[k]--;
  // Burnout slowly recovers each week — but only meaningfully when not actively
  // grinding (touring counters this in the show block below).
  s.burnout = Math.max(0, (s.burnout ?? 0) - (s.tourActive ? 0.5 : 2));
  if ((s.vacationCooldown ?? 0) > 0) s.vacationCooldown--;
  s.marketSaturation = Math.max(0, (s.marketSaturation??0) - 5);
  s.hype   = Math.max(0,   s.hype-5);
  if (s.weeksSinceRelease>6) { s.fame=Math.max(0,s.fame-0.6); s.rep=Math.max(0,s.rep-0.2); }
  processLabelSubmissionReview(s);
  // Recording: studio fee charged every active week; energy drained & progress ticks only if not exhausted.
  // Energy regen (+20) happens AFTER this block so stall can trigger when artist ends a week too drained.
  if (s.project && s.project.weeksLeft > 0) {
    const recEnergy:Record<string,number>={Single:8,EP:10,Album:12,"Live Album":7};
    const drain = recEnergy[s.project.type] ?? 10;
    const mode = s.project.mode ?? "standard";
    const modeCfg = RECORDING_MODE_CONFIG[mode];

    // Studio fee is due regardless of whether the session makes progress
    // Mode may modify cost (Rush = 1.5× studio cost)
    const recStudio = getStudio(s.project.studioId);
    if (recStudio && recStudio.perWeek > 0) {
      const weeklyCost = Math.floor(recStudio.perWeek * modeCfg.costMult);
      const payment = payRecordingCost(s, s.project, weeklyCost);
      if (payment.fromFund > 0) {
        s.log.unshift({week:s.week,msg:`Label fund covered ${fmtMoney(payment.fromFund)} of this week's studio rent.`,type:"neutral"});
      }
      s.log.unshift({week:s.week,msg:`Studio: ${recStudio.name} — ${fmtMoney(weeklyCost)}/wk${mode !== "standard" ? ` (${mode})` : ""}.`,type:"neutral"});
    }

    if (s.project.studioBreakThisWeek) {
      s.project.studioBreakThisWeek = false;
      s.log.unshift({week:s.week,msg:"Took a studio break this week. Energy recovering.",type:"neutral"});
      // weeksLeft does NOT tick; energy recovers naturally at end of week
    } else if (s.project.pushThroughThisWeek) {
      s.project.pushThroughThisWeek = false;
      if ((s.energy ?? 0) < drain) {
        // Actually exhausted — apply push-through penalties
        if (resolveProjectSongSession(s, s.project)) {
          s.energy = Math.max(0, (s.energy ?? 0) - drain);
          s.burnout = Math.min(100, (s.burnout ?? 0) + 12);
          s.project.pushThroughCount = (s.project.pushThroughCount ?? 0) + 1;
          s.project.weeksLeft--;
          s.log.unshift({week:s.week,msg:"Pushed through exhaustion to record. Heavy burnout hit. Quality will suffer.",type:"bad"});
        }
      } else {
        // Energy recovered before the tick — record normally, no penalty
        if (resolveProjectSongSession(s, s.project)) {
          s.energy = Math.max(0, (s.energy ?? 0) - drain);
          s.burnout = Math.min(100, (s.burnout ?? 0) + 2);
          s.project.weeksLeft--;
        }
      }
    } else if ((s.energy ?? 0) < drain) {
      s.log.unshift({week:s.week,msg:"Too exhausted to record this week. Rest up.",type:"bad"});
      // Project stalls — weeksLeft does NOT tick
    } else {
      if (resolveProjectSongSession(s, s.project)) {
        s.energy = Math.max(0, (s.energy ?? 0) - drain);
        s.burnout = Math.min(100, (s.burnout ?? 0) + 2);
        s.project.weeksLeft--;
      }
    }
  }
  // Weekly energy regen comes AFTER recording drain so exhaustion stall can trigger
  s.energy = Math.min(100, s.energy+20);
  if (!s.tourActive) s.tourFatigue = Math.max(0, s.tourFatigue-5);

  // Streaming
  const CBACK = {Normal:0.008,Hit:0.015,Evergreen:0.025};
  const CRESTORE = {Normal:[0.25,0.45],Hit:[0.40,0.70],Evergreen:[0.60,0.90]};
  for (const t of s.catalog) {
    t.weeksActive=(t.weeksActive||0)+1;
    if (t.comebackCooldown>0) t.comebackCooldown--;
    if (t.weeksActive>=8 && t.comebackCooldown===0) {
      const ch=(CBACK as any)[t.lifecycle]??0.008;
      if (Math.random()<ch) {
        const [lo,hi]=(CRESTORE as any)[t.lifecycle]??[0.25,0.45];
        t.weeklyStreams=Math.floor(t.peakStreams*(lo+Math.random()*(hi-lo)));
        t.comebackCooldown=12;
      }
    }
    const age=Math.max(0.6,1-t.weeksActive*0.005);
    t.weeklyStreams=Math.max(t.streamFloor,Math.floor(t.weeklyStreams*t.decayRate*age));
    t.totalStreams+=t.weeklyStreams; s.totalStreams+=t.weeklyStreams;

    // ── Platform mix evolution ──
    // As fame grows, Apple Music share increases (older, wealthier demo)
    // YouTube share grows with viral hits (younger demo)
    const baseMix = s.platformMix;
    const fameBonus = Math.min(0.15, s.fame * 0.002);
    t.platformMix = {
      spotify: Math.max(0.35, (baseMix.spotify ?? 0.52) - fameBonus * 0.4),
      apple: Math.min(0.35, (baseMix.apple ?? 0.22) + fameBonus * 0.6),
      amazon: Math.max(0.03, (baseMix.amazon ?? 0.12) - fameBonus * 0.1),
      youtube: Math.min(0.20, (baseMix.youtube ?? 0.09) + fameBonus * 0.3),
      tidal: baseMix.tidal ?? 0.02,
      deezer: baseMix.deezer ?? 0.02,
      pandora: baseMix.pandora ?? 0.01,
    };
    // Normalize to sum to 1
    const mixSum = Object.values(t.platformMix).reduce((a,b)=>a+b,0);
    if (mixSum > 0) {
      for (const k of Object.keys(t.platformMix)) {
        t.platformMix[k] = t.platformMix[k] / mixSum;
      }
    }

    // ── Geographic distribution evolution ──
    // Touring in a region boosts that region's share
    const tourRegionBoost = s.regional ?? {};
    t.geoDist = {...(s.geoDist ?? DEFAULT_GEO_DIST)};
    let geoTotal = Object.values(t.geoDist).reduce((a,b)=>a+b,0);
    for (const [region, count] of Object.entries(tourRegionBoost)) {
      if (count > 0) {
        const boost = Math.min(0.08, count * 0.015);
        // Find matching country code for region
        const regionMap: Record<string, string> = {
          "South": "US", "Deep South": "US", "Southeast": "US",
          "Southwest": "US", "Midwest": "US", "Midwest-South": "US",
        };
        const country = regionMap[region] ?? "US";
        if (t.geoDist[country] !== undefined) {
          t.geoDist[country] = Math.min(0.85, t.geoDist[country] + boost);
          // Reduce "other" to compensate
          t.geoDist["other"] = Math.max(0.02, t.geoDist["other"] - boost * 0.5);
        }
      }
    }
    // Normalize
    geoTotal = Object.values(t.geoDist).reduce((a,b)=>a+b,0);
    if (geoTotal > 0) {
      for (const k of Object.keys(t.geoDist)) {
        t.geoDist[k] = t.geoDist[k] / geoTotal;
      }
    }

    // ── Premium ratio evolution ──
    // Superfans = premium subscribers. More superfans = higher premium ratio.
    const sfRatio = s.fans > 0 ? (s.superfans ?? 0) / s.fans : 0;
    t.premiumRatio = Math.min(0.85, Math.max(0.35, 0.45 + sfRatio * 0.4));

    // Initialize streamStats if missing (legacy save compatibility)
    if (!t.streamStats) {
      t.streamStats = {
        totalStreams: t.totalStreams,
        weeklyStreams: t.weeklyStreams,
        peakStreams: t.peakStreams,
        totalRevenue: 0,
        weeklyRevenue: 0,
        platformBreakdown: {},
        geoBreakdown: {},
        effectiveRate: BASE_STREAMING_RATE,
        premiumRatio: t.premiumRatio,
        usShare: t.geoDist?.US ?? 0.6,
        hitThreshold: t.totalStreams >= SPOTIFY_MIN_STREAMS,
        revenueHistory: [],
      };
    }

    // Update streamStats totals
    t.streamStats.totalStreams = t.totalStreams;
    t.streamStats.weeklyStreams = t.weeklyStreams;
    t.streamStats.peakStreams = t.peakStreams;
  }
  const streamCutPct = s.currentLabel?.streamingCut ?? (s.labelSigned ? 0.18 : 0);
  const marketIncome = calcMarketRevenue(s, streamCutPct);
  s.money+=marketIncome.artist; s.totalEarned+=marketIncome.artist;
  if (s.currentLabel) {
    const labelShare = Math.max(0, marketIncome.gross - marketIncome.artist);
    const recouped = Math.min(labelShare * s.currentLabel.recoupRate, getLabelRecoupmentRemaining(s.currentLabel));
    if (recouped > 0) s.currentLabel.advanceRecouped += recouped;
    s.currentLabel.isRecouped = getLabelRecoupmentRemaining(s.currentLabel) <= 0;
  }
  const curWeekStreams = s.catalog.reduce((t,c)=>t+c.weeklyStreams,0);
  s.streamHistory = [...(s.streamHistory??[]), curWeekStreams].slice(-104);
  s.peakWeeklyStreams = Math.max(s.peakWeeklyStreams??0, curWeekStreams);

  // Expenses
  s.money -= s.weeklyExpenses;

  // Manager: weekly retainer + small rep accrual
  if (s.currentManager) {
    s.money -= s.currentManager.weeklyFee;
    let clashPenalty = 1.0;
    const mgr = MANAGERS.find(m => m.id === s.currentManager!.managerId);
    if (mgr) {
      if (mgr.type === "aggressive" && s.rep < 30) clashPenalty = 0.75;
      if (mgr.type === "legend" && s.fame < 60) clashPenalty = 0.85;
      if (mgr.type === "old_school" && s.themeCounts && Object.keys(s.themeCounts).some(t => t === "experimental")) clashPenalty = 0.8;
    }
    if (clashPenalty < 1.0) {
      s.rep = Math.max(0, s.rep - 0.2);
    }
    if (s.currentManager.repPerWeek > 0) {
      s.rep = clamp(s.rep + s.currentManager.repPerWeek * clashPenalty, 0, 100);
    }
  }

  // Label contract countdown — when expired, drop the contract.
  if (s.currentLabel) {
    s.currentLabel.weeksLeft -= 1;
    updateLabelDeliveryStatus(s);
    if (s.currentLabel.weeksLeft <= 0) {
      const label = s.currentLabel;
      const outstandingAlbums = Math.max(0, label.albumsCommitted - label.albumsDelivered);
      if (outstandingAlbums > 0 && (label.deliveryExtensions ?? 0) < 2) {
        label.weeksLeft = label.suspensionRights ? 8 : 12;
        label.deliveryDeadlineWeek = s.week + label.weeksLeft;
        label.deliveryStatus = "breach";
        label.fundingFrozen = true;
        label.deliveryExtensions = (label.deliveryExtensions ?? 0) + 1;
        s.log.unshift({
          week:s.week,
          msg: `${label.name} extended the term by ${label.weeksLeft} weeks for ${outstandingAlbums} undelivered album${outstandingAlbums === 1 ? "" : "s"}. Label funding is frozen until you deliver.`,
          type:"bad",
        });
      } else {
      s.log.unshift({ week:s.week, msg:`Contract with ${s.currentLabel.name} expired. You're a free agent.`, type:"neutral" });
      s.currentLabel = null;
      s.labelSigned = false;
      }
    }
  }

  // ── Publishing Deal Accounting ──
  const totalStreams = s.catalog.reduce((sum, t) => sum + t.weeklyStreams, 0);
  const grossPublishingRev = Math.floor(totalStreams * 0.0012);
  let publishingArtistShare = grossPublishingRev;
  if (s.currentPublishing) {
    const acct = runPublishingAccounting(s.currentPublishing, grossPublishingRev);
    publishingArtistShare = acct.artistShare;
    s.currentPublishing.advanceRecouped += acct.recouped;
    s.currentPublishing.isRecouped = acct.isRecouped;
    if (acct.recouped > 0) {
      s.log.unshift({ week: s.week, msg: `Publishing recoup: ${fmtMoney(acct.recouped)} · ${fmtMoney(Math.max(0, s.currentPublishing.advance - s.currentPublishing.advanceRecouped))} remaining`, type: "neutral" });
    }
    s.currentPublishing.weeksLeft--;
    if (s.currentPublishing.weeksLeft <= 0) {
      s.log.unshift({ week: s.week, msg: `Publishing deal with ${s.currentPublishing.publisherName} expired.`, type: "neutral" });
      s.currentPublishing = null;
    }
  }
  s.money += Math.floor(publishingArtistShare);
  s.totalEarned += Math.floor(publishingArtistShare);
  s.totalPublishingRevenue = (s.totalPublishingRevenue || 0) + Math.floor(publishingArtistShare);

  // Brand deals
  const brandMult = s.currentManager?.brandDealBoost ?? 1.0;
  let brandInc=0;
  s.activeBrandDeals = s.activeBrandDeals.map(d=>({...d,weeksLeft:d.weeksLeft-1})).filter(d=>{
    if(d.weeksLeft>=0){brandInc+=Math.floor(d.weeklyIncome * brandMult);return true;}
    s.log.unshift({week:s.week,msg:`Brand deal ended: ${d.name}`,type:"neutral"});
    return false;
  });
  s.money+=brandInc; s.totalEarned+=brandInc;

  // ── Sellout Score ──
  if (s.selloutScore === undefined) s.selloutScore = 0;
  s.selloutScore = Math.max(0, s.selloutScore - 0.5);
  for (const deal of s.activeBrandDeals) {
    const selloutHit = getBrandDealSellout(deal.id);
    if (selloutHit > 0) {
      s.selloutScore = Math.min(100, s.selloutScore + (selloutHit / deal.weeksLeft));
    }
  }
  if (s.selloutScore > 60) {
    s.rep = Math.max(0, s.rep - 0.3);
  }

  // Tour show
  let notifMsg:string|null=null, notifType="norm";

  // ── Bus Breakdown Check ──
  if (s.tourActive && s.tourActive.progress < s.tourActive.shows.length && s.week > s.lastBusBreakdownWeek + 2) {
    const breakdown = rollBusBreakdown(s.tourActive.progress, s.tourActive.shows.length);
    if (breakdown) {
      s.lastBusBreakdownWeek = s.week;
      const eff = breakdown.effect;

      // Apply breakdown effects
      if (eff.showsCancelled && eff.showsCancelled > 0) {
        s.tourActive.progress += eff.showsCancelled;
        s.log.unshift({ week: s.week, msg: `${breakdown.emoji} ${breakdown.title}: ${eff.showsCancelled} show(s) cancelled.`, type: "bad" });
      }
      if (eff.moneyCost) {
        s.money -= eff.moneyCost;
        s.log.unshift({ week: s.week, msg: `${breakdown.emoji} ${breakdown.title}: -${fmtMoney(eff.moneyCost)} in repairs.`, type: "bad" });
      }
      if (eff.moraleHit) {
        s.tourMorale = Math.max(0, s.tourMorale - eff.moraleHit);
        s.log.unshift({ week: s.week, msg: `${breakdown.emoji} ${breakdown.title}: Band morale dropped ${eff.moraleHit}%.`, type: "bad" });
      }
      if (eff.localFansGain) {
        s.fans += eff.localFansGain;
        s.log.unshift({ week: s.week, msg: `${breakdown.emoji} ${breakdown.title}: +${fmt(eff.localFansGain)} local fans!`, type: "good" });
      }
      if (eff.repLoss) {
        s.rep = clamp(s.rep - eff.repLoss, 0, 100);
      }

      s.pendingEvent = { msg: `${breakdown.emoji} ${breakdown.title}: ${breakdown.description}`, type: eff.showsCancelled ? "bad" : "neutral" };

      // Check if tour ended due to cancellations
      if (s.tourActive.progress >= s.tourActive.shows.length) {
        s.tourActive = null;
        s.log.unshift({ week: s.week, msg: "Tour ended early due to breakdowns.", type: "bad" });
      }
    }
  }

  // ── Setlist Satisfaction ──
  let setlistSatisfaction: SetlistSatisfaction | null = null;
  if (s.tourActive && s.tourActive.progress < s.tourActive.shows.length && s.catalog.length > 0) {
    setlistSatisfaction = calculateSetlistSatisfaction(s.setlistConfig, s.catalog, s.tourActive.shows.length > 5 ? 22 : 6);
  }

  if (s.tourActive && s.tourActive.progress<s.tourActive.shows.length) {
    const show=s.tourActive.shows[s.tourActive.progress];
    // ── #3 Burnout: high tiers can force cancellations on the road ──
    const cancelChance = burnoutCancelChance(s.burnout ?? 0);
    if (cancelChance > 0 && Math.random() < cancelChance) {
      // Lost gig: cover travel/crew, ding rep, lose a few casual fans.
      const lost = show.travelCost + Math.floor(calcCrewCost(show.venueTier) * 0.5);
      s.money -= lost;
      s.rep = clamp(s.rep - 4, 0, 100);
      // Cancelled = forced rest. Reward a burnout recovery to soften the spiral.
      s.burnout = clamp((s.burnout ?? 0) - 12, 0, 100);
      s.energy = clamp(s.energy + 8, 0, 100);
      const tier = getBurnoutTier(s.burnout ?? 0);
      s.log.unshift({ week:s.week, msg:`CANCELLED: ${show.cityName} @ ${show.venueName} — ${tier.label.toLowerCase()}. -${fmtMoney(lost)} sunk costs. Got some rest.`, type:"bad" });
      s.tourActive.progress++;
      notifMsg = `Cancelled ${show.cityName} — you couldn't go on. Rest helped a little.`;
      notifType = "bad";
      if (s.tourActive.progress >= s.tourActive.shows.length) {
        s.tourActive = null;
        s.log.unshift({ week:s.week, msg:"Tour ended early.", type:"neutral" });
      }
    } else {
    let demand=calcTourDemand(s.fans,s.fame,s.rep,show.genreMod,s.genre,s.tourActive.demandDecayIndex);
    if (s.campaignLiveBoostWeeks > 0) demand = Math.floor(demand * (1 + s.campaignLiveBoost));
    const burnoutMult = burnoutShowMult(s.burnout ?? 0);

    // ── Venue Reputation Bonus ──
    const venueRep = getVenueReputation(show.venueName, s.venueReputations);
    const venuePerk = getVenuePerkForVenue(show.venueName, venueRep.playCount);
    let venueTicketMod = 1.0;
    let venueRepMod = 0;
    let venueFanMod = 1.0;
    let venueCostMod = 1.0;
    if (venuePerk) {
      venueTicketMod = venuePerk.effect.ticketMod ?? 1.0;
      venueRepMod = venuePerk.effect.repMod ?? 0;
      venueFanMod = venuePerk.effect.fanMod ?? 1.0;
      venueCostMod = venuePerk.effect.moneyMod ?? 1.0;
    }

    // ── Setlist Satisfaction Modifier ──
    let setlistFillMod = 1.0;
    let setlistFanBonus = 0;
    let setlistRepBonus = 0;
    if (setlistSatisfaction) {
      setlistFillMod = 0.7 + (setlistSatisfaction.score / 100) * 0.6; // 0.7 to 1.3
      setlistFanBonus = setlistSatisfaction.hitBonus + setlistSatisfaction.newMaterialBonus;
      setlistRepBonus = setlistSatisfaction.deepCutBonus;
    }

    const fill=calcFill(demand,show.venueCap,s.tourActive.ticketMult) * burnoutMult * setlistFillMod;
    const seats=Math.floor(fill*show.venueCap);
    // Realistic indie ticket pricing by venue tier + fame premium
    const baseTicketByTier = [8, 12, 18, 25, 35, 55, 85];
    const tierBase = baseTicketByTier[Math.min(show.venueTier-1, 6)] || 10;
    const famePrem = Math.floor(s.fame * 0.8);
    const repPrem = Math.floor(s.rep * 0.15);
    const ticket = Math.max(tierBase, Math.floor((tierBase + famePrem + repPrem) * s.tourActive.ticketMult * venueTicketMod));
    // Door gross
    const doorGross = seats * ticket;
    // Merch per head: superfans spend 3-6x more than casuals
    const sfRatio = s.fans > 0 ? (s.superfans ?? 0) / s.fans : 0;
    const merchPerHead = Math.floor((3.50 + s.fame*0.08) * (1 + sfRatio*4) * ((show.genreMod[s.genre]??1)>1.2?1.15:1.0));
    const merchGross = seats * merchPerHead;
    // Venue guarantee (small rooms pay YOU, big rooms you pay or split door)
    const venueGuarantee = show.venueTier <= 2 ? Math.floor(roll(120, 350))
                         : show.venueTier === 3 ? Math.floor(roll(200, 600))
                         : -Math.floor(show.venueTier * 180 * venueCostMod);
    const totalGross = doorGross + merchGross + venueGuarantee;
    // Expenses: travel, lodging, food, vehicle, crew
    const people = 1 + 2; // artist + 2 crew minimum
    const lodgingPerPerson = show.venueTier <= 2 ? 55 : show.venueTier <= 4 ? 85 : 120;
    const lodging = lodgingPerPerson * people;
    const food = 28 * people;
    const travel = show.travelCost; // gas, tolls, van wear for this leg
    const vehicleFixed = 26; // van payment/insurance/maintenance per day
    const crewDayRate = [120, 180, 280, 450, 750, 1500, 3500][Math.min(show.venueTier-1, 6)] || 120;
    const crew = crewDayRate * 2;
    const totalExpenses = travel + lodging + food + vehicleFixed + crew;
    const mgrPct = s.currentManager?.showRevPct ?? (s.hasManager ? 0.15 : 0);
    const revMult=showRevBonus(s.archetype,mgrPct);
    const preCutNet = (totalGross - totalExpenses) * revMult;
    const tourCutPct = s.currentLabel?.tourGrossCut ?? (s.labelSigned ? 0.10 : 0);
    const labelCut = tourCutPct > 0 ? Math.floor(preCutNet * tourCutPct) : 0;
    const net = Math.floor(preCutNet - labelCut);
    s.money+=net; s.totalEarned+=Math.max(0,net);
    const fG=Math.floor(seats*0.3*((show.genreMod[s.genre]??1)>1.2?1.2:1) * venueFanMod) + setlistFanBonus;
    s.fans+=fG;
    // Live shows convert casuals → superfans (in-person bond). ~8% of attending
    // seats become superfans, scaled by fill (a packed room makes more loyalists).
    const casualsAvail = Math.max(0, s.fans - (s.superfans ?? 0));
    const sfG = Math.min(casualsAvail, Math.floor(seats * 0.08 * Math.max(0.4, fill)));
    s.superfans = (s.superfans ?? 0) + sfG;
    s.totalShows++; s.tourFatigue=Math.min(100,s.tourFatigue+10);
    s.tourActive.demandDecayIndex++;
    const repG=fill>=0.7?(archHas(s.archetype,"showRepBonus")?archVal(s.archetype)*3:3):fill>=0.4?1:-2;
    s.rep=clamp(s.rep+repG+venueRepMod+setlistRepBonus,0,100);

    // ── Update Venue Reputation ──
    if (!s.venueReputations) s.venueReputations = {};
    const existingRep = s.venueReputations[show.venueName] ?? { venueName: show.venueName, playCount: 0, lastPlayedWeek: 0, perkUnlocked: null, perkTier: 0 };
    existingRep.playCount++;
    existingRep.lastPlayedWeek = s.week;
    const newPerk = getVenuePerkForVenue(show.venueName, existingRep.playCount);
    if (newPerk && newPerk.id !== existingRep.perkUnlocked) {
      existingRep.perkUnlocked = newPerk.id;
      existingRep.perkTier = newPerk.tier;
      s.log.unshift({ week: s.week, msg: `🏆 Perk unlocked at ${show.venueName}: ${newPerk.label}! ${newPerk.bonus}`, type: "great" });
    }
    s.venueReputations[show.venueName] = existingRep;

    // ── Tour Morale ──
    s.tourMorale = Math.min(100, Math.max(0, s.tourMorale + (fill >= 0.7 ? 3 : fill >= 0.4 ? 1 : -2)));

    if (!s.regional[show.region]) s.regional[show.region]=0;
    s.regional[show.region]++;
    if (!s.tourHistory) s.tourHistory=[];
    const gross = doorGross;
    s.tourHistory.unshift({
      week:s.week, cityName:show.cityName, venueName:show.venueName,
      venueCap:show.venueCap, seats, attendancePct:Math.floor(fill*100),
      ticket, gross, crew, travelCost:show.travelCost, labelCut, net,
    });
    if (s.tourHistory.length>50) s.tourHistory.length=50;
    const sfNote = sfG > 0 ? ` · +${fmt(sfG)} superfans` : "";
    const setlistNote = setlistSatisfaction ? ` · Setlist: ${setlistSatisfaction.label}` : "";
    s.log.unshift({week:s.week,msg:`Show: ${show.cityName} @ ${show.venueName} — ${Math.floor(fill*100)}% full, ${fmtMoney(net)} net${sfNote}${setlistNote}`,type:net>0?"good":"bad"});
    s.tourActive.progress++;
    notifMsg=`${show.cityName}: ${seats} fans · ${fmtMoney(net)} net${setlistNote}`;
    notifType=net>0?"great":"bad";
    if (s.tourActive.progress>=s.tourActive.shows.length) {
      // Build tour wrap presentation before clearing tourActive
      const tourShows = s.tourActive.shows;
      const completedCount = s.tourActive.progress;
      const recentHistory = (s.tourHistory ?? []).slice(0, completedCount);
      const totalGross = recentHistory.reduce((a, h) => a + h.gross, 0);
      const totalExp   = recentHistory.reduce((a, h) => a + (h.crew ?? 0) + h.travelCost + h.labelCut, 0);
      const totalNet   = recentHistory.reduce((a, h) => a + h.net, 0);
      const avgFill    = recentHistory.length > 0 ? recentHistory.reduce((a, h) => a + h.attendancePct, 0) / recentHistory.length : 0;
      const bestH  = recentHistory.length > 0 ? recentHistory.reduce((a, b) => b.net > a.net ? b : a) : null;
      const worstH = recentHistory.length > 1 ? recentHistory.reduce((a, b) => b.attendancePct < a.attendancePct ? b : a) : null;
      const cityList = tourShows.map(sh => sh.cityName);
      const tourName = cityList.length > 3
        ? `${cityList[0]} → ${cityList[Math.floor(cityList.length / 2)]} → ${cityList[cityList.length - 1]}`
        : cityList.join(" → ");
      const wrap: TourWrapPresentation = {
        tourName,
        cities: cityList,
        completedShows: recentHistory.length,
        cancelledShows: Math.max(0, completedCount - recentHistory.length),
        grossRevenue: totalGross,
        totalExpenses: totalExp,
        netProfit: totalNet,
        avgFill: Math.round(avgFill),
        bestShow: bestH ? { city: bestH.cityName, venue: bestH.venueName, attendancePct: bestH.attendancePct, net: bestH.net } : null,
        worstShow: worstH ? { city: worstH.cityName, venue: worstH.venueName, attendancePct: worstH.attendancePct, net: worstH.net } : null,
        week: s.week,
      };
      s.tourWrapPresentation = wrap;
      s.tourActive=null;
      s.log.unshift({week:s.week,msg:"Tour complete!",type:"great"});
    }
    // Each show on the road burns you down a notch.
    s.burnout = Math.min(100, (s.burnout ?? 0) + 4);
    } // end else (cancellation branch closed)
  }

  // ── Opening Act Progress ──
  if (s.activeOpeningAct && s.activeOpeningAct.expiresWeek <= s.week) {
    s.activeOpeningAct = null;
    s.openingActProgress = 0;
    s.log.unshift({ week: s.week, msg: "Opening act slot expired.", type: "neutral" });
  }

  // ── Festival Performance Check ──
  if (s.festivalBookings) {
    for (const booking of s.festivalBookings) {
      if (!booking.completed && booking.performanceWeek === s.week) {
        // Perform at festival!
        const fest = FESTIVALS.find(f => f.id === booking.festivalId);
        if (fest) {
          s.money += booking.pay;
          s.totalEarned += booking.pay;
          const fanGain = Math.floor(booking.fanExposure * (1 + s.fame / 100));
          s.fans += fanGain;
          s.fame = clamp(s.fame + 3, 0, 100);
          s.rep = clamp(s.rep + 2, 0, 100);
          booking.completed = true;
          if (!s.completedFestivals) s.completedFestivals = [];
          s.completedFestivals.push(fest.id);
          s.log.unshift({ week: s.week, msg: `🎪 ${fest.name}: Performed on the ${booking.stage} stage! +${fmtMoney(booking.pay)} · +${fmt(fanGain)} fans`, type: "great" });
          s.pendingEvent = { msg: `Played ${fest.name}! ${fmtMoney(booking.pay)} payday.`, type: "gold" };
        }
      }
    }
    // Clean up completed bookings older than 4 weeks
    s.festivalBookings = s.festivalBookings.filter(b => !b.completed || s.week - b.bookedWeek < 4);
  }

  // ── Generate Opening Act Offers ──
  if (!s.pendingOpeningActOffers) s.pendingOpeningActOffers = [];
  // Clean expired offers
  s.pendingOpeningActOffers = s.pendingOpeningActOffers.filter(o => o.expiresWeek > s.week);
  // Generate new offers (max 2 pending)
  if (s.pendingOpeningActOffers.length < 2 && !s.activeOpeningAct && Math.random() < 0.12) {
    const offer = generateOpeningActOffer(s);
    if (offer) {
      s.pendingOpeningActOffers.push(offer);
      s.log.unshift({ week: s.week, msg: `📨 Opening act offer from ${offer.headlinerName}: ${offer.showsCount} shows, ${fmtMoney(offer.payPerShow)}/show`, type: "good" });
    }
  }

  // ── Generate Festival Offers ──
  if (!s.pendingFestivalOffers) s.pendingFestivalOffers = [];
  const newFestivals = generateFestivalOffers(s);
  if (newFestivals.length > 0) {
    s.pendingFestivalOffers = [...s.pendingFestivalOffers, ...newFestivals];
    for (const fest of newFestivals) {
      s.log.unshift({ week: s.week, msg: `🎪 Festival booking offer: ${fest.festivalName} (${fest.stage} stage) — ${fmtMoney(fest.pay)}`, type: "good" });
    }
  }
  // Clean old festival offers
  s.pendingFestivalOffers = s.pendingFestivalOffers.filter(f => f.performanceWeek > s.week && !f.completed);

  // ── Tour Morale Recovery (when not on tour) ──
  if (!s.tourActive) {
    s.tourMorale = Math.min(100, s.tourMorale + 5);
  }

// Merch shop weekly sales
  if (!s.merchShop) s.merchShop = [];
  if (s.totalMerchRevenue === undefined) s.totalMerchRevenue = 0;
  let merchProfitWeek = 0;
  let merchUnitsWeek = 0;
  for (const item of s.merchShop) {
    if (!item.active) {
      item.weeklySales.push(0);
      if (item.weeklySales.length > 52) item.weeklySales.shift();
      continue;
    }
    const tmpl = MERCH_TEMPLATES.find(t => t.type === item.type);
    const pop = tmpl?.popularity ?? 1;
    // Casuals buy modestly; superfans buy ~8× more (collectors, completists).
    const sf = s.superfans ?? 0;
    const casuals = Math.max(0, s.fans - sf);
    const base = (casuals * 0.003) + (sf * 0.025) + (s.fame * 0.5) + (s.hype * 0.3);
    let mult = pop * (0.7 + Math.random() * 0.6);
    if (item.tiedToReleaseId) {
      const rel = s.catalog.find(c => c.id === item.tiedToReleaseId);
      if (rel) {
        const weeksSince = s.week - rel.releasedWeek;
        if (weeksSince <= 6) mult *= 1.6;
        else if (weeksSince <= 16) mult *= 1.2;
        mult *= 1 + Math.min(0.5, rel.weeklyStreams / 50000);
      }
    }
    const merchAge = s.week - item.releasedWeek;
    if (merchAge > 6) mult *= Math.max(0.45, 1 - (merchAge - 6) * 0.035);
    const expected = tmpl?.basePrice ?? 20;
    const priceMult = priceDemandMultiplier(item.price, expected);
    const sold = Math.max(0, Math.floor(base * mult * priceMult));
    item.weeklySales.push(sold);
    if (item.weeklySales.length > 52) item.weeklySales.shift();
    item.totalSold += sold;
    const revenue = sold * (item.price - item.cost);
    item.totalRevenue += revenue;
    merchProfitWeek += revenue;
    merchUnitsWeek += sold;
    // Occasional fan review
    if (sold > 0 && Math.random() < Math.min(0.45, 0.1 + sold / 80)) {
      const r = Math.random();
      const qualityScore = (item.price <= expected ? 0.25 : 0) + (s.rep / 200);
      let mood: "great"|"good"|"mixed"|"bad";
      if (r < 0.10 - qualityScore*0.15) mood = "bad";
      else if (r < 0.32 - qualityScore*0.10) mood = "mixed";
      else if (r < 0.70) mood = "good";
      else mood = "great";
      item.reviews.unshift(generateMerchReview(mood, s.week));
      if (item.reviews.length > 30) item.reviews.length = 30;
    }
  }
  if (merchProfitWeek !== 0) {
    s.money += merchProfitWeek;
    s.totalEarned += Math.max(0, merchProfitWeek);
    s.totalMerchRevenue += merchProfitWeek;
    if (merchUnitsWeek > 0 && Math.random() < 0.30) {
      s.log.unshift({ week: s.week, msg: `Merch: ${fmt(merchUnitsWeek)} units sold · ${fmtMoney(merchProfitWeek)} profit`, type: merchProfitWeek > 0 ? "good" : "neutral" });
    }
  }

  // Feature requests — established artists periodically reach out asking YOU to guest.
  // Cooldown prevents spamming; only one pending at a time. Decrement existing deadlines first.
  if (!s.pendingFeatureRequests) s.pendingFeatureRequests = [];
  if (s.pendingFeatureRequests.length) {
    s.pendingFeatureRequests = s.pendingFeatureRequests
      .map(r => ({ ...r, weeksToRespond: r.weeksToRespond - 1 }))
      .filter(r => {
        if (r.weeksToRespond <= 0) {
          const f = getFeature(r.featureId);
          s.log.unshift({ week:s.week, msg:`Missed feature window from ${f?.name ?? "an artist"}.`, type:"neutral" });
          return false;
        }
        return true;
      });
  }
  if (
    !s.pendingFeatureRequests.length &&
    (s.cooldowns["feat_req"] ?? 0) <= 0 &&
    !s.pendingScenarioId &&
    !s.pendingLabelOffers.length &&
    !s.pendingManagerOffers.length &&
    Math.random() < 0.15
  ) {
    const req = generateFeatureRequest(s);
    if (req) {
      s.pendingFeatureRequests = [req];
      s.cooldowns["feat_req"] = 6; // baseline gap even if dismissed
    }
  }

  // Random scenario event (interactive — pause for player choice)
  if (!s.pendingScenarioId && !notifMsg && !s.pendingFeatureRequests.length && Math.random() < 0.20) {
    const eligible = RANDOM_SCENARIOS.filter(sc => {
      const t = sc.trigger;
      if (!t) return true;
      if (t.minFame     !== undefined && s.fame          < t.minFame)     return false;
      if (t.maxFame     !== undefined && s.fame          > t.maxFame)     return false;
      if (t.minReleases !== undefined && s.totalReleases < t.minReleases) return false;
      if (t.minMoney    !== undefined && s.money         < t.minMoney)    return false;
      if (t.minFans     !== undefined && s.fans          < t.minFans)     return false;
      if (t.minRep      !== undefined && s.rep           < t.minRep)      return false;
      if (t.hasLabel    !== undefined && t.hasLabel      !== !!s.currentLabel) return false;
      return true;
    });
    if (eligible.length > 0) {
      const tot = eligible.reduce((sum, sc) => sum + sc.weight, 0);
      let r = Math.random() * tot;
      const chosen = eligible.find(sc => { r -= sc.weight; return r <= 0; }) ?? eligible[0];
      s.pendingScenarioId = chosen.id;
    }
  }

  // ── Sync Licensing Offers ──
  if (!s.pendingSyncOffers) s.pendingSyncOffers = [];
  s.pendingSyncOffers = s.pendingSyncOffers
    .filter(o => o.weeksToRespond > 0)
    .map(o => ({ ...o, weeksToRespond: o.weeksToRespond - 1 }));
  if (s.catalog.length > 0 && s.fame >= 15 && Math.random() < 0.15) {
    const newSyncs = generateSyncOffers(s);
    if (newSyncs.length) {
      s.pendingSyncOffers = [...s.pendingSyncOffers, ...newSyncs];
      for (const sync of newSyncs) {
        s.log.unshift({ week: s.week, msg: `📺 Sync offer: ${sync.showName} wants "${sync.songTitle}" — ${fmtMoney(sync.payout)}`, type: "good" });
      }
    }
  }

  if (s.week%4===0) {
    s.trends.Country=0.8+Math.random()*0.5; s.trends.Blues=0.8+Math.random()*0.5;
    // Rotate the trending album theme — what Nashville is currently into.
    s.currentTrendTheme = pickTrendTheme(s.currentTrendTheme);
    try {
      const issue = generateNashvilleTimes(s);
      const json = JSON.stringify(issue);
      s.pendingNewspaperJson = json;
      if (!s.newspaperArchive) s.newspaperArchive = [];
      s.newspaperArchive.unshift(json);
      if (s.newspaperArchive.length > 36) s.newspaperArchive.length = 36;
    } catch { /* non-fatal */ }
  }

  const wonAward=runAwardCheck(s);
  if (wonAward) {
    notifMsg=`Award: ${wonAward.name}`;
    notifType="gold";
    const ap: AwardPresentation = {
      id: wonAward.id, name: wonAward.name, desc: wonAward.desc,
      famePerk: wonAward.famePerk, repPerk: wonAward.repPerk, money: wonAward.money,
      week: s.week,
    };
    s.awardPresentation = ap;
  }

  // Career tier milestone check
  const newTierIdx = getCareerTierIdx(s.fame);
  if (newTierIdx > (s.lastCareerTierIdx ?? 0) && newTierIdx > 0) {
    s.lastCareerTierIdx = newTierIdx;
    const tierDef = CAREER_TIERS[newTierIdx];
    const mp: CareerMilestonePresentation = {
      tier: tierDef, fans: s.fans, fame: s.fame, rep: s.rep, week: s.week,
    };
    s.milestonePresentation = mp;
  }

  if (notifMsg) s.pendingEvent={msg:notifMsg,type:notifType};

  // Casual fans drift away when there's nothing new to keep them engaged.
  // Superfans don't churn from inactivity — that's what makes them super.
  if (s.weeksSinceRelease > 8 && !s.tourActive) {
    const sf = s.superfans ?? 0;
    const casuals = Math.max(0, s.fans - sf);
    const churn = Math.floor(casuals * 0.005);
    if (churn > 0) s.fans = Math.max(sf, s.fans - churn);
  }
  // Invariant: superfans can never exceed total fans (negative scenarios may
  // have reduced s.fans below s.superfans).
  s.superfans = Math.max(0, Math.min(s.superfans ?? 0, s.fans));

  s.weeklyExpenses = Math.max(380, 340 + s.fans*0.008 + s.fame*6 + (s.totalShows*0.12));

  // ── #4 Rivals + #5 Story Arcs (tick after all base sim updates) ──
  // Order matters: tick rivals first (may add log entries), then arcs (may
  // raise pendingArcChoice modal), then maybe spawn a new arc.
  tickRivals(s);
  refreshInboundOffers(s);
  tickArcs(s);
  maybeSpawnArc(s);

  saveToDisk(s);
  return s;
}

// ─── HOOK ─────────────────────────────────────────────────
export function useGameState() {
  const [state,setState] = useState<GameState>(()=>{
    const saved=loadFromDisk();
    if (saved) return {
      ...saved,
      ...migrateMarketState(saved),
      hasSave:true,
      pendingEvent:null,
      modal:null,
      // Migrate older saves that pre-date the album-theme + producer-relationship systems.
      themeCounts: saved.themeCounts ?? {},
      currentTrendTheme: saved.currentTrendTheme ?? pickTrendTheme(null),
      producerWorkCounts: saved.producerWorkCounts ?? {},
      // Migrate older saves to the rich label/manager system.
      currentLabel: saved.currentLabel ?? (saved.labelSigned ? {
        labelId:"legacy", name:"Legacy Major Label", exec:"Your A&R Rep",
        streamingCut:0.18, tourGrossCut:0.10, marketingBoost:1.3,
        advance:0, advanceRecouped:0, recordingFund:0, recordingFundUsed:0,
        royaltyRate:0.15, recoupRate:1.0, merchCut:0, syncCut:0, publishingCut:0,
        marketingCommitment:0, marketingSpendYTD:0, albumsCommitted:1, albumsDelivered:0,
        optionsRemaining:0, optionWeeks:52, weeksLeft:104, totalWeeks:104,
        signedAtWeek:saved.week ?? 0, totalAdvance:0,
        crossCollateralization:false, controlledComposition:1.0, controlledCompositionCap:12,
        suspensionRights:false, keyPersonClause:false, creativeControl:50, approvalRights:[],
        isRecouped:false, perks:[], type:"indie" as const,
        approvalStrikes:0, campaignFrozen:false,
      } : null),
      currentManager: saved.currentManager ?? (saved.hasManager ? {
        managerId:"legacy", name:"Your Manager",
        weeklyFee:75, showRevPct:0.15, brandDealBoost:1.0, repPerWeek:0,
        signedAtWeek:saved.week ?? 0,
      } : null),
      pendingLabelOffers: saved.pendingLabelOffers ?? [],
      pendingManagerOffers: saved.pendingManagerOffers ?? [],
      currentPublishing: saved.currentPublishing ?? null,
      pendingPublishingOffers: saved.pendingPublishingOffers ?? [],
      pendingSyncOffers: saved.pendingSyncOffers ?? [],
      selloutScore: saved.selloutScore ?? 0,
      totalPublishingRevenue: saved.totalPublishingRevenue ?? 0,
      pendingLabelSubmission: saved.pendingLabelSubmission ?? null,
      pendingReissue: saved.pendingReissue ?? null,
      campaignLiveBoost: saved.campaignLiveBoost ?? 0,
      campaignLiveBoostWeeks: saved.campaignLiveBoostWeeks ?? 0,
      campaignRadioBoost: saved.campaignRadioBoost ?? 0,
      campaignRadioBoostWeeks: saved.campaignRadioBoostWeeks ?? 0,

      // Feature artist system (added in v1.x)
      pendingFeatureRequests: saved.pendingFeatureRequests ?? [],
      guestCredits: saved.guestCredits ?? [],
      featureWorkCounts: saved.featureWorkCounts ?? {},
      // Casuals/Superfans split (added in v1.x). Backfill ~5% of the existing
      // fanbase as superfans so legacy careers don't read "0 superfans" jarringly.
      superfans: saved.superfans ?? Math.floor((saved.fans ?? 0) * 0.05),
      // ── #3 Burnout / #4 Rivals / #5 Story Arcs (added in v1.x) ──
      // Legacy saves: burnout starts at 0, rivals get seeded so the scene
      // isn't empty when an old career loads in.
      burnout: saved.burnout ?? 0,
      vacationCooldown: saved.vacationCooldown ?? 0,
      rivals: (saved.rivals && saved.rivals.length) ? saved.rivals : seedRivals(saved.fame ?? 0),
      activeArcs: saved.activeArcs ?? [],
      completedArcs: saved.completedArcs ?? [],
      pendingArcChoice: saved.pendingArcChoice ?? null,
    };
    return {...INITIAL_STATE};
  });

  const hasSave = !!loadFromDisk();

  const upd = useCallback((fn:(s:GameState)=>GameState)=>{
    setState(prev=>{ const next=fn(JSON.parse(JSON.stringify(prev))); saveToDisk(next); return next; });
  },[]);

  const goToMenu  = useCallback(()=>setState(p=>({...p,screen:"menu"})),[]);
  const goToSetup = useCallback(()=>setState(p=>({...p,screen:"setup"})),[]);
  const loadGame  = useCallback(()=>{ const s=loadFromDisk(); if(s) setState({
    ...s, hasSave:true, pendingEvent:null, modal:null,
    ...migrateMarketState(s),
    themeCounts: s.themeCounts ?? {},
    currentTrendTheme: s.currentTrendTheme ?? pickTrendTheme(null),
    producerWorkCounts: s.producerWorkCounts ?? {},
      currentLabel: s.currentLabel ?? (s.labelSigned ?? false ? {
        labelId:"legacy", name:"Legacy Major Label", exec:"Your A&R Rep",
         streamingCut:0.18, tourGrossCut:0.10, marketingBoost:1.3,
        advance:0, advanceRecouped:0, recordingFund:0, recordingFundUsed:0,
        royaltyRate:0.15, recoupRate:1.0, merchCut:0, syncCut:0, publishingCut:0,
        marketingCommitment:0, marketingSpendYTD:0, albumsCommitted:1, albumsDelivered:0,
        optionsRemaining:0, optionWeeks:52, weeksLeft:104, totalWeeks:104,
        signedAtWeek:s.week ?? 0,
        crossCollateralization:false, controlledComposition:1.0, controlledCompositionCap:12,
        suspensionRights:false, keyPersonClause:false, creativeControl:50, approvalRights:[],
        isRecouped:false, perks:[], type:"indie" as const,
        approvalStrikes:0, campaignFrozen:false,
      } : null),
    currentManager: s.currentManager ?? (s.hasManager ? {
      managerId:"legacy", name:"Your Manager",
      weeklyFee:75, showRevPct:0.15, brandDealBoost:1.0, repPerWeek:0,
      signedAtWeek:s.week ?? 0,
    } : null),
    pendingLabelOffers: s.pendingLabelOffers ?? [],
    pendingManagerOffers: s.pendingManagerOffers ?? [],
    currentPublishing: s.currentPublishing ?? null,
    pendingPublishingOffers: s.pendingPublishingOffers ?? [],
    pendingSyncOffers: s.pendingSyncOffers ?? [],
    selloutScore: s.selloutScore ?? 0,
    totalPublishingRevenue: s.totalPublishingRevenue ?? 0,
    pendingLabelSubmission: s.pendingLabelSubmission ?? null,
    pendingReissue: s.pendingReissue ?? null,
    campaignLiveBoost: s.campaignLiveBoost ?? 0,
    campaignLiveBoostWeeks: s.campaignLiveBoostWeeks ?? 0,
    campaignRadioBoost: s.campaignRadioBoost ?? 0,
    campaignRadioBoostWeeks: s.campaignRadioBoostWeeks ?? 0,

    pendingFeatureRequests: s.pendingFeatureRequests ?? [],
    guestCredits: s.guestCredits ?? [],
    featureWorkCounts: s.featureWorkCounts ?? {},
    superfans: s.superfans ?? Math.floor((s.fans ?? 0) * 0.05),
    burnout: s.burnout ?? 0,
    vacationCooldown: s.vacationCooldown ?? 0,
    rivals: (s.rivals && s.rivals.length) ? s.rivals : seedRivals(s.fame ?? 0),
    activeArcs: s.activeArcs ?? [],
    completedArcs: s.completedArcs ?? [],
    pendingArcChoice: s.pendingArcChoice ?? null,
      // ── Touring Features v2.0 migration ──
      setlistConfig: s.setlistConfig ?? { deepCutCount: 1, hitCount: 4, newMaterialCount: 1, totalSlots: 6 },
      venueReputations: s.venueReputations ?? {},
      tourMorale: s.tourMorale ?? 100,
      pendingOpeningActOffers: s.pendingOpeningActOffers ?? [],
      activeOpeningAct: s.activeOpeningAct ?? null,
      openingActProgress: s.openingActProgress ?? 0,
      festivalBookings: s.festivalBookings ?? [],
      pendingFestivalOffers: s.pendingFestivalOffers ?? [],
      completedFestivals: s.completedFestivals ?? [],
      lastBusBreakdownWeek: s.lastBusBreakdownWeek ?? 0,
  }); },[]);
  const clearSave = useCallback(()=>{ try{localStorage.removeItem(SAVE_KEY);}catch{} setState({...INITIAL_STATE}); },[]);

  const startNewGame = useCallback((name:string,genre:Genre,city:string,archetype:string)=>{
    const s:GameState={...INITIAL_STATE,screen:"game",hasSave:false,artistName:name,genre,city,archetype,
      qualityBase:archHas(archetype,"acousticQBonus")?35+archVal(archetype):35,
      trends:{Country:0.8+Math.random()*0.5,Blues:0.8+Math.random()*0.5},
      themeCounts:{},
      currentTrendTheme: pickTrendTheme(null),
      producerWorkCounts:{},
      regional:{[city]:0},
      // Seed the scene with rival artists (#4) so the world feels populated
      // from week 1. They'll release, beef, and chart in parallel.
      rivals: seedRivals(0),
      currentPublishing: null,
      pendingPublishingOffers: [],
      pendingSyncOffers: [],
      selloutScore: 0,
      totalPublishingRevenue: 0,

    };
    saveToDisk(s); setState(s);
  },[]);

  const doAdvance       = useCallback(()=>setState(prev=>advance(prev)),[]);
  const doDismissEvent     = useCallback(()=>upd(s=>{s.pendingEvent=null;return s;}),[upd]);
  const dismissModal       = useCallback(()=>upd(s=>{s.modal=null;return s;}),[upd]);
  const dismissNewspaper   = useCallback(()=>upd(s=>{s.pendingNewspaperJson=null;return s;}),[upd]);
  const openArchivedNewspaper = useCallback((json:string)=>upd(s=>{s.pendingNewspaperJson=json;return s;}),[upd]);

  // Project
  const doStartProject = useCallback((type:ReleaseType, mode:RecordingMode="standard")=>upd(s=>{
    // Dynamic recording time: base weeks + track count × studio × producer × mode
    const mint:Record<string,number>={Single:1,EP:3,Album:8,"Live Album":4};
    const maxt:Record<string,number>={Single:1,EP:6,Album:16,"Live Album":8};
    const trackCount = mint[type] ?? 1;
    const w = calculateRecordingWeeks(type, trackCount, "home_studio", "self", mode);
    s.project={type,genre:s.genre,producerId:"self",studioId:"home_studio",title:genAlbumName(s.artistName),tracks:[],weeksLeft:w,totalWeeks:w,minTracks:mint[type]??1,maxTracks:maxt[type]??1,marketingBudget:0,mode,pipelineStage:"writing",labelFunding:false};
    s.log.unshift({week:s.week,msg:`Started recording a new ${type}. ${w} weeks in the studio.`,type:"neutral"});
    return s;
  }),[upd]);

  const doUpdateProject = useCallback((ch:Partial<GameState["project"]>)=>upd(s=>{
    if (!s.project || !ch) return s;
    const p = s.project;

    // ── Charge cost deltas upfront when producer or studio is swapped ──
    // Producer fees apply the relationship discount (built up from past projects).
    let delta = 0;
    let blockMsg: string | null = null;

    if (ch.producerId && ch.producerId !== p.producerId) {
      const oldProd = PRODUCERS.find(pr => pr.id === p.producerId);
      const newProd = PRODUCERS.find(pr => pr.id === ch.producerId);
      const oldEff = oldProd ? getProducerEffectiveCost(oldProd, s.producerWorkCounts) : 0;
      const newEff = newProd ? getProducerEffectiveCost(newProd, s.producerWorkCounts) : 0;
      delta += newEff - oldEff;
    }
    // Studio fees are paid weekly during recording — no upfront delta for studio swaps.

    const useLabelFund = !!((ch.labelFunding ?? p.labelFunding) && s.currentLabel && !s.currentLabel.fundingFrozen);
    const fundAvailable = useLabelFund && s.currentLabel
      ? Math.max(0, s.currentLabel.recordingFund - s.currentLabel.recordingFundUsed)
      : 0;
    const cashRequired = Math.max(0, delta - fundAvailable);
    if (delta > 0 && s.money < cashRequired) {
      const newProd = ch.producerId ? PRODUCERS.find(pr => pr.id === ch.producerId) : null;
      const newStudio = ch.studioId ? getStudio(ch.studioId) : null;
      const target = newProd?.name ?? newStudio?.name ?? "this upgrade";
      blockMsg = `Need ${fmtMoney(cashRequired)} more to book ${target} after label funding.`;
    }

    if (blockMsg) {
      s.pendingEvent = { msg: blockMsg, type: "bad" };
      return s;
    }
    if (delta > 0) {
      const fromFund = Math.min(fundAvailable, delta);
      if (fromFund && s.currentLabel) s.currentLabel.recordingFundUsed += fromFund;
      s.money -= delta - fromFund;
      if (fromFund) s.log.unshift({week:s.week,msg:`${fmtMoney(fromFund)} producer cost covered by the label recording fund.`,type:"neutral"});
    } else if (delta < 0) {
      s.money -= delta;
    }

    // Apply the partial update first
    s.project = { ...s.project, ...ch } as GameState["project"];

    // ── Recalculate weeks if studio, producer, or mode changed ──
    const needsRecalc = ch.studioId !== undefined || ch.producerId !== undefined || ch.mode !== undefined;
    if (needsRecalc && s.project) {
      recalculateProjectWeeks(s.project);
    }

    return s;
  }),[upd]);

  const doAddTrack = useCallback((
    name:string,
    opts?: { featId?: string; cowriterId?: string }
  )=>upd(s=>{
    if (!s.project||s.project.tracks.length>=s.project.maxTracks) return s;
    // featId and cowriterId are mutually exclusive — featId wins if both given.
    const featId = opts?.featId || undefined;
    const cowriterId = featId ? undefined : (opts?.cowriterId || undefined);
    s.project.tracks.push({
      name,
      featId,
      cowriterId,
      // Conservative defaults if caller doesn't pass — matches the legacy
      // fallback used in computeTrackWritingQuality so behavior is consistent.
      development: createTrackDevelopment(),
    });
    recalculateProjectWeeks(s.project);
    return s;
  }),[upd]);

  const doRemoveTrack = useCallback((i:number)=>upd(s=>{
    if (!s.project) return s;
    s.project.tracks.splice(i,1);
    recalculateProjectWeeks(s.project);
    return s;
  }),[upd]);

  const doAutoGenerateTracks = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    const p = s.project;
    const remaining = p.maxTracks - p.tracks.length;
    if (remaining <= 0) return s;
    for (let i = 0; i < remaining; i++) {
      p.tracks.push({
        name: genThemedTrackName(p.themeId),
        development: createTrackDevelopment(),
      });
    }
    recalculateProjectWeeks(p);
    s.log.unshift({week:s.week,msg:`Auto-generated ${remaining} track${remaining===1?"":"s"} for "${p.title}".`,type:"neutral"});
    return s;
  }),[upd]);

  const doConfigureTrackStage = useCallback((
    index: number,
    stage: SongDevelopmentStage,
    direction: SongDirection,
    investment: SessionInvestment,
    collaborator?: { featId?: string; cowriterId?: string },
  )=>upd(s=>{
    const project = s.project;
    if (!project || getProjectPipelineStage(project) !== stage) return s;
    const track = project.tracks[index];
    if (!track) return s;
    const development = getTrackDevelopment(track);
    if (development[stage].completed) return s;
    development[stage] = {
      ...development[stage], direction, investment, riskQuality: undefined, riskAppeal: undefined,
    };
    track.development = development;
    if (stage === "writing" && collaborator) {
      track.cowriterId = collaborator.cowriterId || undefined;
      track.featId = track.cowriterId ? undefined : (collaborator.featId || undefined);
    }
    recalculateProjectWeeks(project);
    return s;
  }),[upd]);

  const doFinishProject = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    const p=s.project;
    if (p.weeksLeft > 0) {
      s.pendingEvent = { msg: `Recording still in progress — ${p.weeksLeft} week${p.weeksLeft === 1 ? "" : "s"} left.`, type: "bad" };
      return s;
    }
    if (getProjectPipelineStage(p) !== "complete") {
      s.pendingEvent = { msg: "Complete writing, recording, and mix passes for every track first.", type: "bad" };
      return s;
    }
    let qualitySum = 0;
    let appealSum = 0;
    let coWriteCount = 0;
    for (const track of p.tracks) {
      const rating = resolveTrackRating(s, p, track);
      const development = getTrackDevelopment(track);
      development.stage = "complete";
      development.qualityRating = rating.quality;
      development.appealRating = rating.appeal;
      development.qualityBreakdown = rating.qualityBreakdown;
      development.appealBreakdown = rating.appealBreakdown;
      track.development = development;
      track.quality = rating.quality * 10;
      qualitySum += rating.quality;
      appealSum += rating.appeal;
      if (track.cowriterId) coWriteCount++;
    }
    const avgTrackQuality = p.tracks.length ? qualitySum / p.tracks.length : 1;
    const avgTrackAppeal = p.tracks.length ? appealSum / p.tracks.length : 1;
    const avgQuality = Number((avgTrackQuality * 10).toFixed(1));
    const avgAppeal = Number(avgTrackAppeal.toFixed(1));
    const producer = PRODUCERS.find(item => item.id === p.producerId);
    if (producer && producer.id !== "self") {
      s.producerWorkCounts ??= {};
      s.producerWorkCounts[producer.id] = (s.producerWorkCounts[producer.id] ?? 0) + 1;
    }
    for (const track of p.tracks) {
      if (!track.cowriterId) continue;
      s.featureWorkCounts ??= {};
      s.featureWorkCounts[track.cowriterId] = (s.featureWorkCounts[track.cowriterId] ?? 0) + 1;
    }
    const burnAdd = p.type === "Live Album" ? 8 : p.type === "Album" ? 18 : p.type === "EP" ? 10 : 5;
    s.burnout = Math.min(100, (s.burnout ?? 0) + burnAdd);
    s.qualityBase = Math.min(95, s.qualityBase + roll(1,4));
    s.unreleased.push({
      id: "p" + Date.now(), type: p.type, genre: p.genre, title: p.title,
      producerId: p.producerId, studioId: p.studioId, themeId: p.themeId, tracks: p.tracks,
      avgQuality, avgAppeal, hypeSnapshot: s.hype, marketingBudget: p.marketingBudget,
    });
    s.project = null;
    const notes = [coWriteCount ? `${coWriteCount} co-write${coWriteCount === 1 ? "" : "s"}` : "", avgTrackAppeal >= 7 ? "strong commercial pull" : ""].filter(Boolean);
    s.pendingEvent = { msg: `"${p.title}" is recorded — ${avgTrackQuality.toFixed(1)}/10 quality, ${avgAppeal.toFixed(1)}/10 appeal.${notes.length ? ` (${notes.join(" · ")})` : ""}`, type: "great" };
    return s;

    /* Legacy release-level quality calculation retained for migration reference.
    const prod=PRODUCERS.find(pr=>pr.id===p.producerId);
    const studio=getStudio(p.studioId);
    // Studio fees paid weekly during recording. Producer fees paid upfront via doUpdateProject.
    // Only feature artists are paid here, since they're per-track and added late.
    for (const t of p.tracks) {
      if (t.featId) {
        const f = FEATURES.find(x=>x.id===t.featId);
        if (f) {
          const c = getFeatureEffectiveCost(f, s.featureWorkCounts, featCostMult(s.archetype));
          if (s.money < c) { s.pendingEvent={msg:`Can't pay ${f.name}.`,type:"bad"}; return s; }
          s.money -= c;
          if (!s.featureWorkCounts) s.featureWorkCounts = {};
          s.featureWorkCounts[f.id] = (s.featureWorkCounts[f.id] ?? 0) + 1;
        }
      }
    }
    // ── PRODUCER RELATIONSHIP + SPECIALTY BONUSES ──
    // Relationship: repeated work with the same producer adds a flat quality bump.
    const rel = prod ? getProducerRelationship(prod.id, s.producerWorkCounts) : null;
    const relQ = rel?.qBonus ?? 0;
    // Specialty: producer's stylistic strengths align with the album's theme.
    let specQ = 0;
    let specNote = "";
    if (prod && p.themeId) {
      const themes = PRODUCER_THEMES[prod.id] ?? [];
      if (themes.includes(p.themeId)) {
        specQ = PRODUCER_SPECIALTY_QUALITY_BONUS;
        specNote = ` · ${prod.specialty} fits the theme`;
      }
    }

    // ── SONGWRITING QUALITY (per-track) ──
    // Each track contributes its own writing quality (hook + lyric + cowriter +
    // producer-style affinity), then we average across tracks. Per-track variance
    // means an Experimental album swings harder than a Safe one.
    let trackQSum = 0;
    let cowriteCount = 0;
    let experimentalWins = 0;
    let experimentalLosses = 0;
    for (const t of p.tracks) {
      const wq = computeTrackWritingQuality(t);
      const psb = producerStyleBonus(prod, t);
      // Symmetric variance window: -variance .. +variance
      const qRoll = (Math.random() * 2 - 1) * wq.variance;
      trackQSum += wq.delta + psb + qRoll;
      // Track experimental outcomes for the recording-event flavor text.
      if ((t.hook ?? "safe") === "experimental") {
        if (qRoll + psb >= 3) experimentalWins++;
        else if (qRoll <= -3) experimentalLosses++;
      }
      if (t.cowriterId) cowriteCount++;
    }
    const writingAvgQ = p.tracks.length ? trackQSum / p.tracks.length : 0;

    // ── #3 Burnout: drained artists make worse records ──
    const burnPenalty = burnoutQualityPenalty(s.burnout ?? 0);
    // Each week the artist pushed through exhaustion costs 2 quality points
    const pushPenalty = -2 * (p.pushThroughCount ?? 0);
    if (pushPenalty < 0) {
      s.log.unshift({ week:s.week, msg:`Grinding through exhaustion hurt the recording (${pushPenalty.toFixed(0)} quality).`, type:"bad" });
    }

    // ── Recording mode quality & burnout modifiers ──
    const modeCfg = RECORDING_MODE_CONFIG[p.mode ?? "standard"];
    const modeQualityMod = modeCfg.qualityMod;
    let modeBurnoutAdd = 0;
    if (p.mode === "rush") {
      modeBurnoutAdd = 8; // One-time rush burnout hit
    } else if (p.mode === "deliberate") {
      const standardWeeks = getStandardRecordingWeeks(p.type, p.tracks.length, p.studioId, p.producerId);
      const extraWeeks = Math.max(0, p.totalWeeks - standardWeeks);
      modeBurnoutAdd = extraWeeks * 3; // +3 burnout per extra deliberate week
    }

    const baseQ=s.qualityBase+(prod?.qB??0)+(studio?.qB??0)+relQ+specQ+writingAvgQ+burnPenalty+pushPenalty+modeQualityMod;
    const adjQ=clamp(applyArchQuality(s.archetype,baseQ)+Math.random()*15-5,0,100);
    // Studio time itself accumulates burnout (longer formats = more burnout).
    const burnAdd = p.type==="Live Album"?8 : p.type==="Album"?18 : p.type==="EP"?10 : 5;
    s.burnout = Math.min(100, (s.burnout ?? 0) + burnAdd + modeBurnoutAdd);
    if (burnPenalty < 0) {
      s.log.unshift({ week:s.week, msg:`Recording while exhausted hurt the result (${burnPenalty.toFixed(0)} quality).`, type:"bad" });
    }
    if (modeQualityMod !== 0) {
      s.log.unshift({ week:s.week, msg:`${modeCfg.label} mode: ${modeQualityMod > 0 ? "+" : ""}${modeQualityMod} quality.`, type: modeQualityMod > 0 ? "good" : "bad" });
    }
    if (modeBurnoutAdd > 0) {
      s.log.unshift({ week:s.week, msg:`${modeCfg.label} mode added ${modeBurnoutAdd} burnout.`, type:"neutral" });
    }
    s.qualityBase=Math.min(95,s.qualityBase+roll(1,4));
    s.unreleased.push({id:"p"+Date.now(),type:p.type,genre:p.genre,title:p.title,producerId:p.producerId,studioId:p.studioId,themeId:p.themeId,tracks:p.tracks,avgQuality:adjQ,hypeSnapshot:s.hype,marketingBudget:p.marketingBudget});

    // Bump the relationship counter (Home Studio doesn't count).
    if (prod && prod.id !== "self") {
      if (!s.producerWorkCounts) s.producerWorkCounts = {};
      s.producerWorkCounts[prod.id] = (s.producerWorkCounts[prod.id] ?? 0) + 1;
    }
    // Co-writers also build the FEATURE relationship counter (toward the 30%
    // discount tiers). They paid nothing — the work itself is the bond.
    for (const t of p.tracks) {
      if (t.cowriterId) {
        if (!s.featureWorkCounts) s.featureWorkCounts = {};
        s.featureWorkCounts[t.cowriterId] = (s.featureWorkCounts[t.cowriterId] ?? 0) + 1;
      }
    }
    void STUDIOS;
    s.project=null;
    // Flavor text: relationship + specialty + co-write count + experimental swings.
    const flavorBits: string[] = [];
    if (relQ > 0 && rel) flavorBits.push(rel.label.toLowerCase());
    if (specNote) flavorBits.push(specNote.replace(/^ · /, ""));
    if (cowriteCount > 0) flavorBits.push(`${cowriteCount} co-write${cowriteCount===1?"":"s"}`);
    if (experimentalWins >= 2) flavorBits.push("the risks paid off");
    else if (experimentalLosses >= 2) flavorBits.push("some swings missed");
    const flavor = flavorBits.length ? ` (${flavorBits.join(" · ")})` : "";
    s.pendingEvent={msg:`"${s.unreleased[s.unreleased.length-1].title}" recorded. Release when ready.${flavor}`,type:"great"};
    return s;
    */
  }),[upd]);

  const doSubmitLabelRelease = useCallback((projectId:string, leadTrackIndex:number, allocation:CampaignAllocation, releaseFormat?:ReleaseFormat)=>upd(s=>{
    const project = s.unreleased.find(item => item.id === projectId);
    const label = s.currentLabel;
    if (!project || !label || !labelRequiresReleaseApproval(label)) return s;
    const format = releaseFormat ?? getMarketEra(s.currentYear).formats[0];
    if (!project.tracks[leadTrackIndex] || !isValidCampaign(allocation) || !getMarketEra(s.currentYear).formats.includes(format)) {
      s.pendingEvent = { msg:"Set a valid lead single and a campaign allocation totaling 100%.", type:"bad" };
      return s;
    }
    const existing = s.pendingLabelSubmission;
    if (existing && existing.projectId !== projectId) {
      s.pendingEvent = { msg:`${label.name} is already reviewing another release.`, type:"bad" };
      return s;
    }
    s.pendingLabelSubmission = {
      projectId, leadTrackIndex, releaseFormat:format, allocation: {...allocation}, submittedWeek:s.week, reviewWeek:s.week + 1,
      revisionUsed: existing?.revisionUsed ?? false, status:"under_review",
    };
    s.log.unshift({ week:s.week, msg:`Submitted "${project.title}" to ${label.name} A&R. Review returns next week.`, type:"neutral" });
    s.pendingEvent = { msg:`A&R has "${project.title}". Check back in week ${s.week + 1}.`, type:"good" };
    return s;
  }),[upd]);

  const doReviseLabelSubmission = useCallback((projectId:string, leadTrackIndex:number, allocation:CampaignAllocation, releaseFormat?:ReleaseFormat)=>upd(s=>{
    const submission = s.pendingLabelSubmission;
    const label = s.currentLabel;
    if (!submission || !label || submission.projectId !== projectId || submission.status !== "revision_requested") return s;
    if (!s.unreleased.find(item => item.id === projectId)?.tracks[leadTrackIndex] || !isValidCampaign(allocation)) {
      s.pendingEvent = { msg:"Set a valid lead single and a campaign allocation totaling 100%.", type:"bad" };
      return s;
    }
    const format = releaseFormat ?? submission.releaseFormat ?? getMarketEra(s.currentYear).formats[0];
    if (!getMarketEra(s.currentYear).formats.includes(format)) return s;
    submission.leadTrackIndex = leadTrackIndex;
    submission.releaseFormat = format;
    submission.allocation = {...allocation};
    submission.submittedWeek = s.week;
    submission.reviewWeek = s.week + 1;
    submission.revisionUsed = true;
    submission.status = "under_review";
    submission.reviewNote = undefined;
    s.log.unshift({ week:s.week, msg:`Resubmitted "${s.unreleased.find(item => item.id === projectId)?.title}" after A&R notes.`, type:"neutral" });
    s.pendingEvent = { msg:`Revision submitted. Final A&R review returns in week ${s.week + 1}.`, type:"good" };
    return s;
  }),[upd]);

  const doReleaseProject = useCallback((id:string, leadTrackIndex?:number, campaign?:CampaignAllocation, approvalOverride=false, releaseFormat?:ReleaseFormat)=>upd(s=>{
    const idx=s.unreleased.findIndex(p=>p.id===id); if(idx<0) return s;
    const p=s.unreleased[idx];
    if (leadTrackIndex === undefined || !p.tracks[leadTrackIndex]) {
      s.pendingEvent = { msg: "Choose a lead single before releasing.", type: "bad" };
      return s;
    }
    const label = s.currentLabel;
    const submission = s.pendingLabelSubmission;
    const era = getMarketEra(s.currentYear);
    const format = releaseFormat ?? submission?.releaseFormat ?? (era.formats.includes("streaming") ? "streaming" : era.formats.includes("cd") ? "cd" : era.formats[0]);
    if (!era.formats.includes(format)) {
      s.pendingEvent = { msg:`${getReleaseFormat(format).label} is not available in the ${era.name} market.`, type:"bad" };
      return s;
    }
    const allocation = campaign ?? EMPTY_CAMPAIGN;
    if (label && !isValidCampaign(allocation)) {
      s.pendingEvent = { msg:"Campaign allocation must total 100%.", type:"bad" };
      return s;
    }
    const isThisSubmission = submission?.projectId === id;
    if (label && labelRequiresReleaseApproval(label)) {
      const approved = isThisSubmission && submission?.status === "approved";
      const canOverride = isThisSubmission && (submission?.status === "revision_requested" || submission?.status === "held");
      if (!approved && !(approvalOverride && canOverride)) {
        s.pendingEvent = { msg:"Submit this release to A&R before launching.", type:"bad" };
        return s;
      }
      const campaignChanged = !!campaign && Object.keys(campaign).some(key => campaign[key as keyof CampaignAllocation] !== submission!.allocation[key as keyof CampaignAllocation]);
      if (approved && (submission!.leadTrackIndex !== leadTrackIndex || campaignChanged)) {
        s.pendingEvent = { msg:"Approved campaigns cannot be changed. Submit a new campaign for review.", type:"bad" };
        return s;
      }
    }
    p.leadTrackIndex = leadTrackIndex;

    const campaignAllocation = label && isThisSubmission ? submission!.allocation : allocation;
    const campaignBase = label ? Math.floor(label.marketingCommitment / Math.max(1, label.albumsCommitted)) : 0;
    const plannedDeploymentPct = label && !label.campaignFrozen ? (approvalOverride ? 0.55 : 1) : 0;
    const campaignAvailable = label ? Math.max(0, label.marketingCommitment - label.marketingSpendYTD) : 0;
    const deployedCampaign = Math.min(Math.floor(campaignBase * plannedDeploymentPct), campaignAvailable);
    const deploymentPct = campaignBase > 0 ? deployedCampaign / campaignBase : 0;
    const labelMktBoost = label
      ? 1 + (label.marketingBoost - 1) * deploymentPct
      : (s.labelSigned ? 1.3 : 1);
    const streamingPush = 1 + (campaignAllocation.streaming / 100) * 0.30 * deploymentPct;
    const pressBonus = (campaignAllocation.press / 100) * 8 * deploymentPct;
    const radioFameBonus = Math.floor((campaignAllocation.radio / 25) * deploymentPct);
    const liveConversionBonus = (campaignAllocation.live / 100) * 0.012 * deploymentPct;

    // ── Market Saturation gate ──
    const sat = s.marketSaturation ?? 0;
    if (sat >= 90) {
      s.pendingEvent = { msg: "The market is burned out on you. Lay low for a few weeks before releasing.", type:"bad" };
      return s;
    }

    if (p.marketingBudget>0){if(s.money<p.marketingBudget){s.pendingEvent={msg:"Not enough for marketing.",type:"bad"};return s;}s.money-=p.marketingBudget;}
    const trend=s.trends[p.genre]??1; const q=p.avgQuality; const hype=p.hypeSnapshot;
    const lead = p.tracks[leadTrackIndex];
    const leadAppeal = getTrackDevelopment(lead).appealRating ?? (p.avgAppeal ?? 5);
    const avgAppeal = p.avgAppeal ?? 5;
    const leadWeight = p.type === "Single" ? 0.80 : p.type === "EP" ? 0.60 : p.type === "Live Album" ? 0.50 : 0.45;
    const launchAppeal = leadAppeal * leadWeight + avgAppeal * (1 - leadWeight);
    let score=p.type==="Single"?(q*0.32)+(launchAppeal*4.5)+(hype*0.4)+(trend*25):p.type==="EP"?(q*0.46)+(launchAppeal*3.8)+(hype*0.3)+(trend*20):p.type==="Live Album"?(q*0.42)+(launchAppeal*3.5)+(hype*0.2)+(s.rep*0.6)+(trend*15):(q*0.58)+(launchAppeal*3.2)+(hype*0.22)+(trend*16);
    score *= (era.genreDemand[p.genre] ?? 1) * getReleaseFormat(format).launchMult;
    // Market noise is intentionally small and separate from the stored song ratings.
    score*=roll(0.94,1.06);

    // ── ALBUM-THEME BONUSES ──
    // (a) Signature theme: if the player has built up an identity in this theme,
    //     fans and the press lean in. Bonus tier scales with how many releases.
    // (b) Trend theme: Nashville's hot theme right now gives a small lift.
    let themeFanMult = 1;
    let themeNote = "";
    const sig = getSignatureTheme(s.themeCounts);
    if (p.themeId && sig && p.themeId === sig.themeId) {
      score *= sig.scoreMult;
      themeFanMult *= sig.fanMult;
      themeNote = ` · ${sig.theme.icon} signature ${sig.theme.name.toLowerCase()}`;
    }
    if (p.themeId && s.currentTrendTheme && p.themeId === s.currentTrendTheme) {
      score *= TREND_THEME_SCORE_MULT;
      themeFanMult *= TREND_THEME_FAN_MULT;
      themeNote += ` · 🔥 on-trend`;
    }

    // ── Saturation penalties ──
    const satAdd = ({Single:20,EP:35,Album:55,"Live Album":28} as Record<string,number>)[p.type] ?? 25;
    let scoreMult = 1, fanMult = 1, revMult2 = 1;
    let satNote = "";
    if (sat >= 75) {
      scoreMult = 0.75; fanMult = 0.70; revMult2 = 0.70;
      satNote = " (market overexposed — heavy penalty)";
      s.qualityBase = Math.max(20, s.qualityBase - 2);
    } else if (sat >= 60) {
      scoreMult = 0.90; fanMult = 0.85; revMult2 = 0.85;
      satNote = " (market saturated — reduced returns)";
      s.qualityBase = Math.max(20, s.qualityBase - 1);
    }
    score *= scoreMult;
    // cap Viral at overexposed tier
    if (sat >= 75) score = Math.min(score, 73);

    type O="Flop"|"Moderate"|"Hit"|"Viral";
    const outcome:O=score<30?"Flop":score<52?"Moderate":score<74?"Hit":"Viral";
    const rm={Flop:0.1,Moderate:0.4,Hit:1,Viral:4};
    const fm={Flop:0.2,Moderate:0.6,Hit:1,Viral:3.5};
    const famD={Flop:-2,Moderate:2,Hit:6,Viral:15}[outcome];
    const repD={Flop:-4,Moderate:1,Hit:4,Viral:3}[outcome];
    const bRev={Single:450,EP:1200,Album:3500,"Live Album":800}[p.type]??450;
    const bFan={Single:350,EP:1000,Album:4200,"Live Album":650}[p.type]??350;
    // ── ALBUM WRITING MIX ──
    // Aggregate the hook/lyric palette across tracks to flavor the release:
    // party-heavy = more streams + fans, literary-heavy = critic rep but slower
    // commercial pickup. Co-writers add a smaller-than-feature fan bump.
    const writingMix = computeAlbumWritingMix(p.tracks);
    const revenue=Math.floor(bRev*rm[outcome]*roll(0.7,1.4)*revMult2);
    let fansG=Math.floor(bFan*fm[outcome]*roll(0.7,1.4)*fanMult*themeFanMult*writingMix.fanMult);
    for(const t of p.tracks){
      if(t.featId){
        const f=FEATURES.find(x=>x.id===t.featId);
        if(f)fansG+=Math.floor(f.fB*(outcome==="Viral"?1.8:outcome==="Hit"?1.2:0.6)*fanMult);
      } else if(t.cowriterId){
        // Co-writers get ~15% of a feature's fan boost. Free creative help —
        // they bring a slice of their audience but they aren't ON the song.
        // Tuned conservatively so co-writes don't dwarf paid features.
        const f=FEATURES.find(x=>x.id===t.cowriterId);
        if(f)fansG+=Math.floor(f.fB*0.15*(outcome==="Viral"?1.8:outcome==="Hit"?1.2:0.6)*fanMult);
      }
    }
    const radioMult=archHas(s.archetype,"radioBonus")?archVal(s.archetype):1;
    const bStr={Single:500,EP:1500,Album:5000,"Live Album":1200}[p.type]??500;
    const peakStr=Math.floor(bStr*(score/50)*roll(0.8,1.3)*labelMktBoost*streamingPush*radioMult*fanMult*writingMix.streamMult);
    const lifecycle=classifyLifecycle(q,outcome,p.marketingBudget,score,s.archetype);

    // Increase saturation after release
    s.marketSaturation = Math.min(100, sat + satAdd);
    const LC={Normal:{decayRate:0.92,floorPct:0.00},Hit:{decayRate:0.96,floorPct:0.03},Evergreen:{decayRate:0.985,floorPct:0.12}};
    const lcP=LC[lifecycle];
    const criticBand=CRITIC_REVIEWS.find(b=>q>=b.min&&q<b.max)??CRITIC_REVIEWS[0];
    // Literary lyrics earn extra critic respect; party-heavy albums lose a bit
    // of it. The mix is averaged per-track so one cut won't tank the verdict.
    // We do NOT floor at 0 — bad albums' negative crit rep punishment must
    // still bite (final s.rep is clamped 0..100 downstream anyway).
    const repFromCritic=criticBand.rep + writingMix.critRepBonus + pressBonus;
    const headline=rnd(criticBand.headlines);
    const cid="r"+Date.now()+Math.random().toString(36).slice(2,6);
    s.catalog.push({
    id:cid,title:p.title,type:p.type,genre:p.genre,quality:q,appeal:avgAppeal,leadTrackIndex,outcome,lifecycle,
    decayRate:lcP.decayRate,streamFloor:Math.floor(peakStr*lcP.floorPct),
    weeklyStreams:peakStr,peakStreams:peakStr,totalStreams:0,
    releasedWeek:s.week,weeksActive:0,promoted:false,comebackCooldown:0,
    tracks:p.tracks,hasMusicVideo:false,format,releasedEraId:era.id,reissuedEraIds:[],
    weeklyRevenueBreakdown:{physical:0,download:0,streaming:0}, lifetimeRevenueBreakdown:{physical:0,download:0,streaming:0},
    campaign: label ? {
      allocation: {...campaignAllocation}, deploymentPct, deployedBudget:deployedCampaign, approvalOverride,
    } : undefined,
    // Realistic streaming tracking (v2.0)
    streamStats: {
      totalStreams: 0,
      weeklyStreams: peakStr,
      peakStreams: peakStr,
      totalRevenue: 0,
      weeklyRevenue: 0,
      platformBreakdown: {},
      geoBreakdown: {},
      effectiveRate: BASE_STREAMING_RATE,
      premiumRatio: 0.45,
      usShare: 0.62,
      hitThreshold: false,
      revenueHistory: [],
    },
    platformMix: {...s.platformMix},
    geoDist: {...s.geoDist},
    premiumRatio: 0.45,
    effectiveRate: BASE_STREAMING_RATE,
    lifetimeRevenue: 0,
    weeklyRevenue: 0,
    revenueHistory: [],
  });
    s.money+=revenue; s.fans+=fansG;
    // Releases convert casuals → superfans based on outcome. A masterpiece
    // (q >= 85) converts an extra slice on top of the outcome bonus.
    const sfRate = outcome === "Viral" ? 0.030 : outcome === "Hit" ? 0.015 : outcome === "Moderate" ? 0.004 : 0;
    const sfBonus = q >= 85 ? 0.010 : 0;
    if (sfRate + sfBonus + liveConversionBonus > 0) {
      const sfPrior = s.superfans ?? 0;
      const casualsAvail = Math.max(0, s.fans - sfPrior);
      const sfConv = Math.floor(casualsAvail * (sfRate + sfBonus + liveConversionBonus));
      if (sfConv > 0) s.superfans = sfPrior + sfConv;
    }
    s.fame=clamp(s.fame+famD+radioFameBonus,0,100); s.rep=clamp(s.rep+repD+Math.floor(repFromCritic*0.7),0,100);
    s.hype=Math.max(0,s.hype-15); s.weeksSinceRelease=0; s.totalReleases++;
    s.discography.push({id:cid,type:p.type,title:p.title,genre:p.genre,themeId:p.themeId,tracks:p.tracks,avgQuality:q,outcome,revenue,fansGained:fansG,fameDelta:famD,repDelta:repD+repFromCritic,releasedWeek:s.week,peakStreams:peakStr,criticHeadline:headline,lifecycle,hasMusicVideo:false,format,releasedEraId:era.id});
    if (label) {
      label.marketingSpendYTD += deployedCampaign;
      if (campaignAllocation.radio > 0 && deploymentPct > 0) {
        s.campaignRadioBoostWeeks = Math.max(s.campaignRadioBoostWeeks, 4);
        s.campaignRadioBoost = Math.max(s.campaignRadioBoost, (campaignAllocation.radio / 100) * 0.20 * deploymentPct);
      }
      if (campaignAllocation.live > 0 && deploymentPct > 0) {
        s.campaignLiveBoostWeeks = Math.max(s.campaignLiveBoostWeeks, 4);
        s.campaignLiveBoost = Math.max(s.campaignLiveBoost, (campaignAllocation.live / 100) * 0.18 * deploymentPct);
      }
      if (approvalOverride) {
        label.approvalStrikes = (label.approvalStrikes ?? 0) + 1;
        s.rep = clamp(s.rep - 2, 0, 100);
        if (label.approvalStrikes >= 2) label.campaignFrozen = true;
        s.log.unshift({ week:s.week, msg:`You overrode ${label.name}'s A&R notes. Campaign support is reduced and the relationship is strained.`, type:"bad" });
      }
    }
    if (label && p.type === "Album") {
      label.albumsDelivered = Math.min(label.albumsCommitted, label.albumsDelivered + 1);
      label.deliveryStatus = "good";
      label.fundingFrozen = false;
      label.approvalStrikes = 0;
      label.campaignFrozen = false;
      const albumsRemaining = Math.max(0, label.albumsCommitted - label.albumsDelivered);
      if (albumsRemaining > 0) {
        label.deliveryDeadlineWeek = s.week + Math.max(12, Math.floor(label.weeksLeft / albumsRemaining));
      }
      s.log.unshift({
        week:s.week,
        msg: `${label.name} accepted "${p.title}" as album ${label.albumsDelivered}/${label.albumsCommitted}. ${albumsRemaining ? `Next delivery due week ${label.deliveryDeadlineWeek}.` : "Your delivery commitment is fulfilled."}`,
        type:"great",
      });
    }
    // Record this release toward the player's theme identity.
    if (p.themeId) {
      if (!s.themeCounts) s.themeCounts = {};
      s.themeCounts[p.themeId] = (s.themeCounts[p.themeId] ?? 0) + 1;
    }
    s.criticReviews.push({week:s.week,headline,title:p.title,score:Math.floor(q)});
    s.unreleased.splice(idx,1);
    if (s.pendingLabelSubmission?.projectId === id) s.pendingLabelSubmission = null;
    const msg={Flop:`"${p.title}" flopped. Brutal.`,Moderate:`"${p.title}" did okay.`,Hit:`"${p.title}" is a HIT!`,Viral:`"${p.title}" went VIRAL!`}[outcome];
    s.log.unshift({week:s.week,msg:`${msg} ${fmtMoney(revenue)} · +${fmt(fansG)} fans · ${lifecycle}${satNote}${themeNote}`,type:outcome==="Flop"?"bad":outcome==="Viral"?"great":"good"});
    s.pendingEvent = null;
    s.releasePresentation = {
      title: p.title, type: p.type, outcome, quality: q, appeal: avgAppeal, leadTrackIndex, leadTrackName: lead.name, revenue,
      fansGained: fansG, fameDelta: famD, repDelta: repD+repFromCritic,
      peakStreams: peakStr, criticHeadline: headline, lifecycle,
      week: s.week, genre: p.genre, tracks: p.tracks,
      fanReviews: genFanReviews(outcome),
    };
    s.weeklyExpenses=Math.max(100,80+s.fans*0.003+s.fame*5);
    s.pendingPressing = { releaseId: cid, releaseTitle: p.title, releaseType: p.type };
    return s;
  }),[upd]);

  const doDeleteUnreleased = useCallback((id:string)=>upd(s=>{s.unreleased=s.unreleased.filter(p=>p.id!==id);return s;}),[upd]);
  const doReissueRelease = useCallback((id:string, format:ReleaseFormat)=>upd(s=>{
    const entry = s.catalog.find(item => item.id === id);
    const era = getMarketEra(s.currentYear);
    if (!entry || !era.formats.includes(format)) return s;
    if (s.pendingReissue) {
      s.pendingEvent = { msg:"A reissue is already in production. It will arrive next week.", type:"bad" };
      return s;
    }
    if (entry.reissuedEraIds?.includes(era.id)) {
      s.pendingEvent = { msg:"This release has already been reissued for the current era.", type:"bad" };
      return s;
    }
    const cost = getReleaseFormat(format).reissueCost;
    if (s.money < cost) {
      s.pendingEvent = { msg:`You need ${fmtMoney(cost)} to fund this reissue.`, type:"bad" };
      return s;
    }
    s.money -= cost;
    s.pendingReissue = { releaseId:id, format, eraId:era.id };
    s.log.unshift({ week:s.week, msg:`Prepared a ${getReleaseFormat(format).label} reissue of "${entry.title}" for the ${era.name}.`, type:"neutral" });
    s.pendingEvent = { msg:`Reissue in production. "${entry.title}" returns to market next week.`, type:"good" };
    return s;
  }),[upd]);
  const doScrubProject = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    // Refund the upfront producer fee (studio fees were paid weekly, nothing to refund there).
    const p = s.project;
    const prod = PRODUCERS.find(pr => pr.id === p.producerId);
    const prodRefund = prod ? getProducerEffectiveCost(prod, s.producerWorkCounts) : 0;
    if (prodRefund > 0) s.money += prodRefund;
    s.project = null;
    if (prodRefund > 0) {
      s.pendingEvent = { msg:`Project scrapped. ${fmtMoney(prodRefund)} producer fee refunded.`, type:"good" };
    }
    return s;
  }),[upd]);

  // Grind
  const doGrind = useCallback((id:string)=>upd(s=>{
    const a=GRIND_ACTIONS.find(x=>x.id===id); if(!a) return s;
    if(s.energy<a.e){s.pendingEvent={msg:"Not enough energy.",type:"bad"};return s;}
    if(a.mc&&s.money<a.mc){s.pendingEvent={msg:"Not enough money.",type:"bad"};return s;}
    s.energy-=a.e; if(a.mc)s.money-=a.mc; s.cooldowns[a.id]=a.cd;
    // ── #3 Burnout: heavy actions add fatigue beyond the energy cost ──
    // Anything 25+ energy is "real work" and contributes to burnout.
    if (a.e >= 25) {
      s.burnout = Math.min(100, (s.burnout ?? 0) + (a.e >= 35 ? 3 : 2));
    }
    const ef=a.eff; const msgs:string[]=[];
    if(ef.fame){const v=ef.fame*roll(0.7,1.4);s.fame=clamp(s.fame+v,0,100);msgs.push(`fame+${v.toFixed(1)}`);}
    if(ef.rep){const v=ef.rep*roll(0.7,1.4);s.rep=clamp(s.rep+v,0,100);msgs.push(`rep+${v.toFixed(1)}`);}
    if(ef.hype){const v=ef.hype*roll(0.7,1.3);s.hype=clamp(s.hype+v,0,100);msgs.push(`hype+${v.toFixed(1)}`);}
    if(ef.fans){const v=Math.floor(ef.fans*roll(0.5,1.6));s.fans+=v;msgs.push(`fans+${fmt(v)}`);}
    if(ef.money){const v=Math.floor(ef.money*roll(0.85,1.15));s.money+=v;msgs.push(`+${fmtMoney(v)}`);}
    if(ef.money_pct&&s.fans>0){const v=Math.floor(s.fans*ef.money_pct*roll(0.8,1.2));s.money+=v;msgs.push(`+${fmtMoney(v)}`);}
    if(ef.satReduce){s.marketSaturation=Math.max(0,(s.marketSaturation??0)-ef.satReduce);msgs.push(`sat-${ef.satReduce}`);}
    if(ef.radio&&s.totalReleases>0&&Math.random()<Math.min(0.75,0.4+(s.campaignRadioBoostWeeks>0?s.campaignRadioBoost:0))){const rm2=archHas(s.archetype,"radioBonus")?archVal(s.archetype):1;const fG=Math.floor(roll(400,1200)*rm2);s.fans+=fG;s.fame=clamp(s.fame+Math.max(1,Math.floor(2*rm2)),0,100);s.rep=clamp(s.rep+2,0,100);msgs.push(`RADIO! +${fmt(fG)} fans`);s.pendingEvent={msg:`Radio spin! +${fmt(fG)} fans`,type:"great"};}
    if(ef.playlist&&s.totalReleases>0&&Math.random()<0.35){s.hype=clamp(s.hype+18,0,100);s.fans+=Math.floor(roll(200,800));s.catalog.forEach(t=>{t.weeklyStreams=Math.min(t.peakStreams,Math.floor(t.weeklyStreams*1.3));});s.pendingEvent={msg:"Playlist secured! Streams boosted.",type:"great"};}
    if(ef.sync_chance&&s.totalReleases>0){const prob=archHas(s.archetype,"syncRadioBoost")?0.38:0.25;if(Math.random()<prob){const m=Math.floor(roll(3000,15000));s.money+=m;s.fame=clamp(s.fame+2,0,100);msgs.push(`SYNC +${fmtMoney(m)}`);s.pendingEvent={msg:`Sync deal! +${fmtMoney(m)}`,type:"gold"};}}
    if(ef.festival_chance&&s.totalReleases>0&&Math.random()<0.3){const fF=Math.floor(roll(500,2000));s.fans+=fF;s.fame=clamp(s.fame+3,0,100);s.rep=clamp(s.rep+2,0,100);msgs.push(`FEST! +${fmt(fF)}`);s.pendingEvent={msg:`Festival slot! +${fmt(fF)} fans`,type:"great"};}
    if(!s.pendingEvent)s.pendingEvent={msg:`${a.name}: ${msgs.slice(0,3).join(" · ")}`,type:"norm"};
    s.log.unshift({week:s.week,msg:`${a.name}: ${msgs.join(", ")}`,type:"good"});
    return s;
  }),[upd]);

  // Tour
  const doToggleTourCity = useCallback((cityName:string)=>upd(s=>{
    const city=CITIES.find(c=>c.name===cityName); if(!city) return s;
    const inQ=s.tourQueue.findIndex(q=>q.cityName===cityName);
    if(inQ>=0){s.tourQueue.splice(inQ,1);return s;}
    const v=city.venues.find(v=>v.tier===s.tourVenue)??city.venues[city.venues.length-1];
    if(!v)return s;
    s.tourQueue.push({cityName,venueName:v.name,venueCap:v.cap,venueCost:v.cost,venueTier:v.tier,travelCost:city.travelCost,region:city.region,genreMod:city.genreMod});
    return s;
  }),[upd]);

  const doSetVenueTier = useCallback((tier:number)=>upd(s=>{
    s.tourVenue=tier;
    s.tourQueue=s.tourQueue.map(stop=>{
      const city=CITIES.find(c=>c.name===stop.cityName); if(!city) return stop;
      const v=city.venues.find(v=>v.tier===tier)??city.venues[city.venues.length-1];
      return {...stop,venueName:v.name,venueCap:v.cap,venueCost:v.cost,venueTier:v.tier};
    });
    return s;
  }),[upd]);

  const doSetTicketMult = useCallback((mult:number)=>upd(s=>{s.tourTicketMult=mult;return s;}),[upd]);

  const doStartTour = useCallback(()=>upd(s=>{
    if(!s.tourQueue.length) return s;
    const mult=tourCostMult(s.archetype);
    // Upfront tour costs: travel + venue deposit + crew advance
    const upfront=s.tourQueue.reduce((sum,q)=>{
      const travel = q.travelCost; // gas, tolls, van wear for the leg
      const venueDeposit = Math.floor(q.venueCost * 0.3); // 30% deposit
      const crewAdvance = Math.floor(calcCrewCost(q.venueTier) * 0.5); // half crew pay upfront
      return sum + Math.floor((travel + venueDeposit + crewAdvance) * mult);
    },0);
    if(s.money<upfront){s.pendingEvent={msg:`Need ${fmtMoney(upfront)} upfront.`,type:"bad"};return s;}
    s.money-=upfront;
    s.tourActive={shows:[...s.tourQueue],progress:0,ticketMult:s.tourTicketMult,demandDecayIndex:0};
    s.tourQueue=[];
    s.log.unshift({week:s.week,msg:`Tour started: ${s.tourActive.shows.map(sh=>sh.cityName).join(" → ")}`,type:"good"});
    // Trigger tour intro cinematic when starting a tour
    s.pendingEvent={msg:"On the road! End a week to play your first show.",type:"great"};
    // Set flag to trigger tour intro - we'll need to handle this in GameScreen
    return s;
  }),[upd]);

  // Streaming
  const doPromoteTrack = useCallback((id:string)=>upd(s=>{
    if(s.money<350){s.pendingEvent={msg:"Need $350 to promote.",type:"bad"};return s;}
    const t=s.catalog.find(x=>x.id===id); if(!t) return s;
    s.money-=350;
    const pct={Normal:0.50,Hit:0.65,Evergreen:0.80}[t.lifecycle]??0.50;
    t.weeklyStreams=Math.max(t.weeklyStreams,Math.floor(t.peakStreams*pct));
    t.promoted=true;
    // Promotion boosts Spotify/YouTube discovery algorithm placement
    if (t.platformMix) {
      t.platformMix.spotify = Math.min(0.65, (t.platformMix.spotify ?? 0.5) + 0.08);
      t.platformMix.youtube = Math.min(0.15, (t.platformMix.youtube ?? 0.08) + 0.04);
      // Normalize
      const sum = Object.values(t.platformMix).reduce((a,b)=>a+b,0);
      for (const k of Object.keys(t.platformMix)) t.platformMix[k] /= sum;
    }
    s.pendingEvent={msg:`"${t.title}" streams restored to ${Math.floor(pct*100)}% of peak. Spotify algorithm boost active.`,type:"great"};
    return s;
  }),[upd]);

  const doShootMusicVideo = useCallback((id:string)=>upd(s=>{
    if(s.money<1200){s.pendingEvent={msg:"Need $1,200 for music video.",type:"bad"};return s;}
    s.money-=1200; s.fame=clamp(s.fame+3,0,100); s.rep=clamp(s.rep+2,0,100); s.hype=clamp(s.hype+22,0,100); s.fans+=900;
    // Music videos deepen engagement — convert ~2% of casuals into superfans.
    const sfPrior = s.superfans ?? 0;
    const casualsAvail = Math.max(0, s.fans - sfPrior);
    const sfBump = Math.min(casualsAvail, 50 + Math.floor(casualsAvail * 0.02));
    if (sfBump > 0) s.superfans = sfPrior + sfBump;
    const cat=s.catalog.find(x=>x.id===id); const disc=s.discography.find(x=>x.id===id);
    if(cat){
      cat.hasMusicVideo=true;
      cat.weeklyStreams=Math.min(cat.peakStreams,Math.floor(cat.weeklyStreams*1.35));
      // Music videos boost YouTube Music and Spotify (video integration)
      if (cat.platformMix) {
        cat.platformMix.youtube = Math.min(0.18, (cat.platformMix.youtube ?? 0.08) + 0.06);
        cat.platformMix.spotify = Math.min(0.60, (cat.platformMix.spotify ?? 0.52) + 0.03);
        const sum = Object.values(cat.platformMix).reduce((a,b)=>a+b,0);
        for (const k of Object.keys(cat.platformMix)) cat.platformMix[k] /= sum;
      }
    }
    if(disc)disc.hasMusicVideo=true;
    s.pendingEvent={msg:"Music video done! YouTube Music + Spotify video boost active. Streams and hype up.",type:"great"};
    return s;
  }),[upd]);

  // More
  const doSignBrandDeal = useCallback((id:string)=>upd(s=>{
    const b=BRAND_DEALS.find(x=>x.id===id); if(!b) return s;
    s.activeBrandDeals.push({id:b.id,name:b.name,weeklyIncome:b.weeklyIncome,weeksLeft:b.duration});
    if(b.rep)s.rep=clamp(s.rep+Math.floor(b.rep*0.5),0,100); if(b.famePerk)s.fame=clamp(s.fame+Math.floor(b.famePerk*0.5),0,100);
    const selloutHit = getBrandDealSellout(id);
    if (selloutHit > 0) s.selloutScore = Math.min(100, (s.selloutScore || 0) + selloutHit);
    s.log.unshift({week:s.week,msg:`Brand deal: ${b.name} — ${fmtMoney(b.weeklyIncome)}/wk${selloutHit > 0 ? ` · +${selloutHit} sellout` : ""}`,type:"good"});
    s.pendingEvent={msg:`Signed with ${b.name}!${selloutHit > 0 ? " Authenticity taking a hit." : ""}`,type:"gold"};
    return s;
  }),[upd]);

  // Accept / reject a queued label offer. Accepting locks in the contract & pays the advance.
  const doAcceptLabelOffer = useCallback((labelId:string)=>upd(s=>{
    const offer = s.pendingLabelOffers.find(o => o.labelId === labelId);
    if (!offer) return s;
    const L = getLabel(labelId);
    if (!L) return s;
    s.money += offer.advance;
    s.fame = clamp(s.fame + 10, 0, 100);
    s.currentLabel = {
      labelId: L.id, name: L.name, exec: L.exec, type: L.type,
      advance: offer.advance, advanceRecouped: 0,
      recordingFund: offer.recordingFund, recordingFundUsed: 0,
      royaltyRate: offer.royaltyRate, recoupRate: offer.recoupRate,
      streamingCut: offer.streamingCut, tourGrossCut: offer.tourGrossCut,
      merchCut: offer.merchCut, syncCut: offer.syncCut, publishingCut: offer.publishingCut,
      marketingCommitment: offer.marketingCommitment, marketingBoost: offer.marketingBoost, marketingSpendYTD: 0,
      albumsCommitted: offer.albumsCommitted, albumsDelivered: 0,
      optionsRemaining: offer.options, optionWeeks: offer.optionWeeks,
      weeksLeft: offer.termWeeks, totalWeeks: offer.termWeeks, signedAtWeek: s.week,
      deliveryDeadlineWeek: s.week + Math.max(12, Math.floor(offer.termWeeks / Math.max(1, offer.albumsCommitted))),
      deliveryStatus: "good", deliveryExtensions: 0, fundingFrozen: false,
      approvalStrikes: 0, campaignFrozen: false,
      crossCollateralization: offer.crossCollateralization,
      controlledComposition: offer.controlledComposition,
      controlledCompositionCap: offer.controlledCompositionCap,
      suspensionRights: offer.suspensionRights, keyPersonClause: offer.keyPersonClause,
      creativeControl: offer.creativeControl, approvalRights: [...offer.approvalRights],
      isRecouped: false, perks: [...(L.perks ?? [])],
    };
    s.labelSigned = true;
    s.pendingLabelOffers = [];
    s.log.unshift({week:s.week,msg:`Signed with ${L.name}! ${fmtMoney(offer.advance)} advance.`,type:"great"});
    // Build signing presentation
    const typeColor: Record<string,string> = {
      major:"#c0442c", americana:"#d4a820", indie:"#6a8d5a", boutique:"#a47bb8", specialty:"#5a8da8",
    };
    const signing: SigningPresentation = {
      kind: "label",
      name: L.name,
      exec: L.exec,
      city: L.city,
      accentColor: typeColor[L.type] ?? "#d4a820",
      advance: offer.advance,
      terms: [
        { label: "Streaming cut", value: Math.round(offer.streamingCut * 100) + "%", isGood: false },
        { label: "Tour cut", value: Math.round(offer.tourGrossCut * 100) + "%", isGood: false },
        { label: "Marketing boost", value: "×" + offer.marketingBoost.toFixed(2), isGood: true },
        { label: "Contract length", value: offer.termWeeks + " wk", isGood: true },
      ],
      perks: L.perks,
      quote: L.pitch,
      week: s.week,
    };
    s.signingPresentation = signing;
    return s;
  }),[upd]);

  const doDismissLabelOffers = useCallback(()=>upd(s=>{
    if (s.pendingLabelOffers.length) {
      s.log.unshift({week:s.week,msg:"Walked away from label offers.",type:"neutral"});
    }
    s.pendingLabelOffers = [];
    return s;
  }),[upd]);

  // Accept / reject a queued manager offer.
  const doAcceptManagerOffer = useCallback((managerId:string)=>upd(s=>{
    const offer = s.pendingManagerOffers.find(o => o.managerId === managerId);
    if (!offer) return s;
    const M = getManager(managerId);
    if (!M) return s;
    s.currentManager = {
      managerId: M.id, name: M.name,
      weeklyFee: offer.weeklyFee, showRevPct: offer.showRevPct,
      brandDealBoost: offer.brandDealBoost, repPerWeek: offer.repPerWeek,
      signedAtWeek: s.week,
    };
    s.hasManager = true;
    s.rep = clamp(s.rep + 5, 0, 100);
    s.pendingManagerOffers = [];
    s.log.unshift({week:s.week,msg:`Signed with ${M.name} as manager.`,type:"great"});
    // Build signing presentation
    const mgrTypeColor: Record<string,string> = {
      old_school:"#8a6d3a", boutique:"#a47bb8", aggressive:"#c0442c", legend:"#d4a820",
    };
    const terms = [
      { label: "Weekly retainer", value: fmtMoney(offer.weeklyFee) + "/wk", isGood: false },
      { label: "Show net bonus", value: "+" + Math.round(offer.showRevPct * 100) + "%", isGood: true },
    ];
    if (offer.brandDealBoost > 1) terms.push({ label: "Brand deal boost", value: "+" + Math.round((offer.brandDealBoost - 1) * 100) + "%", isGood: true });
    if (offer.repPerWeek > 0) terms.push({ label: "Rep accrual", value: "+" + offer.repPerWeek.toFixed(2) + "/wk", isGood: true });
    const signing: SigningPresentation = {
      kind: "manager",
      name: M.name,
      city: M.city,
      accentColor: mgrTypeColor[M.type] ?? "#6a8d5a",
      weeklyFee: offer.weeklyFee,
      terms,
      perks: M.perks,
      quote: M.pitch,
      week: s.week,
    };
    s.signingPresentation = signing;
    return s;
  }),[upd]);

  const doDismissManagerOffers = useCallback(()=>upd(s=>{
    if (s.pendingManagerOffers.length) {
      s.log.unshift({week:s.week,msg:"Walked away from manager offers.",type:"neutral"});
    }
    s.pendingManagerOffers = [];
    return s;
  }),[upd]);

  // ── FEATURE REQUESTS ─────────────────────────────────────────
  // Accept an inbound feature request: pay the cost in energy, collect the fee,
  // gain fame/rep/fans, log a guest credit, and bump the relationship counter
  // (which discounts THEIR fee on YOUR future tracks).
  const doAcceptFeatureRequest = useCallback((featureId:string)=>upd(s=>{
    if (!s.pendingFeatureRequests?.length) return s;
    const req = s.pendingFeatureRequests.find(r => r.featureId === featureId);
    if (!req) return s;
    const f = getFeature(featureId);
    if (!f) return s;
    if (s.energy < 10) {
      s.pendingEvent = { msg:"Need at least 10 energy to lay down a guest verse.", type:"bad" };
      return s;
    }
    s.energy -= 10;
    s.money += req.fee;
    s.totalEarned += req.fee;
    s.fame = clamp(s.fame + req.fameBonus, 0, 100);
    s.rep  = clamp(s.rep  + req.repBonus,  0, 100);
    s.fans += req.fanBonus;
    if (!s.guestCredits) s.guestCredits = [];
    s.guestCredits.unshift({
      featureId, artistName:f.name, trackTitle:req.trackTitle,
      week:s.week, fee:req.fee, themeId:req.themeId,
    });
    if (s.guestCredits.length > 24) s.guestCredits.length = 24;
    if (!s.featureWorkCounts) s.featureWorkCounts = {};
    s.featureWorkCounts[featureId] = (s.featureWorkCounts[featureId] ?? 0) + 1;
    s.log.unshift({
      week:s.week,
      msg:`Guested on ${f.name}'s "${req.trackTitle}" — ${fmtMoney(req.fee)}, +${req.fameBonus} fame.`,
      type:"good",
    });
    s.pendingFeatureRequests = [];
    s.cooldowns["feat_req"] = 8; // earned a longer breather after collaborating
    s.pendingEvent = {
      msg:`Featured on ${f.name}'s track! +${fmtMoney(req.fee)}, +${req.fameBonus} fame, +${fmt(req.fanBonus)} fans.`,
      type:"gold",
    };
    return s;
  }),[upd]);

  const doDismissFeatureRequests = useCallback(()=>upd(s=>{
    if (s.pendingFeatureRequests?.length) {
      const r = s.pendingFeatureRequests[0];
      const f = getFeature(r.featureId);
      s.log.unshift({ week:s.week, msg:`Passed on a feature offer from ${f?.name ?? "an artist"}.`, type:"neutral" });
    }
    s.pendingFeatureRequests = [];
    return s;
  }),[upd]);

  // Drop your current contracts. Breaking a label deal carries a rep penalty
  // AND blocks new label pitches for a long cooldown to prevent advance-farming.
  const doDropLabel = useCallback(()=>upd(s=>{
    if (!s.currentLabel) return s;
    s.log.unshift({week:s.week,msg:`Dropped from ${s.currentLabel.name}. -5 rep. Word travels fast.`,type:"bad"});
    s.rep = clamp(s.rep - 5, 0, 100);
    s.currentLabel = null;
    s.labelSigned = false;
    // 26-week (~6 month) industry-wide cooldown — labels talk to each other.
    s.cooldowns["net_label"] = 26;
    return s;
  }),[upd]);

  const doDropManager = useCallback(()=>upd(s=>{
    if (!s.currentManager) return s;
    s.log.unshift({week:s.week,msg:`Parted ways with ${s.currentManager.name}.`,type:"neutral"});
    s.currentManager = null;
    s.hasManager = false;
    return s;
  }),[upd]);

  const doCloseReleasePresentation = useCallback(()=>upd(s=>{
    s.releasePresentation = null;
    return s;
  }),[upd]);

  const doCloseTourWrapPresentation = useCallback(()=>upd(s=>{
    s.tourWrapPresentation = null;
    return s;
  }),[upd]);

  const doCloseSigningPresentation = useCallback(()=>upd(s=>{
    s.signingPresentation = null;
    return s;
  }),[upd]);

  const doCloseAwardPresentation = useCallback(()=>upd(s=>{
    s.awardPresentation = null;
    return s;
  }),[upd]);

  const doCloseMilestonePresentation = useCallback(()=>upd(s=>{
    s.milestonePresentation = null;
    return s;
  }),[upd]);


  // ── PUBLISHING ───────────────────────────────────────────
  const doAcceptPublishingOffer = useCallback((id:string)=>upd(s=>{
    const offer = s.pendingPublishingOffers.find(o => o.id === id);
    if (!offer) return s;
    s.money += offer.advance;
    s.currentPublishing = {
      id: offer.id,
      publisherName: offer.publisherName,
      type: offer.type,
      advance: offer.advance,
      advanceRecouped: 0,
      artistSplit: offer.artistSplit,
      termWeeks: offer.termWeeks,
      weeksLeft: offer.termWeeks,
      isRecouped: offer.advance === 0,
      signedAtWeek: s.week,
    };
    s.pendingPublishingOffers = [];
    s.log.unshift({week:s.week,msg:`Signed publishing deal with ${offer.publisherName}! ${offer.type === "admin" ? "Copyright retained." : offer.type === "co_pub" ? "50/50 split." : "Catalog assigned."} ${fmtMoney(offer.advance)} advance.`,type:"great"});
    s.pendingEvent = {msg:`Publishing deal signed: ${offer.publisherName}`,type:"gold"};
    return s;
  }),[upd]);

  const doDismissPublishingOffers = useCallback(()=>upd(s=>{
    if (s.pendingPublishingOffers?.length) {
      s.log.unshift({week:s.week,msg:"Passed on publishing offers.",type:"neutral"});
    }
    s.pendingPublishingOffers = [];
    return s;
  }),[upd]);

  // ── SYNC LICENSING ───────────────────────────────────────
  const doAcceptSyncOffer = useCallback((id:string)=>upd(s=>{
    const offer = s.pendingSyncOffers.find(o => o.id === id);
    if (!offer) return s;
    s.money += offer.payout;
    s.totalEarned += offer.payout;
    s.fame = clamp(s.fame + offer.fameBonus, 0, 100);
    s.rep = clamp(s.rep + offer.repBonus, 0, 100);
    s.selloutScore = Math.min(100, (s.selloutScore || 0) + offer.selloutHit);
    s.pendingSyncOffers = s.pendingSyncOffers.filter(o => o.id !== id);
    s.log.unshift({
      week:s.week,
      msg:`Sync deal: "${offer.songTitle}" in ${offer.showName} — ${fmtMoney(offer.payout)}${offer.showType === "embarrassing" ? " · Some fans are questioning it." : ""}`,
      type: offer.showType === "embarrassing" ? "bad" : "good"
    });
    s.pendingEvent = {
      msg:`${offer.showName} sync: ${fmtMoney(offer.payout)}${offer.showType === "embarrassing" ? " · Cred took a hit" : ""}`,
      type: offer.showType === "embarrassing" ? "bad" : "gold"
    };
    return s;
  }),[upd]);

  const doDismissSyncOffers = useCallback(()=>upd(s=>{
    if (s.pendingSyncOffers?.length) {
      s.log.unshift({ week:s.week, msg:"Passed on sync offers.", type:"neutral" });
    }
    s.pendingSyncOffers = [];
    return s;
  }),[upd]);

  const doResolveScenario = useCallback((scenarioId: string, choiceIdx: number, rollSuccess?: boolean) => upd(s => {
    const scenario = RANDOM_SCENARIOS.find(sc => sc.id === scenarioId);
    if (!scenario) return s;
    const choice = scenario.choices[choiceIdx];
    if (!choice) return s;
    s.pendingScenarioId = null;
    let effect: ScenarioEffect = { ...choice.effect };
    let resultMsg = choice.result;
    if (choice.roll) {
      const win = rollSuccess !== undefined ? rollSuccess : Math.random() < choice.roll.chance;
      if (win) { effect = { ...effect, ...choice.roll.onSuccess }; resultMsg = choice.roll.successMsg; }
      else      { effect = { ...effect, ...choice.roll.onFail };   resultMsg = choice.roll.failMsg; }
    }
    if (effect.money)       s.money += effect.money;
    if (effect.fans)        s.fans  = Math.max(0, s.fans + effect.fans);
    if (effect.fame)        s.fame  = clamp(s.fame + effect.fame, 0, 100);
    if (effect.rep)         s.rep   = clamp(s.rep  + effect.rep,  0, 100);
    if (effect.energy)      s.energy = clamp((s.energy ?? 0) + effect.energy, 0, 100);
    if (effect.hype)        s.hype  = clamp((s.hype ?? 0) + effect.hype, 0, 100);
    if (effect.qualityBase) s.qualityBase = Math.max(20, s.qualityBase + effect.qualityBase);
    if (effect.saturation)  s.marketSaturation = Math.min(100, Math.max(0, (s.marketSaturation ?? 0) + effect.saturation));
    const netVal = (effect.money ?? 0) * 0.001 + (effect.fans ?? 0) * 0.01 + (effect.fame ?? 0) + (effect.rep ?? 0);
    const logType = netVal > 5 ? "great" : netVal > 0 ? "good" : netVal < -3 ? "bad" : "neutral";
    s.log.unshift({ week: s.week, msg: `${scenario.title}: ${resultMsg}`, type: logType as "good"|"bad"|"great"|"neutral" });
    s.pendingEvent = { msg: resultMsg, type: logType };
    return s;
  }), [upd]);


  // ── Setlist Builder ──
  const doSetSetlist = useCallback((config: SetlistConfig) => upd(s => {
    s.setlistConfig = config;
    const total = config.deepCutCount + config.hitCount + config.newMaterialCount;
    const slots = s.tourActive && s.tourActive.shows.length > 5 ? 22 : 6;
    if (total !== slots) {
      s.pendingEvent = { msg: `Setlist must have exactly ${slots} songs. You have ${total}.`, type: "bad" };
    } else {
      const sat = calculateSetlistSatisfaction(config, s.catalog, slots);
      s.pendingEvent = { msg: `Setlist updated: ${sat.label} (${sat.score}/100). ${sat.feedback}`, type: sat.score >= 75 ? "good" : "neutral" };
    }
    return s;
  }), [upd]);

  // ── Opening Act Offers ──
  const doAcceptOpeningAct = useCallback((offerId: string) => upd(s => {
    const offer = s.pendingOpeningActOffers.find(o => o.id === offerId);
    if (!offer) return s;
    if (s.tourActive) {
      s.pendingEvent = { msg: "Can't take an opening act while on your own tour.", type: "bad" };
      return s;
    }
    s.activeOpeningAct = offer;
    s.openingActProgress = 0;
    s.pendingOpeningActOffers = [];
    s.log.unshift({ week: s.week, msg: `Accepted opening act for ${offer.headlinerName}: ${offer.showsCount} shows`, type: "good" });
    s.pendingEvent = { msg: `Opening for ${offer.headlinerName}! Low pay, massive exposure.`, type: "great" };
    return s;
  }), [upd]);

  const doDismissOpeningActOffers = useCallback(() => upd(s => {
    if (s.pendingOpeningActOffers.length) {
      s.log.unshift({ week: s.week, msg: "Passed on opening act offers.", type: "neutral" });
    }
    s.pendingOpeningActOffers = [];
    return s;
  }), [upd]);

  // ── Festival Offers ──
  const doAcceptFestival = useCallback((festivalId: string) => upd(s => {
    const offer = s.pendingFestivalOffers.find(f => f.festivalId === festivalId);
    if (!offer) return s;
    if (!s.festivalBookings) s.festivalBookings = [];
    s.festivalBookings.push({ ...offer, completed: false });
    s.pendingFestivalOffers = s.pendingFestivalOffers.filter(f => f.festivalId !== festivalId);
    s.log.unshift({ week: s.week, msg: `Booked ${offer.festivalName}! Performing week ${offer.performanceWeek}.`, type: "great" });
    s.pendingEvent = { msg: `Festival locked: ${offer.festivalName} on the ${offer.stage} stage!`, type: "gold" };
    return s;
  }), [upd]);

  const doDismissFestivalOffers = useCallback(() => upd(s => {
    if (s.pendingFestivalOffers.length) {
      s.log.unshift({ week: s.week, msg: "Passed on festival offers.", type: "neutral" });
    }
    s.pendingFestivalOffers = [];
    return s;
  }), [upd]);


  // ── #3 Burnout: Vacation action ─────────────────────────
  // A real reset — clears most burnout, restores energy, but costs cash + time
  // off (cooldown gates spam-vacationing). Strong but not free.
  const doTakeVacation = useCallback(()=>upd(s=>{
    if ((s.vacationCooldown ?? 0) > 0) {
      s.pendingEvent = { msg:`You've vacationed recently. ${s.vacationCooldown}wk cooldown.`, type:"bad" };
      return s;
    }
    const cost = 2200;
    if (s.money < cost) {
      s.pendingEvent = { msg:`Need ${fmtMoney(cost)} for a real getaway.`, type:"bad" };
      return s;
    }
    s.money -= cost;
    const before = s.burnout ?? 0;
    s.burnout = Math.max(0, before - 45);
    s.energy  = clamp(s.energy + 35, 0, 100);
    s.vacationCooldown = 8;
    s.log.unshift({ week:s.week, msg:`Took a week off. Burnout ${before.toFixed(0)}→${s.burnout.toFixed(0)}. -${fmtMoney(cost)}.`, type:"good" });
    s.pendingEvent = { msg:"You took a real break. The studio can wait.", type:"great" };
    return s;
  }),[upd]);

  // ── #5 Story Arcs: resolve a pending choice ─────────────
  // Apply the choice's immediate effect, push the choice into the path, then
  // either advance to the next step (with its delay) or mark the arc complete.
  const doResolveArcChoice = useCallback((arcId:string, choiceIdx:number)=>upd(s=>{
    if (!s.pendingArcChoice || s.pendingArcChoice.arcId !== arcId) return s;
    const arc = getStoryArc(arcId);
    if (!arc) { s.pendingArcChoice = null; return s; }
    const inst = (s.activeArcs ?? []).find(a => a.arcId === arcId);
    if (!inst) { s.pendingArcChoice = null; return s; }
    const step = arc.steps[inst.currentStep];
    if (!step) { s.pendingArcChoice = null; inst.currentStep = -1; return s; }
    const choice = step.choices[choiceIdx];
    if (!choice) return s;

    // If the choice carries an inline roll (e.g. lawsuit verdict), resolve it
    // now and swap in the rolled effect/result before applying anything.
    let appliedEffect: ScenarioEffect = choice.effect ?? {};
    let appliedResult: string = choice.result;
    if (choice.roll) {
      const success = Math.random() < choice.roll.chance;
      appliedEffect = success ? choice.roll.onSuccess : choice.roll.onFail;
      appliedResult = success ? choice.roll.successResult : choice.roll.failResult;
    }

    // Apply immediate one-shot effect (mirrors doResolveScenario's mapping).
    const e = appliedEffect;
    if (e.money)       s.money += e.money;
    if (e.fans)        s.fans  = Math.max(0, s.fans + e.fans);
    if (e.fame)        s.fame  = clamp(s.fame  + e.fame, 0, 100);
    if (e.rep)         s.rep   = clamp(s.rep   + e.rep,  0, 100);
    if (e.energy)      s.energy= clamp(s.energy+ e.energy, 0, 100);
    if (e.hype)        s.hype  = clamp(s.hype  + e.hype, 0, 100);
    if (e.burnout)     s.burnout = clamp((s.burnout ?? 0) + e.burnout, 0, 100);
    if (e.qualityBase) s.qualityBase = Math.max(20, s.qualityBase + e.qualityBase);
    if (e.superfans)   s.superfans = Math.max(0, Math.min(s.fans, (s.superfans ?? 0) + e.superfans));

    // ArcChoice has no id field — record by index for the run history.
    inst.choicePath.push(`${inst.currentStep}:${choiceIdx}`);
    s.pendingArcChoice = null;

    // Advance the arc — either next step (with delay) or finish.
    if (choice.nextStep === -1 || choice.nextStep === undefined) {
      inst.currentStep = -1;
      s.completedArcs = [...(s.completedArcs ?? []), arcId];
      s.log.unshift({ week:s.week, msg:`Chapter closed: ${arc.title}. ${appliedResult}`, type:"neutral" });
    } else {
      const nextIdx = choice.nextStep;
      const nextStep = arc.steps[nextIdx];
      if (!nextStep) {
        inst.currentStep = -1;
        s.completedArcs = [...(s.completedArcs ?? []), arcId];
      } else {
        inst.currentStep = nextIdx;
        inst.fireOnWeek = s.week + (nextStep.delay ?? 1);
        s.log.unshift({ week:s.week, msg:`${arc.title}: ${appliedResult}`, type:"neutral" });
      }
    }
    s.pendingEvent = { msg: appliedResult, type: "neutral" };
    return s;
  }),[upd]);

  const doSignLabel = useCallback(()=>upd(s=>{
    const adv=(s as any)._pendingLabelAdvance??30000;
    s.money+=adv; s.labelSigned=true; s.fame=clamp(s.fame+5,0,100);
    delete (s as any)._pendingLabelAdvance; s.modal=null;
    s.pendingEvent={msg:`Label signed! ${fmtMoney(adv)} advance.`,type:"gold"};
    return s;
  }),[upd]);

  // Merch shop
  const doAddMerchItem = useCallback((
    type: MerchType, tiedReleaseId: string | null, name: string, price: number,
    opts?: { variantName?: string; variantColor?: string; editionLabel?: string; bonusCost?: number; bonusPrice?: number; suppressEvent?: boolean }
  ) => upd(s => {
    const tmpl = MERCH_TEMPLATES.find(t => t.type === type);
    if (!tmpl) return s;
    if (tmpl.needsRelease && !tiedReleaseId) {
      s.pendingEvent = { msg: `${type} requires an album to tie to.`, type: "bad" };
      return s;
    }
    const unitCost = tmpl.baseCost + (opts?.bonusCost ?? 0);
    const setup = Math.max(40, Math.floor(unitCost * 25));
    if (s.money < setup) {
      s.pendingEvent = { msg: `Need ${fmtMoney(setup)} to set up the ${type} run.`, type: "bad" };
      return s;
    }
    const tied = tiedReleaseId ? s.catalog.find(c => c.id === tiedReleaseId) : null;
    const finalPrice = Math.max(1, Math.floor(price + (opts?.bonusPrice ?? 0)));
    const editionTag = opts?.editionLabel && opts.editionLabel !== "Standard" ? ` — ${opts.editionLabel}` : "";
    const variantTag = opts?.variantName && opts.variantName !== "Standard Black" && opts.variantName !== "Standard Jewel Case" && opts.variantName !== "Black Shell" ? ` (${opts.variantName})` : "";
    const baseName = name.trim() || tmpl.defaultName(tied?.title ?? null, s.artistName);
    const item: MerchItem = {
      id: "m" + Date.now() + Math.random().toString(36).slice(2,5),
      type, name: baseName + variantTag + editionTag,
      emoji: tmpl.emoji,
      tiedToReleaseId: tiedReleaseId,
      tiedToReleaseTitle: tied?.title ?? null,
      price: finalPrice,
      cost: unitCost,
      releasedWeek: s.week,
      weeklySales: [],
      totalSold: 0,
      totalRevenue: 0,
      reviews: [],
      active: true,
      variantName: opts?.variantName,
      variantColor: opts?.variantColor,
      editionLabel: opts?.editionLabel && opts.editionLabel !== "Standard" ? opts.editionLabel : undefined,
    };
    s.money -= setup;
    if (!s.merchShop) s.merchShop = [];
    s.merchShop.unshift(item);
    s.log.unshift({ week: s.week, msg: `New merch listed: ${item.name} (${fmtMoney(setup)} setup)`, type: "neutral" });
    if (!opts?.suppressEvent) {
      s.pendingEvent = { msg: `${item.name} is live in the shop.`, type: "good" };
    }
    return s;
  }), [upd]);

  const doDismissPressing = useCallback(() => upd(s => { s.pendingPressing = null; return s; }), [upd]);

  // Press one or more physical formats at once. selections = [{type, variantName, variantColor, edition, ...}]
  const doQuickPress = useCallback((releaseId: string, selections: Array<{ type: MerchType; variantName: string; variantColor: string; variantPriceMod: number; variantCostMod: number; editionName: string; editionPriceMod: number; editionCostMod: number; }>) => upd(s => {
    const rel = s.catalog.find(c => c.id === releaseId);
    if (!rel) { s.pendingPressing = null; return s; }
    let totalSetup = 0;
    for (const sel of selections) {
      const tmpl = MERCH_TEMPLATES.find(t => t.type === sel.type);
      if (!tmpl) continue;
      const unitCost = tmpl.baseCost + sel.variantCostMod + sel.editionCostMod;
      totalSetup += Math.max(40, Math.floor(unitCost * 30));
    }
    if (s.money < totalSetup) {
      s.pendingEvent = { msg: `Need ${fmtMoney(totalSetup)} to press these. You have ${fmtMoney(s.money)}.`, type: "bad" };
      return s;
    }
    if (!s.merchShop) s.merchShop = [];
    let pressed = 0;
    for (const sel of selections) {
      const tmpl = MERCH_TEMPLATES.find(t => t.type === sel.type);
      if (!tmpl) continue;
      const unitCost = tmpl.baseCost + sel.variantCostMod + sel.editionCostMod;
      const setup = Math.max(40, Math.floor(unitCost * 25));
      const finalPrice = tmpl.basePrice + sel.variantPriceMod + sel.editionPriceMod;
      const variantTag = sel.variantName && sel.variantName !== "Standard Black" && sel.variantName !== "Standard Jewel Case" && sel.variantName !== "Black Shell" ? ` (${sel.variantName})` : "";
      const editionTag = sel.editionName && sel.editionName !== "Standard" ? ` — ${sel.editionName}` : "";
      const item: MerchItem = {
        id: "m" + Date.now() + Math.random().toString(36).slice(2,5) + pressed,
        type: sel.type,
        name: tmpl.defaultName(rel.title, s.artistName) + variantTag + editionTag,
        emoji: tmpl.emoji,
        tiedToReleaseId: releaseId,
        tiedToReleaseTitle: rel.title,
        price: finalPrice,
        cost: unitCost,
        releasedWeek: s.week,
        weeklySales: [],
        totalSold: 0,
        totalRevenue: 0,
        reviews: [],
        active: true,
        variantName: sel.variantName,
        variantColor: sel.variantColor,
        editionLabel: sel.editionName && sel.editionName !== "Standard" ? sel.editionName : undefined,
      };
      s.money -= setup;
      s.merchShop.unshift(item);
      pressed++;
    }
    s.log.unshift({ week: s.week, msg: `Pressed ${pressed} format${pressed===1?"":"s"} of "${rel.title}" — ${fmtMoney(totalSetup)} setup`, type: "good" });
    s.pendingPressing = null;
    s.pendingEvent = { msg: `${pressed} pressing${pressed===1?"":"s"} live for "${rel.title}".`, type: "good" };
    // touch helpers so TS sees they're referenced
    void getPressingVariants; void isPhysicalFormat; void MERCH_EDITIONS;
    return s;
  }), [upd]);

  const doToggleMerchItem = useCallback((id: string) => upd(s => {
    const it = s.merchShop?.find(m => m.id === id);
    if (it) it.active = !it.active;
    return s;
  }), [upd]);

  const doRemoveMerchItem = useCallback((id: string) => upd(s => {
    s.merchShop = (s.merchShop ?? []).filter(m => m.id !== id);
    return s;
  }), [upd]);

  const doTakeStudioBreak = useCallback(()=>upd(s=>{
    if (!s.project || s.project.weeksLeft === 0) return s;
    s.project.studioBreakThisWeek = true;
    s.project.pushThroughThisWeek = false;
    return s;
  }),[upd]);

  const doPushThrough = useCallback(()=>upd(s=>{
    if (!s.project || s.project.weeksLeft === 0) return s;
    s.project.pushThroughThisWeek = true;
    s.project.studioBreakThisWeek = false;
    return s;
  }),[upd]);

  const doCancelStudioChoice = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    s.project.studioBreakThisWeek = false;
    s.project.pushThroughThisWeek = false;
    return s;
  }),[upd]);

  const doAbortTour = useCallback(()=>upd(s=>{
    if (!s.tourActive) return s;
    const remaining = s.tourActive.shows.length - s.tourActive.progress;
    if (remaining === 0) { s.tourActive = null; return s; }
    // Rep penalty scales with how many shows you bail on.
    const repPenalty = Math.min(12, 2 + remaining * 2);
    s.rep = clamp(s.rep - repPenalty, 0, 100);
    // Cutting the road short means real rest — meaningful burnout + energy recovery.
    s.burnout = clamp((s.burnout ?? 0) - 20, 0, 100);
    s.energy = clamp(s.energy + 15, 0, 100);
    s.tourActive = null;
    s.log.unshift({ week: s.week, msg: `Pulled off the road. ${remaining} show${remaining===1?"":"s"} cancelled. -${repPenalty} rep. Got some rest.`, type: "bad" });
    s.pendingEvent = { msg: `Tour ended early — ${remaining} show${remaining===1?"":"s"} cut. -${repPenalty} rep.`, type: "bad" };
    return s;
  }), [upd]);

  const doSwitchGenre = useCallback((genre:Genre)=>upd(s=>{
    s.genre=genre; s.rep=clamp(s.rep-10,0,100);
    // Superfans signed up for who you were. A pivot loses ~25% of them.
    const sfLost = Math.floor((s.superfans ?? 0) * 0.25);
    if (sfLost > 0) {
      s.superfans = Math.max(0, (s.superfans ?? 0) - sfLost);
      s.fans = Math.max(0, s.fans - sfLost);
    }
    const lostNote = sfLost > 0 ? ` -${fmt(sfLost)} superfans walked.` : "";
    s.pendingEvent={msg:`Now making ${genre} music. -10 rep.${lostNote}`,type:"bad"};
    return s;
  }),[upd]);

  return {
    state, hasSave, advance:doAdvance, doDismissEvent, dismissModal, dismissNewspaper, openArchivedNewspaper,
    doCloseReleasePresentation, doResolveScenario,
    goToMenu, goToSetup, loadGame, clearSave, startNewGame,
    doStartProject, doUpdateProject, doAddTrack, doRemoveTrack, doConfigureTrackStage,
    doFinishProject, doReleaseProject, doSubmitLabelRelease, doReviseLabelSubmission, doDeleteUnreleased, doReissueRelease, doScrubProject,
    doGrind, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour,
    doPromoteTrack, doShootMusicVideo,
    doSignBrandDeal, doSignLabel, doSwitchGenre,
    doAcceptLabelOffer, doDismissLabelOffers, doAcceptManagerOffer, doDismissManagerOffers,
    doAcceptFeatureRequest, doDismissFeatureRequests,
    doDropLabel, doDropManager,
    doAddMerchItem, doToggleMerchItem, doRemoveMerchItem,
    doDismissPressing, doQuickPress,
    doTakeVacation, doResolveArcChoice, doAbortTour,
    doAutoGenerateTracks,
    doTakeStudioBreak, doPushThrough, doCancelStudioChoice,
    doCloseTourWrapPresentation, doCloseSigningPresentation,
    doCloseAwardPresentation, doCloseMilestonePresentation,
    doSetSetlist,
    doAcceptOpeningAct, doDismissOpeningActOffers,
    doAcceptFestival, doDismissFestivalOffers,
    doAcceptPublishingOffer, doDismissPublishingOffers,
    doAcceptSyncOffer, doDismissSyncOffers,
  };
}
