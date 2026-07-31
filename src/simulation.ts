export interface SimulationMeta { seed: number; cursor: number; }

export interface SimulationCarrier { simulation: SimulationMeta; }

export function createSimulation(seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0): SimulationMeta {
  return { seed: seed || 1, cursor: 0 };
}

export function normalizeSimulation(value?: Partial<SimulationMeta> | null): SimulationMeta {
  const seed = Number.isInteger(value?.seed) ? Number(value?.seed) >>> 0 : createSimulation().seed;
  const cursor = Number.isInteger(value?.cursor) && Number(value?.cursor) >= 0 ? Number(value?.cursor) : 0;
  return { seed: seed || 1, cursor };
}

/** Run simulation work against a serializable PRNG while preserving the current rules. */
export function withSimulationRandom<T>(state: SimulationCarrier, run: () => T): { result: T; rolls: number } {
  const meta = normalizeSimulation(state.simulation);
  let seed = meta.seed;
  let rolls = 0;
  const originalRandom = Math.random;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    rolls++;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  try {
    const result = run();
    state.simulation = { seed, cursor: meta.cursor + rolls };
    return { result, rolls };
  } finally {
    Math.random = originalRandom;
  }
}
