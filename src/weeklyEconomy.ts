import { getStudio, RECORDING_MODE_CONFIG, type GameState, type WeeklyFinanceCategories, type WeeklyLedgerEntry } from "./gameLogic";

const add = (bucket: WeeklyFinanceCategories, key: string, amount: number) => {
  if (!Number.isFinite(amount) || Math.abs(amount) < 1) return;
  bucket[key] = Math.round((bucket[key] ?? 0) + amount);
};

export function calculateWeeklyOverhead(state: Pick<GameState, "fans" | "fame" | "totalShows">): number {
  return Math.max(380, Math.round(340 + state.fans * 0.008 + state.fame * 6 + state.totalShows * 0.12));
}

export function forecastRecurringEconomy(state: GameState) {
  const market = state.catalog.reduce((sum, release) => sum + Math.max(0, release.weeklyRevenue ?? 0), 0);
  const brands = state.activeBrandDeals.reduce((sum, deal) => sum + deal.weeklyIncome, 0) * (state.currentManager?.brandDealBoost ?? 1);
  const manager = state.currentManager?.weeklyFee ?? 0;
  const studio = state.project ? Math.floor((getStudio(state.project.studioId)?.perWeek ?? 0) * RECORDING_MODE_CONFIG[state.project.mode ?? "standard"].costMult) : 0;
  const overhead = calculateWeeklyOverhead(state);
  return { market: Math.round(market), brands: Math.round(brands), overhead, manager, studio, net: Math.round(market + brands - overhead - manager - studio) };
}

/** Builds a reconciled settlement entry without changing any gameplay formulas. */
export function buildWeeklyEconomyLedger(before: GameState, after: GameState, base: Omit<WeeklyLedgerEntry, "openingCash" | "closingCash" | "incomeByCategory" | "costByCategory">): WeeklyLedgerEntry {
  const income: WeeklyFinanceCategories = {};
  const costs: WeeklyFinanceCategories = {};
  add(income, "Music market", after.catalog.reduce((sum, release) => sum + Math.max(0, release.weeklyRevenue ?? 0), 0));
  add(income, "Publishing", Math.max(0, (after.totalPublishingRevenue ?? 0) - (before.totalPublishingRevenue ?? 0)));
  const brandMultiplier = before.currentManager?.brandDealBoost ?? 1;
  add(income, "Brand deals", before.activeBrandDeals.reduce((sum, deal) => sum + (deal.weeksLeft > 0 ? deal.weeklyIncome * brandMultiplier : 0), 0));
  add(income, "Merch", Math.max(0, (after.totalMerchRevenue ?? 0) - (before.totalMerchRevenue ?? 0)));
  const tour = after.tourHistory.find(show => show.week === after.week)?.net ?? 0;
  if (tour >= 0) add(income, "Tour net", tour); else add(costs, "Tour net loss", -tour);
  const festivalPay = after.festivalBookings.filter(booking => booking.completed && booking.performanceWeek === after.week).reduce((sum, booking) => sum + booking.pay, 0);
  add(income, "Festivals", festivalPay);
  add(costs, "Recurring overhead", before.weeklyExpenses);
  add(costs, "Manager", before.currentManager?.weeklyFee ?? 0);

  const knownNet = Object.values(income).reduce((sum, amount) => sum + amount, 0) - Object.values(costs).reduce((sum, amount) => sum + amount, 0);
  const remainder = Math.round(after.money - before.money - knownNet);
  if (remainder >= 0) add(income, "Other income", remainder); else add(costs, "Other costs", -remainder);

  return { ...base, openingCash: Math.round(before.money), closingCash: Math.round(after.money), incomeByCategory: income, costByCategory: costs };
}
