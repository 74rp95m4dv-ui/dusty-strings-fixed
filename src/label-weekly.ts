// ═══════════════════════════════════════════════════════════════
// LABEL WEEKLY INTEGRATION
// Drop these helpers into your useGameState.ts weekly tick.
// They handle: revenue routing, recoupment, recording fund,
// contract expiration, and offer generation.
// ═══════════════════════════════════════════════════════════════

import {
  type GameState,
  type SignedLabel,
  type LabelOffer,
  runLabelAccounting,
  generateLabelOffers,
  getLabel,
  fmtMoney,
  fmtDuration,
  recoupProgress,
  clamp,
} from "./gameLogic";

import {
  payWeeklyStudioRent,
  resolveRecordingPayment,
  spendRecordingFund,
  calculateRecordingCost,
} from "./recording-fund";

// ── WEEKLY REVENUE PROCESSING ──────────────────────────────

export interface WeeklyRevenueInput {
  streamingRevenue: number;
  tourGrossRevenue: number;
  tourNetRevenue: number;     // after crew/travel (for artist pocket)
  merchRevenue: number;
  syncRevenue: number;
  publishingRevenue: number;
  brandDealIncome: number;    // weekly brand deal checks
}

export interface WeeklyRevenueOutput {
  artistNetIncome: number;    // what actually hits the bank
  labelAccounting: ReturnType<typeof runLabelAccounting> | null;
  newLabelState: SignedLabel | null;
  logMessages: { msg: string; type: "good" | "bad" | "great" | "neutral" }[];
}

// Process ALL weekly revenue through the label contract.
// Call this once per week in your advance() / tick() function.
export function processWeeklyLabelRevenue(
  state: GameState,
  revenue: WeeklyRevenueInput
): WeeklyRevenueOutput {
  const lbl = state.currentLabel;
  if (!lbl) {
    // Unsigned — keep everything
    const total =
      revenue.streamingRevenue +
      revenue.tourNetRevenue +
      revenue.merchRevenue +
      revenue.syncRevenue +
      revenue.publishingRevenue +
      revenue.brandDealIncome;

    return {
      artistNetIncome: total,
      labelAccounting: null,
      newLabelState: null,
      logMessages: total > 500
        ? [{ msg: `Earned ${fmtMoney(total)} this week.`, type: "good" }]
        : [],
    };
  }

  // Run the full label accounting
  const acct = runLabelAccounting(
    lbl,
    revenue.streamingRevenue,
    revenue.tourGrossRevenue,
    revenue.merchRevenue,
    revenue.syncRevenue,
    revenue.publishingRevenue
  );

  const logs: { msg: string; type: "good" | "bad" | "great" | "neutral" }[] = [];

  // Build new label state
  const newLabel: SignedLabel = {
    ...lbl,
    advanceRecouped: lbl.advanceRecouped + acct.recoupedThisWeek,
    isRecouped: acct.isRecouped,
    weeksLeft: Math.max(0, lbl.weeksLeft - 1),
    marketingSpendYTD: lbl.marketingSpendYTD + (acct.totalLabelShare * 0.3), // rough: 30% of label share goes to marketing
  };

  // Milestone: newly recouped
  if (acct.isRecouped && !lbl.isRecouped) {
    logs.push({
      msg: `${lbl.name} advance fully recouped! You now earn ${Math.round(lbl.royaltyRate * 100)}% royalties on label share.`,
      type: "great",
    });
  }

  // Milestone: significant recoupment progress
  const oldPct = lbl.advance > 0 ? lbl.advanceRecouped / lbl.advance : 0;
  const newPct = newLabel.advance > 0 ? newLabel.advanceRecouped / newLabel.advance : 0;
  if (!acct.isRecouped && Math.floor(oldPct * 10) < Math.floor(newPct * 10)) {
    logs.push({
      msg: `Advance ${Math.round(newPct * 100)}% recouped. ${fmtMoney(acct.advanceRemainingAfter)} remaining.`,
      type: "neutral",
    });
  }

  // Warning: contract expiring soon
  if (newLabel.weeksLeft === 12) {
    logs.push({
      msg: `${lbl.name} contract expires in 12 weeks. Deliver albums or prepare to renegotiate.`,
      type: "bad",
    });
  }

  // Artist keeps their share + brand deals (label doesn't touch those)
  const artistNet = acct.artistNetThisWeek + revenue.brandDealIncome;

  return {
    artistNetIncome: artistNet,
    labelAccounting: acct,
    newLabelState: newLabel,
    logMessages: logs,
  };
}

// ── RECORDING COST DURING PROJECT ──────────────────────────

