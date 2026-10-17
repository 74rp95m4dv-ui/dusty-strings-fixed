import { INITIAL_STATE, calculateSetlistSatisfaction, type GameState, type SetlistConfig, type SetlistSatisfaction } from "../gameLogic";

type TourContext = Pick<GameState, "tourActive" | "tourQueue">;

export function getSetlistSlots(state: TourContext): number {
  return (state.tourActive?.shows.length ?? state.tourQueue.length) > 5 ? 22 : 6;
}

export function getSavedSetlist(state: Pick<GameState, "setlistConfig">): SetlistConfig {
  return state.setlistConfig ?? INITIAL_STATE.setlistConfig;
}

export function getSetlistIssue(config: SetlistConfig, slots: number): string | null {
  const counts = [config.deepCutCount, config.hitCount, config.newMaterialCount];
  if (!counts.every(count => Number.isSafeInteger(count) && count >= 0)) {
    return "Setlist counts must be whole, non-negative numbers.";
  }
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total !== slots || config.totalSlots !== slots) {
    return `Setlist must have exactly ${slots} songs. You have ${total}.`;
  }
  return null;
}

export function getTourSetlistIssue(state: TourContext & Pick<GameState, "setlistConfig">): string | null {
  const slots = getSetlistSlots(state);
  return getSetlistIssue(getSavedSetlist(state), slots)
    ? `Save a valid ${slots}-song setlist in Live → Setlist before launching this tour.`
    : null;
}

/** These are the additive setlist rewards used by both the preview and shows. */
export function getSetlistRewards(satisfaction: SetlistSatisfaction) {
  return { rep: satisfaction.deepCutBonus, fans: satisfaction.hitBonus + satisfaction.newMaterialBonus };
}

export function saveSetlist(state: GameState, config: SetlistConfig): GameState {
  const slots = getSetlistSlots(state);
  const issue = getSetlistIssue(config, slots);
  if (issue) {
    state.pendingEvent = { msg: issue, type: "bad" };
    return state;
  }
  state.setlistConfig = { ...config };
  const sat = calculateSetlistSatisfaction(config, state.catalog, slots);
  state.pendingEvent = {
    msg: `Setlist saved: ${sat.label} (${sat.score}/100). ${sat.feedback}`,
    type: sat.score >= 75 ? "good" : "neutral",
  };
  return state;
}
