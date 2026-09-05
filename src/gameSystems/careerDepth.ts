import { CITIES, clamp, getTrackDevelopment, type GameState, type ProjectDirection, type RecordingProject, type SongStrengths, type TrackEntry } from "../gameLogic";

export const PROJECT_DIRECTIONS: Record<ProjectDirection, { label: string; description: string; quality: number; appeal: number; lyrics: number; hook: number; live: number }> = {
  balanced: { label: "Balanced", description: "Keep the existing sound and let each song lead.", quality: 0, appeal: 0, lyrics: 0, hook: 0, live: 0 },
  intimate: { label: "Intimate", description: "Stronger lyrics and craft; less radio appeal.", quality: 0.35, appeal: -0.35, lyrics: 1.5, hook: -0.5, live: 0.3 },
  polished: { label: "Polished", description: "Stronger hooks and radio appeal; less raw live character.", quality: -0.15, appeal: 0.45, lyrics: -0.3, hook: 1.5, live: -0.7 },
  experimental: { label: "Experimental", description: "More craft, less immediate appeal. Artistic passes retain their risk.", quality: 0.55, appeal: -0.65, lyrics: 0.7, hook: -0.8, live: 0.5 },
  crowd_pleasing: { label: "Crowd-pleasing", description: "Built for the stage; stronger live connection, less studio finesse.", quality: -0.3, appeal: 0.1, lyrics: -0.5, hook: 0.5, live: 1.5 },
};

export function getProjectDirection(project: RecordingProject) {
  return PROJECT_DIRECTIONS[project.creativeDirection ?? "balanced"] ?? PROJECT_DIRECTIONS.balanced;
}

export function canChangeProjectDirection(project: RecordingProject): boolean {
  return project.tracks.every(track => {
    const development = getTrackDevelopment(track);
    return development.stage === "writing" && !development.writing.completed;
  });
}

/** Deterministic strengths derived from the creative choices, without extra rolls. */
export function getSongStrengths(track: TrackEntry, project?: RecordingProject): SongStrengths {
  const development = getTrackDevelopment(track);
  if (development.strengths) return development.strengths;
  // Existing released tracks retain neutral strengths and their original ratings.
  if (!project) return { lyrics: development.qualityRating ?? 5, hook: development.appealRating ?? 5, live: 5 };
  const direction = getProjectDirection(project);
  const score = (value: number) => Number(clamp(value, 1, 10).toFixed(1));
  return {
    lyrics: score(5 + direction.lyrics + (development.writing.direction === "artistic" ? 1.5 : development.writing.direction === "commercial" ? -0.5 : 0.3) + (track.cowriterId ? 0.5 : 0)),
    hook: score(5 + direction.hook + (development.writing.direction === "commercial" ? 1.5 : 0) + (development.mixing.direction === "commercial" ? 0.7 : 0)),
    live: score(5 + direction.live + (development.recording.direction === "balanced" ? 0.7 : development.recording.direction === "artistic" ? 0.4 : -0.2)),
  };
}

export function getRegionalDemand(state: GameState, cityName: string, week = state.week) {
  const city = CITIES.find(item => item.name === cityName);
  const shows = city ? Math.max(0, state.regional?.[city.region] ?? 0) : 0;
  const homeRegion = CITIES.find(item => item.name === state.city)?.region;
  const homeBonus = city && city.region === homeRegion ? 0.08 : 0;
  const followingBonus = Math.min(0.3, shows * 0.025);
  const lastPlayed = state.cityLastPlayed?.[cityName];
  const weeksAway = lastPlayed === undefined ? 8 : Math.max(0, week - lastPlayed);
  const returnPenalty = Math.max(0, (8 - weeksAway) / 8) * 0.3;
  return { multiplier: 1 + homeBonus + followingBonus - returnPenalty, shows, homeBonus, followingBonus, returnPenalty };
}

export function getLiveCatalogMultiplier(state: GameState): number {
  const tracks = state.catalog.flatMap(release => release.tracks).filter(track => track.development?.strengths);
  if (!tracks.length) return 1;
  const average = tracks.reduce((sum, track) => sum + getSongStrengths(track).live, 0) / tracks.length;
  return clamp(1 + (average - 5) * 0.025, 0.9, 1.125);
}

export function regionalDemandLabel(state: GameState, cityName: string): string {
  const demand = getRegionalDemand(state, cityName);
  const percent = Math.round((demand.multiplier - 1) * 100);
  return `Regional demand ${percent >= 0 ? "+" : ""}${percent}% · ${demand.shows} regional shows${demand.returnPenalty ? " · Recent visit: let demand recover" : demand.homeBonus ? " · Home region" : ""}`;
}
