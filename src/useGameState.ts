// ═══════════════════════════════════════════════════════════════
// USEGAMESTATE EXAMPLE — Label System Wiring
// Copy/adapt these hooks into your actual useGameState.ts
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import {
  type GameState,
  type LabelOffer,
  type SignedLabel,
  INITIAL_STATE,
  generateLabelOffers,
  signLabel,
  runLabelAccounting,
  fmtMoney,
  recoupProgress,
  getStudio,
} from "./gameLogic";

import {
  calculateRecordingCost,
  resolveRecordingPayment,
  spendRecordingFund,
  payWeeklyStudioRent,
  canStartRecordingProject,
} from "./recording-fund";

import {
  processWeeklyLabelRevenue,
  checkLabelContractStatus,
  trackAlbumDelivery,
  maybeGenerateLabelOffers,
  computeLabelDrop,
} from "./label-weekly";

// ── STATE ────────────────────────────────────────────────────

export function useGameState() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [viewingOffer, setViewingOffer] = useState<LabelOffer | null>(null);
  const [signingPresentation, setSigningPresentation] = useState<SignedLabel | null>(null);
  const [dropPresentation, setDropPresentation] = useState<{
    label: SignedLabel;
    settlement: number;
    repLoss: number;
    wasDropped: boolean;
  } | null>(null);

  // ── LABEL OFFERS ───────────────────────────────────────────

  const doViewLabelOffer = useCallback((offer: LabelOffer) => {
    setViewingOffer(offer);
  }, []);

  const doDismissLabelOffers = useCallback(() => {
    setState((s) => ({
      ...s,
      pendingLabelOffers: [],
      log: [...s.log, { week: s.week, msg: "Declined all label offers.", type: "neutral" }],
    }));
  }, []);

  const doSignLabel = useCallback((offer: LabelOffer) => {
    setState((s) => {
      if (s.currentLabel) return s;
      const signed = signLabel(offer, s);
      return {
        ...s,
        currentLabel: signed,
        labelSigned: true,
        pendingLabelOffers: [],
        money: s.money + signed.advance,
        log: [
          ...s.log,
          {
            week: s.week,
            msg: `Signed with ${signed.name} for ${fmtMoney(signed.advance)} advance`,
            type: "great",
          },
        ],
      };
    });
    setViewingOffer(null);
    // Note: set signingPresentation in your component state after calling doSignLabel
    // Example: setSigningPresentation(signedLabel);
  }, []);

  const dismissSigning = useCallback(() => {
    setSigningPresentation(null);
  }, []);

  // ── DROP LABEL ─────────────────────────────────────────────

  const doDropLabel = useCallback(() => {
    setState((s) => {
      if (!s.currentLabel) return s;
      const result = computeLabelDrop(s);
      const newState = { ...s, ...result.newState };

      // Build log messages
      for (const msg of result.messages) {
        newState.log = [
          ...newState.log,
          { week: s.week, msg, type: result.settlementCost > 0 ? "bad" : "neutral" },
        ];
      }

      // Note: trigger drop presentation in your UI layer after state update

      return newState;
    });
  }, []);

  const dismissDrop = useCallback(() => {
    setDropPresentation(null);
  }, []);

  // ── WEEKLY TICK ────────────────────────────────────────────
  // Call this once per week. It handles ALL label-related weekly processing.

  const advanceWeek = useCallback(() => {
    setState((s) => {
      let newState = { ...s };
      const logs = [...s.log];

      // 1. Check contract status (expiration, options, suspension)
      const contractCheck = checkLabelContractStatus(s);
      if (contractCheck.newLabelState !== s.currentLabel) {
        newState.currentLabel = contractCheck.newLabelState;
        if (contractCheck.expired) {
          newState.labelSigned = false;
          // Note: trigger drop presentation in your UI layer
          // Example: setDropPresentation({ label: s.currentLabel, settlement: 0, repLoss: -5, wasDropped: true });
        }
      }
      for (const m of contractCheck.messages) {
        logs.push({ week: s.week, msg: m.msg, type: m.type });
      }

      // 2. Process weekly revenue through label
      // (Replace these with your actual revenue calculations)
      const weeklyRevenue = {
        streamingRevenue: 0,     // calculate from catalog
        tourGrossRevenue: 0,     // calculate from active tour
        tourNetRevenue: 0,       // after crew costs
        merchRevenue: 0,         // from merch sales
        syncRevenue: 0,          // from sync licenses
        publishingRevenue: 0,    // from songwriting
        brandDealIncome: s.activeBrandDeals.reduce((sum, d) => sum + d.weeklyIncome, 0),
      };

      const revResult = processWeeklyLabelRevenue(s, weeklyRevenue);
      newState.money += revResult.artistNetIncome;
      if (revResult.newLabelState) {
        newState.currentLabel = revResult.newLabelState;
      }
      for (const m of revResult.logMessages) {
        logs.push({ week: s.week, msg: m.msg, type: m.type });
      }

      // 3. Recording project weekly cost
      if (newState.project) {
        // Get actual studio cost from your studio data
        const studio = getStudio(state.project.studioId);
        const studioPerWeek = studio?.perWeek ?? 0;
        const rent = payWeeklyStudioRent(
          { id: "", name: "", city: "", tier: 0, perWeek: studioPerWeek, qB: 0, vibe: "", bio: "", repReq: 0, fanReq: 0 } as any,
          newState.currentLabel
        );
        newState.money -= rent.fromArtistPocket;
        if (newState.currentLabel && rent.fromLabelFund > 0) {
          newState.currentLabel = {
            ...newState.currentLabel,
            recordingFundUsed: rent.newLabelFundUsed,
          };
        }
        newState.project = { ...newState.project, weeksLeft: newState.project.weeksLeft - 1 };
      }

      // 4. Maybe generate label offers (every 4 weeks, or after releases)
      if (s.week % 4 === 0 || (s.totalReleases > 0 && s.weeksSinceRelease === 1)) {
        const offerResult = maybeGenerateLabelOffers(s);
        if (offerResult.newOffers.length > 0) {
          newState.pendingLabelOffers = [...s.pendingLabelOffers, ...offerResult.newOffers].slice(0, 3);
          if (offerResult.shouldNotify) {
            logs.push({
              week: s.week,
              msg: `${offerResult.newOffers.length} label offer${offerResult.newOffers.length > 1 ? "s" : ""} pending. Check the Deals tab.`,
              type: "great",
            });
          }
        }
      }

      // 5. Advance week counter
      newState.week += 1;
      newState.weeksSinceRelease += 1;
      newState.log = logs;

      return newState;
    });
  }, []);

  // ── START RECORDING PROJECT ────────────────────────────────

  const doStartRecordingProject = useCallback((
    producerId: string,
    studioId: string,
    weeks: number,
    getProducer: (id: string) => any,
    getStudio: (id: string) => any
  ) => {
    setState((s) => {
      const producer = getProducer(producerId);
      const studio = getStudio(studioId);
      if (!producer || !studio) return s;

      const check = canStartRecordingProject(s, producer, studio, weeks);
      if (!check.canAfford) {
        return {
          ...s,
          modal: {
            title: "Can't afford recording",
            body: check.message,
            confirmLabel: "OK",
          },
        };
      }

      const cost = calculateRecordingCost(
        { type: "Album", title: "", genre: s.genre, producerId, studioId, tracks: [], weeksLeft: weeks, totalWeeks: weeks, minTracks: 8, maxTracks: 14, marketingBudget: 0 },
        producer,
        studio,
        s.producerWorkCounts
      );
      const payment = resolveRecordingPayment(cost.totalCost, s.currentLabel);
      const newLabel = spendRecordingFund(s.currentLabel, payment.fromLabelFund);

      return {
        ...s,
        money: s.money - payment.fromArtistPocket,
        currentLabel: newLabel,
        project: {
          type: "Album",
          title: "", // user will name it
          genre: s.genre,
          producerId,
          studioId,
          tracks: [],
          weeksLeft: weeks,
          totalWeeks: weeks,
          minTracks: 8,
          maxTracks: 14,
          marketingBudget: 0,
        },
        log: [
          ...s.log,
          {
            week: s.week,
            msg: payment.fromLabelFund > 0
              ? `Started recording. Label fund paid ${fmtMoney(payment.fromLabelFund)}, you paid ${fmtMoney(payment.fromArtistPocket)}.`
              : `Started recording. Paid ${fmtMoney(payment.fromArtistPocket)} out of pocket.`,
            type: "neutral",
          },
        ],
      };
    });
  }, []);

  // ── FINISH RELEASE ─────────────────────────────────────────

  const doFinishRelease = useCallback(() => {
    setState((s) => {
      if (!s.project || s.project.tracks.length === 0) return s;

      // Track album delivery if signed
      const newLabel = trackAlbumDelivery(s);

      // ... your existing release logic ...
      // (compute quality, outcome, streams, etc.)
      // Then apply label marketing boost:
      // const boostedStreams = applyLabelMarketingBoost(s, baseStreams);

      return {
        ...s,
        currentLabel: newLabel,
        // ... rest of your release logic
      };
    });
  }, []);

  // ── RETURN ─────────────────────────────────────────────────

  return {
    state,
    setState,
    // Label actions
    doViewLabelOffer,
    doSignLabel,
    doDropLabel,
    doDismissLabelOffers,
    // Presentations
    viewingOffer,
    signingPresentation,
    dropPresentation,
    dismissSigning,
    dismissDrop,
    // Core loop
    advanceWeek,
    doStartRecordingProject,
    doFinishRelease,
  };
}
