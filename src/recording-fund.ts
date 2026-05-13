// ═══════════════════════════════════════════════════════════════
// RECORDING FUND SYSTEM
// Integrates with the realistic label contract system.
// When signed to a label, recording costs pull from the label's
// recording fund first. Only when the fund is exhausted does the
// artist pay out of pocket.
// ═══════════════════════════════════════════════════════════════

import {
  type Studio,
  type Producer,
  type SignedLabel,
  type GameState,
  type RecordingProject,
  getStudio,
  getProducerEffectiveCost,
  fmtMoney,
} from "./gameLogic";

// ── COST CALCULATION ───────────────────────────────────────

export interface RecordingCostBreakdown {
  producerFee: number;
  studioFee: number;
  totalCost: number;
  weeks: number;
}

// Calculate the total cost to record a project.
export function calculateRecordingCost(
  project: RecordingProject,
  producer: Producer,
  studio: Studio,
  producerCounts: Record<string, number> | undefined | null
): RecordingCostBreakdown {
  const producerFee = getProducerEffectiveCost(producer, producerCounts);
  const studioFee = studio.perWeek * project.totalWeeks;
  return {
    producerFee,
    studioFee,
    totalCost: producerFee + studioFee,
    weeks: project.totalWeeks,
  };
}

// ── PAYMENT SOURCE ───────────────────────────────────────────

export interface PaymentResult {
  fromLabelFund: number;
  fromArtistPocket: number;
  totalPaid: number;
  labelFundRemaining: number;
  labelFundUsed: number;
  fullyCoveredByLabel: boolean;
}

// Determine how a recording cost gets paid.
// If signed and recording fund remains: label pays first.
// Artist covers any shortfall.
export function resolveRecordingPayment(
  totalCost: number,
  label: SignedLabel | null
): PaymentResult {
  if (!label) {
    // Unsigned — artist pays everything
    return {
      fromLabelFund: 0,
      fromArtistPocket: totalCost,
      totalPaid: totalCost,
      labelFundRemaining: 0,
      labelFundUsed: 0,
      fullyCoveredByLabel: false,
    };
  }

  const fundRemaining = label.recordingFund - label.recordingFundUsed;
  const fromLabel = Math.min(fundRemaining, totalCost);
  const fromArtist = totalCost - fromLabel;
  const newUsed = label.recordingFundUsed + fromLabel;

  return {
    fromLabelFund: fromLabel,
    fromArtistPocket: fromArtist,
    totalPaid: totalCost,
    labelFundRemaining: label.recordingFund - newUsed,
    labelFundUsed: newUsed,
    fullyCoveredByLabel: fromArtist === 0,
  };
}

// ── STATE UPDATER ──────────────────────────────────────────

// Returns a new SignedLabel with updated recordingFundUsed,
// or null if unsigned.
export function spendRecordingFund(
  label: SignedLabel | null,
  amountFromFund: number
): SignedLabel | null {
  if (!label || amountFromFund <= 0) return label;
  return {
    ...label,
    recordingFundUsed: label.recordingFundUsed + amountFromFund,
  };
}

// ── WEEKLY STUDIO COST (for ongoing projects) ────────────────

// During an active recording project, each week incurs studio rent.
// This also pulls from the label fund if available.
export interface WeeklyStudioPayment {
  weeklyRent: number;
  fromLabelFund: number;
  fromArtistPocket: number;
  newLabelFundUsed: number;
}

export function payWeeklyStudioRent(
  studio: Studio,
  label: SignedLabel | null
): WeeklyStudioPayment {
  const weeklyRent = studio.perWeek;
  const fundRemaining = label ? label.recordingFund - label.recordingFundUsed : 0;
  const fromLabel = Math.min(fundRemaining, weeklyRent);
  const fromArtist = weeklyRent - fromLabel;

  return {
    weeklyRent,
    fromLabelFund: fromLabel,
    fromArtistPocket: fromArtist,
    newLabelFundUsed: label ? label.recordingFundUsed + fromLabel : 0,
  };
}

// ── UI HELPERS ─────────────────────────────────────────────

export interface FundStatus {
  hasLabel: boolean;
  fundTotal: number;
  fundUsed: number;
  fundRemaining: number;
  fundPctUsed: number;
  artistPocket: number;
  displayText: string;
  color: string;
}

export function getRecordingFundStatus(state: GameState): FundStatus {
  const lbl = state.currentLabel;
  if (!lbl) {
    return {
      hasLabel: false,
      fundTotal: 0,
      fundUsed: 0,
      fundRemaining: 0,
      fundPctUsed: 0,
      artistPocket: state.money,
      displayText: `Your money: ${fmtMoney(state.money)}`,
      color: "var(--ink)",
    };
  }

  const remaining = lbl.recordingFund - lbl.recordingFundUsed;
  const pctUsed = lbl.recordingFund > 0 ? lbl.recordingFundUsed / lbl.recordingFund : 0;
  const color = pctUsed > 0.9 ? "var(--rust)" : pctUsed > 0.6 ? "var(--amber)" : "var(--sage)";

  return {
    hasLabel: true,
    fundTotal: lbl.recordingFund,
    fundUsed: lbl.recordingFundUsed,
    fundRemaining: remaining,
    fundPctUsed: pctUsed,
    artistPocket: state.money,
    displayText: `${fmtMoney(remaining)} label fund • ${fmtMoney(state.money)} your money`,
    color,
  };
}

// ── PROJECT START VALIDATION ───────────────────────────────

export interface StartProjectCheck {
  canAfford: boolean;
  totalCost: number;
  fromLabel: number;
  fromArtist: number;
  shortfall: number;
  message: string;
}

// Check if the artist can afford to start a recording project.
// Call this BEFORE deducting money.
export function canStartRecordingProject(
  state: GameState,
  producer: Producer,
  studio: Studio,
  weeks: number
): StartProjectCheck {
  // Build a dummy project to calculate cost
  const dummyProject: RecordingProject = {
    type: "Album",
    title: "",
    genre: state.genre,
    producerId: producer.id,
    studioId: studio.id,
    tracks: [],
    weeksLeft: weeks,
    totalWeeks: weeks,
    minTracks: 1,
    maxTracks: 1,
    marketingBudget: 0,
  };

  const cost = calculateRecordingCost(
    dummyProject,
    producer,
    studio,
    state.producerWorkCounts
  );

  const payment = resolveRecordingPayment(cost.totalCost, state.currentLabel);
  const shortfall = payment.fromArtistPocket - state.money;

  if (shortfall > 0) {
    return {
      canAfford: false,
      totalCost: cost.totalCost,
      fromLabel: payment.fromLabelFund,
      fromArtist: payment.fromArtistPocket,
      shortfall,
      message: `Need ${fmtMoney(shortfall)} more. Label covers ${fmtMoney(payment.fromLabelFund)}, you need ${fmtMoney(payment.fromArtistPocket)} but only have ${fmtMoney(state.money)}.`,
    };
  }

  return {
    canAfford: true,
    totalCost: cost.totalCost,
    fromLabel: payment.fromLabelFund,
    fromArtist: payment.fromArtistPocket,
    shortfall: 0,
    message: payment.fullyCoveredByLabel
      ? `Fully covered by ${state.currentLabel?.name} recording fund.`
      : `Label pays ${fmtMoney(payment.fromLabelFund)}, you pay ${fmtMoney(payment.fromArtistPocket)}.`,
  };
}
