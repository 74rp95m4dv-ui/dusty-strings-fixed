export const SAVE_KEY = "dusty_strings_v1";
export const SAVE_BACKUP_KEY = `${SAVE_KEY}_backup`;
export const SAVE_VERSION = 1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveEnvelope<T> {
  version: typeof SAVE_VERSION;
  savedAt: string;
  state: T;
}

export type LoadResult<T> =
  | { kind: "empty" }
  | { kind: "success"; state: T; source: "primary" | "backup"; migrated: boolean; warning?: string }
  | { kind: "error"; message: string };

const TRANSIENT_STATE_KEYS = new Set([
  "pendingEvent", "modal", "pendingNewspaperJson", "releasePresentation", "tourWrapPresentation",
  "signingPresentation", "awardPresentation", "milestonePresentation", "pendingArcChoice",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGameSnapshot(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.week === "number" && typeof value.money === "number" &&
    typeof value.artistName === "string" && Array.isArray(value.catalog) && Array.isArray(value.unreleased);
}

export function createSaveEnvelope<T extends object>(state: T): SaveEnvelope<T> {
  const snapshot = { ...state } as Record<string, unknown>;
  for (const key of TRANSIENT_STATE_KEYS) delete snapshot[key];
  return { version: SAVE_VERSION, savedAt: new Date().toISOString(), state: snapshot as T };
}

function parseSave<T>(raw: string): { envelope?: SaveEnvelope<T>; migrated?: boolean; error?: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { error: "The save file is not an object." };
    if ("version" in parsed || "state" in parsed) {
      if (parsed.version !== SAVE_VERSION) return { error: "This save was created by a newer version of Dusty Strings." };
      if (!isRecord(parsed.state) || !isGameSnapshot(parsed.state)) return { error: "The save is incomplete." };
      return { envelope: parsed as unknown as SaveEnvelope<T> };
    }
    if (!isGameSnapshot(parsed)) return { error: "The legacy save is incomplete." };
    return { envelope: { version: SAVE_VERSION, savedAt: new Date(0).toISOString(), state: parsed as T }, migrated: true };
  } catch {
    return { error: "The save could not be read." };
  }
}

export function loadGameState<T extends object>(storage: StorageLike): LoadResult<T> {
  let primary: string | null;
  try { primary = storage.getItem(SAVE_KEY); } catch { return { kind: "error", message: "Browser storage is unavailable." }; }
  if (!primary) return { kind: "empty" };
  const parsed = parseSave<T>(primary);
  if (parsed.envelope) return { kind: "success", state: parsed.envelope.state, source: "primary", migrated: !!parsed.migrated };

  try {
    const backup = storage.getItem(SAVE_BACKUP_KEY);
    if (backup) {
      const restored = parseSave<T>(backup);
      if (restored.envelope) return {
        kind: "success", state: restored.envelope.state, source: "backup", migrated: !!restored.migrated,
        warning: `${parsed.error} A recent backup was restored instead.`,
      };
    }
  } catch { /* The primary error below is still actionable. */ }
  return { kind: "error", message: `${parsed.error} Your career has not been changed.` };
}

export function saveGameState<T extends object>(storage: StorageLike, state: T): boolean {
  try {
    const existing = storage.getItem(SAVE_KEY);
    if (existing && parseSave<T>(existing).envelope) storage.setItem(SAVE_BACKUP_KEY, existing);
    storage.setItem(SAVE_KEY, JSON.stringify(createSaveEnvelope(state)));
    return true;
  } catch {
    return false;
  }
}

export function clearGameState(storage: StorageLike) {
  storage.removeItem(SAVE_KEY);
  storage.removeItem(SAVE_BACKUP_KEY);
}

export function restoreBackupToPrimary<T extends object>(storage: StorageLike): LoadResult<T> {
  try {
    const raw = storage.getItem(SAVE_BACKUP_KEY);
    if (!raw) return { kind: "error", message: "No backup save is available." };
    const parsed = parseSave<T>(raw);
    if (!parsed.envelope) return { kind: "error", message: "The backup save is incomplete." };
    storage.setItem(SAVE_KEY, JSON.stringify(createSaveEnvelope(parsed.envelope.state)));
    return { kind: "success", state: parsed.envelope.state, source: "backup", migrated: !!parsed.migrated };
  } catch {
    return { kind: "error", message: "The backup could not be restored." };
  }
}
