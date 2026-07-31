import { describe, expect, it } from "vitest";
import { createSimulation, withSimulationRandom } from "./simulation";

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
});
