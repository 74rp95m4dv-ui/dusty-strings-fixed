import { describe, expect, it } from "vitest";
import { INITIAL_STATE, type GameState } from "./gameLogic";
import { buildWeeklyEconomyLedger, calculateWeeklyOverhead, forecastRecurringEconomy } from "./weeklyEconomy";
import { advanceWithSimulation } from "./useGameState";

const clone = () => structuredClone(INITIAL_STATE) as GameState;
const baseEntry = { week: 2, cashDelta: 0, fanDelta: 0, fameDelta: 0, repDelta: 0, energyDelta: 0, burnoutDelta: 0, rolls: 0, highlights: [] };

describe("weekly economy", () => {
  it("uses one stable overhead formula", () => {
    expect(calculateWeeklyOverhead({ fans: 0, fame: 0, totalShows: 0 })).toBe(380);
    expect(calculateWeeklyOverhead({ fans: 50000, fame: 40, totalShows: 120 })).toBeGreaterThan(380);
  });

  it("reconciles categorized income and costs to the cash balance", () => {
    const before = clone();
    const after = clone();
    before.money = 1000;
    before.weeklyExpenses = 380;
    after.money = 1450;
    after.catalog = [{ id: "r1", weeklyRevenue: 900 } as any];
    const entry = buildWeeklyEconomyLedger(before, after, { ...baseEntry, cashDelta: 450 });
    const income = Object.values(entry.incomeByCategory ?? {}).reduce((sum, amount) => sum + amount, 0);
    const costs = Object.values(entry.costByCategory ?? {}).reduce((sum, amount) => sum + amount, 0);
    expect(entry.openingCash! + income - costs).toBe(entry.closingCash);
  });

  it("forecasts only predictable recurring money", () => {
    const state = clone();
    state.catalog = [{ weeklyRevenue: 500 } as any];
    state.activeBrandDeals = [{ id: "deal", name: "Deal", weeklyIncome: 300, weeksLeft: 4 }];
    state.weeklyExpenses = calculateWeeklyOverhead(state);
    const forecast = forecastRecurringEconomy(state);
    expect(forecast.market).toBe(500);
    expect(forecast.brands).toBe(300);
    expect(forecast.net).toBe(420);
  });

  it("stores a reconciled ledger entry after a real career week", () => {
    const state = clone();
    state.weeklyExpenses = calculateWeeklyOverhead(state);
    const next = advanceWithSimulation(state);
    const entry = next.weeklyLedger[0];
    const income = Object.values(entry.incomeByCategory ?? {}).reduce((sum, amount) => sum + amount, 0);
    const costs = Object.values(entry.costByCategory ?? {}).reduce((sum, amount) => sum + amount, 0);
    expect(entry.openingCash! + income - costs).toBe(entry.closingCash);
    expect(entry.closingCash).toBe(Math.round(next.money));
  });
});
