import {
  ARCHETYPES,
  FEATURES,
  PRODUCERS,
  PRODUCER_THEMES,
  RECORDING_MODE_CONFIG,
  SONG_STAGES,
  clamp,
  getFeatureEffectiveCost,
  getFocusedSessionCost,
  getProducerRelationship,
  getProjectPipelineStage,
  getStudio,
  getTrackDevelopment,
  type GameState,
  type RecordingProject,
  type TrackEntry,
} from "./gameLogic";
import { burnoutQualityPenalty } from "./gameLogic";

const DIRECTION_EFFECTS = {
  commercial: { quality: -0.15, appeal: 0.75 },
  balanced: { quality: 0.20, appeal: 0.20 },
  artistic: { quality: 0.55, appeal: -0.25 },
} as const;

export interface TrackRatingBounds {
  quality: { min: number; max: number; expected: number };
  appeal: { min: number; max: number; expected: number };
  qualityBreakdown: Record<string, number>;
  appealBreakdown: Record<string, number>;
  hasUnresolvedRisk: boolean;
}

export interface RecordingSessionForecast {
  stage: ReturnType<typeof getProjectPipelineStage>;
  status: "recording" | "break" | "stalled" | "push_through" | "complete";
  studioCost: number;
  focusedCost: number;
  featureCost: number;
  labelFundCost: number;
  cashCost: number;
  energyChange: number;
  burnoutChange: number;
  trackRatings: Array<{ name: string; rating: TrackRatingBounds }>;
}

function archetypeQualityBonus(archetype: string) {
  const bonus = ARCHETYPES[archetype]?.bonus;
  const value = ARCHETYPES[archetype]?.bonusVal;
  const amount = typeof value === "number" ? value : 0;
  return ["selfProdQuality", "trackQualBonus", "acousticQBonus"].includes(bonus) ? amount / 10 : 0;
}

function rounded(value: number) {
  return Number(value.toFixed(1));
}

/** Computes final-rating bounds without consuming random simulation rolls. */
export function getTrackRatingBounds(
  state: GameState,
  project: RecordingProject,
  track: TrackEntry,
): TrackRatingBounds {
  const development = getTrackDevelopment(track);
  const producer = PRODUCERS.find(item => item.id === project.producerId);
  const studio = getStudio(project.studioId);
  const relationship = producer ? getProducerRelationship(producer.id, state.producerWorkCounts) : null;
  const themeFit = producer && project.themeId && (PRODUCER_THEMES[producer.id] ?? []).includes(project.themeId) ? 0.35 : 0;
  const stages = SONG_STAGES.map(stage => development[stage]);
  let qualityRiskLow = 0;
  let qualityRiskHigh = 0;
  let appealRiskLow = 0;
  let appealRiskHigh = 0;
  let hasUnresolvedRisk = false;
  const directionQuality = stages.reduce((sum, pass) => {
    const riskScale = pass.investment === "focused" ? 0.65 : 1;
    if (pass.direction === "artistic" && pass.riskQuality === undefined) {
      qualityRiskLow -= 1.5 * riskScale;
      qualityRiskHigh += 1.5 * riskScale;
      appealRiskLow -= 0.65 * riskScale;
      appealRiskHigh += 0.65 * riskScale;
      hasUnresolvedRisk = true;
    }
    return sum + DIRECTION_EFFECTS[pass.direction].quality + (pass.riskQuality ?? 0);
  }, 0);
  const directionAppeal = stages.reduce((sum, pass) => sum + DIRECTION_EFFECTS[pass.direction].appeal + (pass.riskAppeal ?? 0), 0);
  const focused = stages.filter(pass => pass.investment === "focused").length;
  const craft = 1.55 + state.qualityBase * 0.06;
  const team = (producer?.qB ?? 0) * 0.045 + (studio?.qB ?? 0) * 0.035 + (relationship?.qBonus ?? 0) * 0.04 + themeFit;
  const choices = directionQuality + focused * 0.22 + (track.cowriterId ? 0.30 : 0);
  const condition = archetypeQualityBonus(state.archetype) + burnoutQualityPenalty(state.burnout ?? 0) / 10 - 0.2 * (project.pushThroughCount ?? 0) + RECORDING_MODE_CONFIG[project.mode ?? "standard"].qualityMod / 10;
  const quality = craft + team + choices + condition;
  const appeal = 3.5 + (producer?.tier ?? 0) * 0.13 + (studio?.tier ?? 0) * 0.09 + directionAppeal + focused * 0.10 + (track.featId ? 0.45 : 0) + (track.cowriterId ? 0.12 : 0);
  const boundedQuality = (value: number) => rounded(clamp(value, 1, 10));
  const boundedAppeal = (value: number) => rounded(clamp(value, 1, 10));
  return {
    quality: { min: boundedQuality(quality + qualityRiskLow), max: boundedQuality(quality + qualityRiskHigh), expected: boundedQuality(quality) },
    appeal: { min: boundedAppeal(appeal + appealRiskLow), max: boundedAppeal(appeal + appealRiskHigh), expected: boundedAppeal(appeal) },
    qualityBreakdown: { craft: Number(craft.toFixed(2)), team: Number(team.toFixed(2)), choices: Number(choices.toFixed(2)), condition: Number(condition.toFixed(2)) },
    appealBreakdown: { direction: Number(directionAppeal.toFixed(2)), team: Number(((producer?.tier ?? 0) * 0.13 + (studio?.tier ?? 0) * 0.09).toFixed(2)), collaboration: Number(((track.featId ? 0.45 : 0) + (track.cowriterId ? 0.12 : 0)).toFixed(2)), focused: Number((focused * 0.10).toFixed(2)) },
    hasUnresolvedRisk,
  };
}

