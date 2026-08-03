import { describe, expect, it } from "vitest";
import { createSimulation, withSimulationRandom } from "./simulation";
import { INITIAL_STATE, buildChart } from "./gameLogic";
import { advanceWithSimulation } from "./useGameState";

describe("career simulation", () => {
  it("replays the same random sequence from the same seed", () => {
    const first = { simulation: createSimulation(12345) };
    const second = { simulation: createSimulation(12345) };
    const a = withSimulationRandom(first, () => [Math.random(), Math.random(), Math.random()]);
    const b = withSimulationRandom(second, () => [Math.random(), Math.random(), Math.random()]);
    expect(a.result).toEqual(b.result);
    expect(first.simulation).toEqual(second.simulation);
    expect(a.rolls).toBe(3);
  });

  it("does not leave Math.random patched after a simulation run", () => {
    const original = Math.random;
    withSimulationRandom({ simulation: createSimulation(7) }, () => Math.random());
    expect(Math.random).toBe(original);
  });

  it("keeps the advanced PRNG state on the returned weekly snapshot", () => {
    const first = structuredClone({ ...INITIAL_STATE, simulation: createSimulation(99) });
    const second = structuredClone({ ...INITIAL_STATE, simulation: createSimulation(99) });
    const nextFirst = advanceWithSimulation(first);
    const nextSecond = advanceWithSimulation(second);
    expect(nextFirst.simulation.cursor).toBeGreaterThan(0);
    expect(nextFirst.simulation).toEqual(nextSecond.simulation);
    expect(nextFirst.week).toBe(2);
  });

  it("keeps the chart stable when the same week is rendered again", () => {
    expect(buildChart([], 12)).toEqual(buildChart([], 12));
  });
});
