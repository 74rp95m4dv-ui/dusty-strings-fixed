import { describe, expect, it } from "vitest";
import { SAVE_BACKUP_KEY, SAVE_KEY, createSaveEnvelope, loadGameState, saveGameState, type StorageLike } from "./persistence";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const career = { week: 8, money: 4200, artistName: "June Carter", catalog: [], unreleased: [], pendingEvent: { msg: "temporary" } };

describe("career persistence", () => {
  it("wraps a save in a versioned envelope and omits transient UI state", () => {
    const envelope = createSaveEnvelope(career);
    expect(envelope.version).toBe(1);
    expect(envelope.state).not.toHaveProperty("pendingEvent");
  });

  it("loads a legacy raw save and marks it for migration", () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify(career));
    const result = loadGameState<typeof career>(storage);
    expect(result).toMatchObject({ kind: "success", migrated: true, source: "primary" });
  });

  it("preserves simulation and ledger metadata in current saves", () => {
    const storage = new MemoryStorage();
    const state = { ...career, simulation: { seed: 42, cursor: 7 }, weeklyLedger: [{ week: 8, rolls: 3 }] };
    saveGameState(storage, state);
    const result = loadGameState<typeof state>(storage);
    expect(result).toMatchObject({ kind: "success" });
    if (result.kind === "success") expect(result.state.simulation).toEqual({ seed: 42, cursor: 7 });
  });

  it("keeps a valid last-known-good backup and restores it after corruption", () => {
    const storage = new MemoryStorage();
    saveGameState(storage, career);
    saveGameState(storage, { ...career, week: 9 });
    expect(storage.getItem(SAVE_BACKUP_KEY)).not.toBeNull();
    storage.setItem(SAVE_KEY, "not-json");
    const result = loadGameState<typeof career>(storage);
    expect(result).toMatchObject({ kind: "success", source: "backup" });
    if (result.kind === "success") expect(result.state.week).toBe(8);
  });

  it("rejects incomplete and future-version saves without throwing", () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 99, state: career }));
    expect(loadGameState<typeof career>(storage)).toMatchObject({ kind: "error" });
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, state: { week: 1 } }));
    expect(loadGameState<typeof career>(storage)).toMatchObject({ kind: "error" });
  });
});
