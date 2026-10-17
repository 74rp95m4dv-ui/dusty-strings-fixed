import { describe, expect, it } from "vitest";
import { INITIAL_STATE, fmtMoney, type GameState } from "./gameLogic";
import { getMerchSetupCost, isValidMerchPrice, quickPressMerch, type QuickPressSelection } from "./merchandise";

function career(money: number): GameState {
  const state = structuredClone(INITIAL_STATE);
  state.money = money;
  state.catalog = [{
    id: "release-1", title: "Test Album", type: "Album", genre: "Country",
    quality: 75, outcome: "Moderate", lifecycle: "Normal", decayRate: 0.9,
    streamFloor: 0, weeklyStreams: 1000, peakStreams: 1000, totalStreams: 1000,
    releasedWeek: 1, weeksActive: 1, promoted: false, comebackCooldown: 0,
    tracks: [], hasMusicVideo: false,
  }];
  return state;
}

const vinyl: QuickPressSelection = {
  type: "Vinyl", variantName: "Translucent Blue", variantColor: "#3a6fa6",
  variantPriceMod: 5, variantCostMod: 2, editionName: "Limited Edition",
  editionPriceMod: 8, editionCostMod: 2,
};

describe("merchandise pricing", () => {
  it("allows pressing with exactly the setup funds, even below the old affordability threshold", () => {
    // Vinyl costs $9 + $2 color + $2 edition per unit; setup is $325.
    const state = career(325);
    quickPressMerch(state, "release-1", [vinyl]);
    expect(state.money).toBe(0);
    expect(state.merchShop).toHaveLength(1);
    expect(state.merchShop[0]).toMatchObject({ cost: 13, price: 43 });
    expect(state.log[0].msg).toContain(`${fmtMoney(325)} setup`);
  });

  it("rejects the entire batch one dollar below the required funds", () => {
    const state = career(399);
    const cd = { ...vinyl, type: "CD" as const, variantCostMod: 0, editionCostMod: 0 };
    quickPressMerch(state, "release-1", [vinyl, cd]);
    expect(state.money).toBe(399);
    expect(state.merchShop).toHaveLength(0);
    expect(state.pendingEvent).toMatchObject({ type: "bad" });
    expect(state.pendingEvent?.msg).toContain(`Need ${fmtMoney(400)}`);
  });

  it("deducts and reports the same total for multiple pressings", () => {
    const state = career(1000);
    const cd = { ...vinyl, type: "CD" as const, variantCostMod: 0, editionCostMod: 0 };
    quickPressMerch(state, "release-1", [vinyl, cd]);
    expect(state.money).toBe(600);
    expect(state.merchShop).toHaveLength(2);
    expect(state.log[0].msg).toContain("Pressed 2 formats");
    expect(state.log[0].msg).toContain(`${fmtMoney(400)} setup`);
  });

  it("preserves the $40 minimum setup and whole-dollar rounding", () => {
    expect(getMerchSetupCost(1)).toBe(40);
    expect(getMerchSetupCost(3.99)).toBe(99);
    const state = career(40);
    quickPressMerch(state, "release-1", [{
      ...vinyl, type: "Sticker Pack", variantCostMod: 0, editionCostMod: 0,
    }]);
    expect(state.money).toBe(0);
    expect(state.log[0].msg).toContain(`${fmtMoney(40)} setup`);
  });

  it.each([0, -1, 25.5, NaN, Infinity, -Infinity])("rejects invalid selling price %s", price => {
    expect(isValidMerchPrice(price)).toBe(false);
  });

  it.each([1, 25, 100])("accepts positive whole-dollar selling price %s", price => {
    expect(isValidMerchPrice(price)).toBe(true);
  });
});
