import { CITIES, type GameState } from "./gameLogic";
import { normalizeSimulation } from "./simulation";

const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const wholeAtLeast = (value: unknown, minimum: number) => Math.max(minimum, Math.floor(finite(value, minimum)));
const bounded = (value: unknown, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, finite(value, minimum)));

function uniqueById<T extends { id: string }>(items: T[] | undefined): T[] {
  const seen = new Set<string>();
  return (Array.isArray(items) ? items : []).filter(item => {
    if (!item || typeof item.id !== "string" || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function uniqueByKey<T>(items: T[] | undefined, keyFor: (item: T) => string | undefined): T[] {
  const seen = new Set<string>();
  return (Array.isArray(items) ? items : []).filter(item => {
    const key = keyFor(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Repairs values that can be made invalid by an older save, interrupted write, or
 * stale UI callback. It intentionally does not rebalance the game's economy.
 */
export function normalizeGameState(state: GameState): GameState {
  state.simulation = normalizeSimulation(state.simulation);
  state.week = wholeAtLeast(state.week, 1);
  state.currentYear = wholeAtLeast(state.currentYear, 1990);
  state.money = finite(state.money, 0);
  state.fans = wholeAtLeast(state.fans, 0);
  state.superfans = Math.min(state.fans, wholeAtLeast(state.superfans, 0));
  state.totalStreams = wholeAtLeast(state.totalStreams, 0);
  state.totalEarned = wholeAtLeast(state.totalEarned, 0);
  state.energy = bounded(state.energy, 0, 100);
  state.fame = bounded(state.fame, 0, 100);
  state.rep = bounded(state.rep, 0, 100);
  state.hype = bounded(state.hype, 0, 100);
  state.burnout = bounded(state.burnout, 0, 100);
  state.marketSaturation = bounded(state.marketSaturation, 0, 100);
  state.tourMorale = bounded(finite(state.tourMorale, 100), 0, 100);
  state.tourFatigue = wholeAtLeast(state.tourFatigue, 0);
  state.tourVenue = wholeAtLeast(state.tourVenue, 1);
  state.tourTicketMult = bounded(state.tourTicketMult, 0.5, 2.5);
  state.vacationCooldown = wholeAtLeast(state.vacationCooldown, 0);
  state.lastBusBreakdownWeek = wholeAtLeast(state.lastBusBreakdownWeek, 0);
  state.cooldowns = Object.fromEntries(Object.entries(state.cooldowns ?? {}).map(([id, value]) => [id, wholeAtLeast(value, 0)]));

  state.catalog = uniqueById(state.catalog);
  state.unreleased = uniqueById(state.unreleased);
  state.merchShop = uniqueById(state.merchShop);
  state.activeBrandDeals = uniqueById(state.activeBrandDeals);
  state.awardsWon = [...new Set((state.awardsWon ?? []).filter(Boolean))];
  state.completedArcs = [...new Set((state.completedArcs ?? []).filter(Boolean))];
  state.completedFestivals = [...new Set((state.completedFestivals ?? []).filter(Boolean))];
  state.festivalBookings = uniqueByKey(state.festivalBookings, booking => booking?.festivalId);
  state.pendingFestivalOffers = uniqueByKey(state.pendingFestivalOffers, booking => booking?.festivalId);
  state.weeklyLedger = (Array.isArray(state.weeklyLedger) ? state.weeklyLedger : []).slice(0, 16);

  if (state.project) {
    const project = state.project;
    project.minTracks = wholeAtLeast(project.minTracks, 1);
    project.maxTracks = Math.max(project.minTracks, wholeAtLeast(project.maxTracks, project.minTracks));
    const names = new Set<string>();
    project.tracks = (Array.isArray(project.tracks) ? project.tracks : []).filter(track => {
      const name = track?.name?.trim();
      if (!name || names.has(name.toLocaleLowerCase()) || names.size >= project.maxTracks) return false;
      track.name = name;
      names.add(name.toLocaleLowerCase());
      return true;
    });
    project.weeksLeft = wholeAtLeast(project.weeksLeft, 0);
    project.totalWeeks = Math.max(project.weeksLeft, wholeAtLeast(project.totalWeeks, 1));
  }

  const cityNames = new Set(CITIES.map(city => city.name));
  const queueNames = new Set<string>();
  state.tourQueue = (Array.isArray(state.tourQueue) ? state.tourQueue : []).filter(stop => {
    if (!stop || !cityNames.has(stop.cityName) || queueNames.has(stop.cityName)) return false;
    queueNames.add(stop.cityName);
    return true;
  });
  if (state.tourActive) {
    const shows = state.tourActive.shows.filter(stop => stop && cityNames.has(stop.cityName));
    if (!shows.length) state.tourActive = null;
    else {
      state.tourActive.shows = shows;
      state.tourActive.progress = Math.min(shows.length - 1, wholeAtLeast(state.tourActive.progress, 0));
      state.tourActive.ticketMult = bounded(state.tourActive.ticketMult, 0.5, 2.5);
      state.tourActive.demandDecayIndex = wholeAtLeast(state.tourActive.demandDecayIndex, 0);
    }
  }

  if (state.pendingReissue && !state.catalog.some(release => release.id === state.pendingReissue?.releaseId)) state.pendingReissue = null;
  if (state.pendingLabelSubmission && !state.unreleased.some(project => project.id === state.pendingLabelSubmission?.projectId)) state.pendingLabelSubmission = null;
  return state;
}

/** Stable within a simulation seed/cursor while still being unique for each action. */
export function createGameEntityId(state: Pick<GameState, "week" | "simulation">, prefix: string): string {
  const entropy = Math.floor(Math.random() * 0xffffffff).toString(36);
  return `${prefix}_${state.week.toString(36)}_${state.simulation.cursor.toString(36)}_${entropy}`;
}