/** Mirrors the next weekly studio tick so players can see costs and consequences before committing. */
export function getRecordingSessionForecast(state: GameState): RecordingSessionForecast | null {
  const project = state.project;
  if (!project) return null;
  const stage = getProjectPipelineStage(project);
  const mode = RECORDING_MODE_CONFIG[project.mode ?? "standard"];
  const studio = getStudio(project.studioId);
  const studioCost = Math.floor((studio?.perWeek ?? 0) * mode.costMult);
  const focusedCost = stage === "complete" ? 0 : project.tracks.filter(track => getTrackDevelopment(track)[stage].investment === "focused").length * getFocusedSessionCost(studio?.tier ?? 0);
  const featureDiscount = ARCHETYPES[state.archetype]?.bonus === "featureCostDisc" && typeof ARCHETYPES[state.archetype]?.bonusVal === "number"
    ? ARCHETYPES[state.archetype].bonusVal as number
    : 1;
  const featureCost = stage === "recording"
    ? project.tracks.reduce((sum, track) => {
        const feature = track.featId ? FEATURES.find(item => item.id === track.featId) : undefined;
        return sum + (feature ? getFeatureEffectiveCost(feature, state.featureWorkCounts, featureDiscount) : 0);
      }, 0)
    : 0;
  const drain = ({ Single: 8, EP: 10, Album: 12, "Live Album": 7 } as const)[project.type];
  const exhausted = state.energy < drain;
  const status = stage === "complete" ? "complete"
    : project.studioBreakThisWeek ? "break"
    : exhausted && project.pushThroughThisWeek ? "push_through"
    : exhausted ? "stalled"
    : "recording";
  const progressing = status === "recording" || status === "push_through";
  const chargedFocusedCost = progressing ? focusedCost : 0;
  const chargedFeatureCost = progressing ? featureCost : 0;
  const totalCost = studioCost + chargedFocusedCost + chargedFeatureCost;
  const labelFund = project.labelFunding && state.currentLabel && !state.currentLabel.fundingFrozen
    ? Math.max(0, state.currentLabel.recordingFund - state.currentLabel.recordingFundUsed)
    : 0;
  const labelFundCost = Math.min(totalCost, labelFund);
  return {
    stage,
    status,
    studioCost,
    focusedCost: chargedFocusedCost,
    featureCost: chargedFeatureCost,
    labelFundCost,
    cashCost: totalCost - labelFundCost,
    energyChange: progressing ? -drain : 0,
    burnoutChange: status === "push_through" ? 12 : progressing ? 2 : 0,
    trackRatings: project.tracks.map(track => ({ name: track.name, rating: getTrackRatingBounds(state, project, track) })),
  };
}
