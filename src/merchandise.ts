import { MERCH_TEMPLATES, fmtMoney, type GameState, type MerchItem, type MerchType } from "./gameLogic";
import { createGameEntityId } from "./stateIntegrity";

export function getMerchSetupCost(unitCost: number): number {
  return Math.max(40, Math.floor(unitCost * 25));
}

export function isValidMerchPrice(price: number): boolean {
  return Number.isSafeInteger(price) && price > 0;
}

export interface QuickPressSelection {
  type: MerchType;
  variantName: string;
  variantColor: string;
  variantPriceMod: number;
  variantCostMod: number;
  editionName: string;
  editionPriceMod: number;
  editionCostMod: number;
}

/** Applies a batch atomically, using the same quoted setup costs throughout. */
export function quickPressMerch(s: GameState, releaseId: string, selections: QuickPressSelection[]): GameState {
  if (s.currentLabel) { s.pendingPressing = null; s.pendingEvent={msg:`${s.currentLabel.name} manages merchandise while this contract is active.`,type:"neutral"}; return s; }
  const rel = s.catalog.find(c => c.id === releaseId);
  if (!rel) { s.pendingPressing = null; return s; }
  const pressings = selections.flatMap(sel => {
    const tmpl = MERCH_TEMPLATES.find(t => t.type === sel.type);
    if (!tmpl) return [];
    const unitCost = tmpl.baseCost + sel.variantCostMod + sel.editionCostMod;
    return [{ sel, tmpl, unitCost, setup: getMerchSetupCost(unitCost) }];
  });
  const totalSetup = pressings.reduce((sum, pressing) => sum + pressing.setup, 0);
  if (s.money < totalSetup) {
    s.pendingEvent = { msg: `Need ${fmtMoney(totalSetup)} to press these. You have ${fmtMoney(s.money)}.`, type: "bad" };
    return s;
  }
  if (!s.merchShop) s.merchShop = [];
  let pressed = 0;
  for (const { sel, tmpl, unitCost, setup } of pressings) {
    const finalPrice = tmpl.basePrice + sel.variantPriceMod + sel.editionPriceMod;
    const variantTag = sel.variantName && sel.variantName !== "Standard Black" && sel.variantName !== "Standard Jewel Case" && sel.variantName !== "Black Shell" ? ` (${sel.variantName})` : "";
    const editionTag = sel.editionName && sel.editionName !== "Standard" ? ` — ${sel.editionName}` : "";
    const item: MerchItem = {
      id: createGameEntityId(s, "merch"),
      type: sel.type,
      name: tmpl.defaultName(rel.title, s.artistName) + variantTag + editionTag,
      emoji: tmpl.emoji,
      tiedToReleaseId: releaseId,
      tiedToReleaseTitle: rel.title,
      price: finalPrice,
      cost: unitCost,
      releasedWeek: s.week,
      weeklySales: [],
      totalSold: 0,
      totalRevenue: 0,
      reviews: [],
      active: true,
      variantName: sel.variantName,
      variantColor: sel.variantColor,
      editionLabel: sel.editionName && sel.editionName !== "Standard" ? sel.editionName : undefined,
    };
    s.money -= setup;
    s.merchShop.unshift(item);
    pressed++;
  }
  s.log.unshift({ week: s.week, msg: `Pressed ${pressed} format${pressed===1?"":"s"} of "${rel.title}" — ${fmtMoney(totalSetup)} setup`, type: "good" });
  s.pendingPressing = null;
  s.pendingEvent = { msg: `${pressed} pressing${pressed===1?"":"s"} live for "${rel.title}".`, type: "good" };
  return s;
}