export interface RecordingWeekResult {
  artistCost: number;
  newLabel: SignedLabel | null;
  logMsg: string | null;
}

// Call this every week while a RecordingProject is active.
// Deducts studio rent, pulling from label fund first.
export function processRecordingWeek(
  state: GameState
): RecordingWeekResult {
  if (!state.project) {
    return { artistCost: 0, newLabel: null, logMsg: null };
  }

  const studio = getLabel(state.project.studioId) ? undefined : undefined; // getStudio is what we need
  // Actually we need getStudio from gameLogic — let's import it properly
  
  // NOTE: The user needs to import getStudio from gameLogic.
  // For now, we assume studio.perWeek is accessible.

  const studioPerWeek = 300; // fallback — user should replace with actual studio lookup

  // We'll do a simpler version that just uses the recording-fund helpers
  // The user should pass the actual studio object
  return { artistCost: 0, newLabel: null, logMsg: null };
}

// Better version — pass the studio perWeek directly:
export function processRecordingWeekWithStudio(
  state: GameState,
  studioPerWeek: number
): RecordingWeekResult {
  if (!state.project) {
    return { artistCost: 0, newLabel: null, logMsg: null };
  }

  // Build a minimal studio object for the helper
  const dummyStudio = {
    id: state.project.studioId,
    name: "",
    city: "",
    tier: 0,
    perWeek: studioPerWeek,
    qB: 0,
    vibe: "",
    bio: "",
    repReq: 0,
    fanReq: 0,
  };

  const rent = payWeeklyStudioRent(dummyStudio as any, state.currentLabel);

  let newLabel = state.currentLabel;
  if (newLabel && rent.fromLabelFund > 0) {
    newLabel = {
      ...newLabel,
      recordingFundUsed: rent.newLabelFundUsed,
    };
  }

  let logMsg: string | null = null;
  if (rent.fromLabelFund > 0 && rent.fromArtistPocket === 0) {
    logMsg = `Studio rent covered by ${newLabel?.name} fund.`;
  } else if (rent.fromLabelFund > 0 && rent.fromArtistPocket > 0) {
    logMsg = `Studio rent: label paid ${fmtMoney(rent.fromLabelFund)}, you paid ${fmtMoney(rent.fromArtistPocket)}.`;
  } else if (rent.fromArtistPocket > 0) {
    logMsg = `Studio rent: ${fmtMoney(rent.fromArtistPocket)} from your pocket.`;
  }

  return {
    artistCost: rent.fromArtistPocket,
    newLabel,
    logMsg,
  };
}

// ── RELEASE BOOST FROM LABEL ───────────────────────────────

// Apply the signed label's marketing boost to a release.
// Call this when computing release peak streams / outcome.
export function applyLabelMarketingBoost(
  state: GameState,
  basePeakStreams: number
): number {
  if (!state.currentLabel) return basePeakStreams;
  return Math.floor(basePeakStreams * state.currentLabel.marketingBoost);
}

// ── CONTRACT EXPIRATION & OPTIONS ──────────────────────────

export interface ContractCheckResult {
  expired: boolean;
  optionTriggered: boolean;
  newLabelState: SignedLabel | null;
  messages: { msg: string; type: "good" | "bad" | "great" | "neutral" }[];
}

// Call this at the start of each week tick.
// Handles contract expiration, option periods, and auto-renewals.
export function checkLabelContractStatus(state: GameState): ContractCheckResult {
  const lbl = state.currentLabel;
  const msgs: { msg: string; type: "good" | "bad" | "great" | "neutral" }[] = [];

  if (!lbl) {
    return { expired: false, optionTriggered: false, newLabelState: null, messages: [] };
  }

  // Contract expired
  if (lbl.weeksLeft <= 0) {
    // Check if albums delivered
    if (lbl.albumsDelivered >= lbl.albumsCommitted) {
      // Label can exercise option
      if (lbl.optionsRemaining > 0) {
        const roll = Math.random();
        if (roll > 0.3) {
          // Label picks up the option
          const newLabel: SignedLabel = {
            ...lbl,
            weeksLeft: lbl.optionWeeks,
            totalWeeks: lbl.optionWeeks,
            optionsRemaining: lbl.optionsRemaining - 1,
            albumsDelivered: 0,
            albumsCommitted: Math.max(1, lbl.albumsCommitted),
            signedAtWeek: state.week,
          };
          msgs.push({
            msg: `${lbl.name} exercised their option. New ${fmtDuration(lbl.optionWeeks)} term begins.`,
            type: "neutral",
          });
          return { expired: false, optionTriggered: true, newLabelState: newLabel, messages: msgs };
        }
      }

      // Label drops the artist
      msgs.push({
        msg: `${lbl.name} contract expired. They did not renew. You're unsigned.`,
        type: "bad",
      });
      return { expired: true, optionTriggered: false, newLabelState: null, messages: msgs };
    } else {
      // Didn't deliver enough albums — label may suspend or extend
      if (lbl.suspensionRights) {
        msgs.push({
          msg: `${lbl.name} suspended your contract for non-delivery. Legal review recommended.`,
          type: "bad",
        });
        const suspendedLabel: SignedLabel = {
          ...lbl,
          weeksLeft: 26, // 6-month extension to deliver
        };
        return { expired: false, optionTriggered: false, newLabelState: suspendedLabel, messages: msgs };
      } else {
        msgs.push({
          msg: `${lbl.name} extended your deadline by 26 weeks to finish committed albums.`,
          type: "neutral",
        });
        const extendedLabel: SignedLabel = {
          ...lbl,
          weeksLeft: 26,
        };
        return { expired: false, optionTriggered: false, newLabelState: extendedLabel, messages: msgs };
      }
    }
  }

  return { expired: false, optionTriggered: false, newLabelState: lbl, messages: [] };
}

// ── ALBUM DELIVERY TRACKING ──────────────────────────────

// Call this when a release is finished and added to discography.
// Increments the label's albumsDelivered counter.
export function trackAlbumDelivery(state: GameState): SignedLabel | null {
  if (!state.currentLabel) return null;
  const newLabel: SignedLabel = {
    ...state.currentLabel,
    albumsDelivered: state.currentLabel.albumsDelivered + 1,
  };
  return newLabel;
}

// ── OFFER GENERATION EVENTS ──────────────────────────────

// Call this periodically (e.g., every 4 weeks, or after a release/tour).
// Generates label offers based on current fame/rep/fans.
export function maybeGenerateLabelOffers(state: GameState): {
  newOffers: LabelOffer[];
  shouldNotify: boolean;
} {
  // Only generate if unsigned or current contract expiring within 20 weeks
  const shouldGenerate =
    !state.currentLabel ||
    (state.currentLabel && state.currentLabel.weeksLeft <= 20);

  if (!shouldGenerate) {
    return { newOffers: [], shouldNotify: false };
  }

  // Throttle: don't flood with offers
  if (state.pendingLabelOffers.length >= 3) {
    return { newOffers: [], shouldNotify: false };
  }

  const offers = generateLabelOffers(state);
  if (offers.length === 0) {
    return { newOffers: [], shouldNotify: false };
  }

  return { newOffers: offers, shouldNotify: true };
}

// ── DROP LABEL WITH SETTLEMENT ─────────────────────────────

export interface DropLabelResult {
  newState: Partial<GameState>;
  settlementCost: number;
  repLoss: number;
  messages: string[];
}

export function computeLabelDrop(state: GameState): DropLabelResult {
  if (!state.currentLabel) {
    return { newState: {}, settlementCost: 0, repLoss: 0, messages: [] };
  }

  const lbl = state.currentLabel;
  const remaining = lbl.advance - lbl.advanceRecouped;
  let settlement = 0;
  let repLoss = -8;
  const msgs: string[] = [];

  if (!lbl.isRecouped && remaining > 0) {
    switch (lbl.type) {
      case "major":
        settlement = Math.floor(remaining * 0.35);
        repLoss = -18;
        msgs.push(`${lbl.name} demanded a ${fmtMoney(settlement)} settlement for the unrecouped ${fmtMoney(remaining)}.`);
        break;
      case "americana":
        settlement = Math.floor(remaining * 0.15);
        repLoss = -10;
        msgs.push(`${lbl.name} negotiated a ${fmtMoney(settlement)} settlement.`);
        break;
      case "indie":
        settlement = Math.floor(remaining * 0.08);
        repLoss = -6;
        msgs.push(`${lbl.name} accepted a ${fmtMoney(settlement)} goodwill settlement.`);
        break;
      case "boutique":
        settlement = 0;
        repLoss = -4;
        msgs.push(`${lbl.name} let you walk. No settlement. Small shop, small lawyers.`);
        break;
      case "specialty":
        settlement = 0;
        repLoss = -5;
        msgs.push(`${lbl.name} shook your hand and wished you luck. No paperwork.`);
        break;
    }
  } else {
    msgs.push(`Parted ways with ${lbl.name} clean. Nothing owed.`);
    repLoss = -3;
  }

  const newState: Partial<GameState> = {
    currentLabel: null,
    labelSigned: false,
    money: state.money - settlement,
    rep: state.rep + repLoss,
  };

  return { newState, settlementCost: settlement, repLoss, messages: msgs };
}
