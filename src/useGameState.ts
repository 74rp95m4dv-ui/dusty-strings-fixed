import { useState, useCallback } from "react";
import {
  GameState, Genre, ReleaseType, SongLifecycle,
  INITIAL_STATE, ARCHETYPES, CITIES, PRODUCERS, FEATURES, getFeature, getFeatureEffectiveCost, generateFeatureRequest,
  GRIND_ACTIONS, BRAND_DEALS, AWARDS, CRITIC_REVIEWS, RANDOM_SCENARIOS,
  ScenarioEffect, CatalogEntry, TourStop,
  RIVALS, RivalState, STORY_ARCS, getStoryArc, ArcInstance, StoryArc,
  Award, TourWrapPresentation, SigningPresentation, AwardPresentation, CareerMilestonePresentation,
  CAREER_TIERS, getCareerTierIdx,
  burnoutQualityPenalty, burnoutShowMult, burnoutCancelChance, getBurnoutTier, pickRivalTitle,
  MerchType, MerchItem, MERCH_TEMPLATES, generateMerchReview,
  getPressingVariants, isPhysicalFormat, MERCH_EDITIONS, priceDemandMultiplier,
  STUDIOS, getStudio,
  THEMES, getSignatureTheme, pickTrendTheme,
  TREND_THEME_SCORE_MULT, TREND_THEME_FAN_MULT,
  PRODUCER_THEMES, PRODUCER_SPECIALTY_QUALITY_BONUS,
  getProducerRelationship, getProducerEffectiveCost,
  computeTrackWritingQuality, computeAlbumWritingMix, producerStyleBonus,
  getHook, getLyric,
  LABELS, MANAGERS, getLabel, getManager,
  generateLabelOffers, generateManagerOffers,
  rnd, roll, clamp, fmt, fmtMoney,
  genAlbumName, genFanReviews,
  // Recording time system (v2.0)
  RecordingMode, calculateRecordingWeeks, getStandardRecordingWeeks,
  STUDIO_TIME_MODIFIERS, PRODUCER_TIME_MODIFIERS, RECORDING_MODE_CONFIG,
  BASE_WEEKS_BY_FORMAT,
  // Streaming platform system (v2.0)
  STREAMING_PLATFORMS, BASE_STREAMING_RATE, GEO_RATE_MODIFIERS, PREMIUM_SPLIT, PREMIUM_MULTIPLIER,
  SPOTIFY_MIN_STREAMS, DEFAULT_GEO_DIST,
} from "./gameLogic";
import { generateNashvilleTimes } from "./nashvilleTimes";

const SAVE_KEY = "dusty_strings_v1";

function archHas(arch: string, bonus: string) { return ARCHETYPES[arch]?.bonus === bonus; }
function archVal(arch: string): number { const v = ARCHETYPES[arch]?.bonusVal; return typeof v === "number" ? v : 1; }
function tourCostMult(arch: string) { return archHas(arch,"tourCostDiscount") ? archVal(arch) : 1; }
function showRevBonus(arch: string, managerPct: number) { return (archHas(arch,"midwestShowBonus") ? 1 : 1) * (1 + managerPct); }
function evergreenMult(arch: string) { return archHas(arch,"evergreenBoost") ? archVal(arch) : 1; }
function featCostMult(arch: string) { return archHas(arch,"featureCostDisc") ? archVal(arch) : 1; }
function applyArchQuality(arch: string, q: number) {
  if (archHas(arch,"selfProdQuality")) q += archVal(arch);
  if (archHas(arch,"trackQualBonus"))  q += archVal(arch);
  if (archHas(arch,"acousticQBonus"))  q += archVal(arch);
  return q;
}

function calcTourDemand(fans:number, fame:number, rep:number, genreMod:Record<string,number>, genre:Genre, decayIdx:number) {
  const base = fans*0.06 + fame*50 + rep*20;
  const gMod = genreMod[genre] ?? 1.0;
  return Math.floor(base * gMod * Math.max(0.5, 1 - decayIdx*0.04));
}
function calcFill(demand:number, cap:number, mult:number) {
  return Math.min(1, (demand/cap) * (mult<=0.7?1.15 : 1.0 - Math.max(0,mult-1.0)*0.2));
}
function calcCrewCost(tier:number) { return ({1:120,2:180,3:280,4:450,5:750,6:1500,7:3500} as Record<number,number>)[tier]??120; }

function calcStreamRevenue(catalog:CatalogEntry[], streamCut:number) {
  const total = catalog.reduce((s,t)=>s+t.weeklyStreams,0);
  // Real-world blended streaming rate: ~$0.0032/stream after platform variance
  // Distributor takes ~15% off the top, then label takes their cut
  const blendedRate = 0.0032;
  const grossRevenue = total * blendedRate;
  const afterDistro = grossRevenue * 0.85; // 15% distributor fee
  return Math.floor(afterDistro * (1 - streamCut));
}

function classifyLifecycle(quality:number, outcome:string, mkt:number, score:number, arch:string): SongLifecycle {
  const roll2 = Math.random()*100;
  const adj = roll2
    + Math.max(0,(quality-50)/10)*3
    + (({Flop:-20,Moderate:0,Hit:15,Viral:30} as Record<string,number|undefined>)[outcome] ?? 0)
    + Math.min(8,mkt/2500)
    + Math.max(0,(score-60)/4);
  const evT = archHas(arch,"evergreenBoost") ? Math.round(92/evergreenMult(arch)) : 92;
  if (adj >= evT) return "Evergreen";
  if (adj >= 72)  return "Hit";
  return "Normal";
}

function runAwardCheck(s:GameState): Award|null {
  for (const award of AWARDS) {
    if (s.awardsWon.includes(award.id)) continue;
    if (s.fame>=award.fameReq && s.rep>=award.repReq && Math.random()<0.08) {
      s.awardsWon.push(award.id);
      s.money += award.money; s.fame=clamp(s.fame+award.famePerk,0,100); s.rep=clamp(s.rep+award.repPerk,0,100);
      s.log.unshift({week:s.week,msg:`WON: ${award.name} — ${fmtMoney(award.money)}`,type:"great"});
      return award;
    }
  }
  return null;
}

function saveToDisk(s:GameState) { try { localStorage.setItem(SAVE_KEY,JSON.stringify(s)); } catch {} }
function loadFromDisk(): GameState|null { try { const r=localStorage.getItem(SAVE_KEY); return r?JSON.parse(r):null; } catch { return null; } }

// ─── RIVALS / ARCS HELPERS ─────────────────────────────────
function seedRivals(playerFame: number): RivalState[] {
  return RIVALS.map(r => ({
    id: r.id,
    fame: clamp(playerFame + r.startFameOffset, 0, 100),
    fans: r.startFans,
    rep: 35 + Math.floor(Math.random() * 30),
    relationship: r.personality === "friendly" ? +15
                : r.personality === "hostile"  ? -20
                : 0,
    weeksSinceRelease: 4 + Math.floor(Math.random() * 12),
    releasesCount: r.personality === "friendly" ? 8 : 4,
    lastReleaseTitle: null,
    lastReleaseQuality: 60,
    lastReleaseWeek: 0,
    awardsWon: r.personality === "friendly" ? 2 : 0,
    beefHeat: r.personality === "hostile" ? 18 : 0,
  }));
}

function tickRivals(s: GameState): void {
  if (!s.rivals?.length) return;
  for (let i = 0; i < s.rivals.length; i++) {
    const r = s.rivals[i];
    const def = RIVALS.find(x => x.id === r.id);
    if (!def) continue;
    r.weeksSinceRelease++;
    // Slow fan drift — friendly/legacy rivals stay steady, climbers grow,
    // hostile road dogs erode without releases.
    const drift =
      def.personality === "friendly"    ?  0.001
    : def.personality === "competitive" ?  0.004
    : def.personality === "hostile"     ? -0.002
    :                                       0.000;
    r.fans = Math.max(500, Math.floor(r.fans * (1 + drift + (Math.random() - 0.5) * 0.01)));
    // Fame oscillates around their tier baseline (set at seed).
    r.fame = clamp(r.fame + (Math.random() - 0.5) * 0.6, 0, 100);
    // Hostile rivals occasionally take public shots — small player rep ding.
    if (def.personality === "hostile" && r.beefHeat > 30 && Math.random() < 0.04) {
      s.rep = clamp(s.rep - 1, 0, 100);
      s.log.unshift({ week: s.week, msg: `${def.name} took a shot at you in an interview. -1 rep.`, type: "bad" });
    }
    // Hostile beefHeat decays slowly.
    if (r.beefHeat > 0) r.beefHeat = Math.max(0, r.beefHeat - 0.5);
    // Releases on a 9-15 week cadence depending on personality.
    const cadence = def.personality === "competitive" ? 9
                  : def.personality === "friendly"    ? 14
                  :                                     12;
    if (r.weeksSinceRelease >= cadence + Math.floor(Math.random() * 4)) {
      const title = pickRivalTitle(def.genre, Math.random);
      const q = clamp(55 + def.craftBias + (Math.random() * 30 - 15), 25, 95);
      r.lastReleaseTitle = title;
      r.lastReleaseQuality = q;
      r.lastReleaseWeek = s.week;
      r.releasesCount++;
      r.weeksSinceRelease = 0;
      // Scene buzz from a strong rival drop nudges market saturation up
      // (it's noisy out there) and bumps rival fans modestly.
      const fanG = Math.floor(r.fans * (q > 75 ? 0.04 : q > 60 ? 0.02 : 0.005));
      r.fans += fanG;
      if (q > 70) {
        s.marketSaturation = Math.min(100, (s.marketSaturation ?? 0) + 4);
      }
      s.log.unshift({
        week: s.week,
        msg: `${def.name} dropped "${title}" — ${q > 75 ? "critics raving" : q > 55 ? "solid reception" : "muted reaction"}.`,
        type: q > 70 ? "neutral" : "good",
      });
      // Competitive rivals taunt you when they outchart you.
      if (def.personality === "competitive" && q > 70 && r.fans > s.fans) {
        r.beefHeat = Math.min(100, r.beefHeat + 12);
      }
    }
    // Periodic award wins for legend-tier rivals.
    if (def.personality === "friendly" && Math.random() < 0.005) {
      r.awardsWon++;
      s.log.unshift({ week: s.week, msg: `${def.name} won another award. The Bluebird is buzzing.`, type: "neutral" });
    }
  }
}

function refreshInboundOffers(s: GameState): void {
  if (!s.currentManager && (!s.pendingManagerOffers || s.pendingManagerOffers.length === 0)) {
    const offers = generateManagerOffers(s);
    if (offers.length) {
      s.pendingManagerOffers = offers;
      s.log.unshift({ week: s.week, msg: `${offers.length} manager${offers.length > 1 ? "s" : ""} reached out.`, type: "good" });
    }
  }
  if (!s.currentLabel && (!s.pendingLabelOffers || s.pendingLabelOffers.length === 0)) {
    const offers = generateLabelOffers(s);
    if (offers.length) {
      s.pendingLabelOffers = offers;
      s.log.unshift({ week: s.week, msg: `${offers.length} label${offers.length > 1 ? "s" : ""} sent offers.`, type: "good" });
    }
  }
}

function tickArcs(s: GameState): { firedChoice: boolean } {
  if (!s.activeArcs?.length) return { firedChoice: false };
  for (const inst of s.activeArcs) {
    if (inst.currentStep < 0) continue;
    const arc = getStoryArc(inst.arcId);
    if (!arc) { inst.currentStep = -1; continue; }
    const step = arc.steps[inst.currentStep];
    if (!step) { inst.currentStep = -1; continue; }
    // Apply weekly passive effect (per week step is pending and not yet fired).
    if (step.passive && s.week < inst.fireOnWeek) {
      const e = step.passive;
      if (e.energy) s.energy = clamp(s.energy + e.energy, 0, 100);
      if (e.money)  s.money += e.money;
      if (e.rep)    s.rep   = clamp(s.rep + e.rep, 0, 100);
      if (e.fame)   s.fame  = clamp(s.fame + e.fame, 0, 100);
      if (e.fans)   s.fans  = Math.max(0, s.fans + e.fans);
      if (e.hype)   s.hype  = clamp(s.hype + e.hype, 0, 100);
    }
    // Fire the choice modal once we hit the trigger week.
    if (s.week >= inst.fireOnWeek && !s.pendingArcChoice && !s.pendingScenarioId) {
      s.pendingArcChoice = { arcId: inst.arcId, stepIndex: inst.currentStep };
      return { firedChoice: true };
    }
  }
  return { firedChoice: false };
}

function arcEligible(arc: StoryArc, s: GameState): boolean {
  if (s.completedArcs?.includes(arc.id)) return false;
  if (s.activeArcs?.some(a => a.arcId === arc.id && a.currentStep >= 0)) return false;
  const t = arc.trigger;
  if (!t) return true;
  if (t.minFame     !== undefined && s.fame          < t.minFame)     return false;
  if (t.maxFame     !== undefined && s.fame          > t.maxFame)     return false;
  if (t.minReleases !== undefined && s.totalReleases < t.minReleases) return false;
  if (t.minRep      !== undefined && s.rep           < t.minRep)      return false;
  if (t.minBurnout  !== undefined && (s.burnout ?? 0) < t.minBurnout) return false;
  if (t.minWeek     !== undefined && s.week          < t.minWeek)     return false;
  if (t.hasManager  !== undefined && t.hasManager !== !!s.currentManager) return false;
  if (t.hasEvergreen) {
    if (!s.catalog.some(c => c.lifecycle === "Evergreen")) return false;
  }
  return true;
}

function maybeSpawnArc(s: GameState): void {
  // Don't pile arcs on top of pending modals or active arcs.
  if (s.pendingArcChoice || s.pendingScenarioId) return;
  if (s.activeArcs?.some(a => a.currentStep >= 0)) return;
  // Low base spawn chance (~5%/week); higher if a long while since last arc.
  if (Math.random() > 0.06) return;
  const eligible = STORY_ARCS.filter(a => arcEligible(a, s));
  if (!eligible.length) return;
  const totalW = eligible.reduce((sum, a) => sum + a.weight, 0);
  let r = Math.random() * totalW;
  const chosen = eligible.find(a => { r -= a.weight; return r <= 0; }) ?? eligible[0];
  const firstStep = chosen.steps[0];
  const inst: ArcInstance = {
    arcId: chosen.id,
    startedWeek: s.week,
    currentStep: 0,
    fireOnWeek: s.week + (firstStep?.delay ?? 1),
    choicePath: [],
  };
  s.activeArcs = [...(s.activeArcs ?? []), inst];
  s.log.unshift({
    week: s.week,
    msg: `New chapter: ${chosen.title} — ${chosen.subtitle.toLowerCase()}.`,
    type: "neutral",
  });
}

// ─── ADVANCE WEEK ─────────────────────────────────────────
function advance(prev:GameState): GameState {
  const s:GameState = JSON.parse(JSON.stringify(prev));
  s.pendingEvent = null; s.modal = null;
  s.week++; s.weeksSinceRelease++;
  for (const k of Object.keys(s.cooldowns)) if(s.cooldowns[k]>0) s.cooldowns[k]--;
  // Burnout slowly recovers each week — but only meaningfully when not actively
  // grinding (touring counters this in the show block below).
  s.burnout = Math.max(0, (s.burnout ?? 0) - (s.tourActive ? 0.5 : 2));
  if ((s.vacationCooldown ?? 0) > 0) s.vacationCooldown--;
  s.marketSaturation = Math.max(0, (s.marketSaturation??0) - 5);
  s.hype   = Math.max(0,   s.hype-5);
  if (s.weeksSinceRelease>6) { s.fame=Math.max(0,s.fame-0.6); s.rep=Math.max(0,s.rep-0.2); }
  // Recording: studio fee charged every active week; energy drained & progress ticks only if not exhausted.
  // Energy regen (+20) happens AFTER this block so stall can trigger when artist ends a week too drained.
  if (s.project && s.project.weeksLeft > 0) {
    const recEnergy:Record<string,number>={Single:8,EP:10,Album:12,"Live Album":7};
    const drain = recEnergy[s.project.type] ?? 10;
    const mode = s.project.mode ?? "standard";
    const modeCfg = RECORDING_MODE_CONFIG[mode];

    // Studio fee is due regardless of whether the session makes progress
    // Mode may modify cost (Rush = 1.5× studio cost)
    const recStudio = getStudio(s.project.studioId);
    if (recStudio && recStudio.perWeek > 0) {
      const weeklyCost = Math.floor(recStudio.perWeek * modeCfg.costMult);
      s.money -= weeklyCost;
      s.log.unshift({week:s.week,msg:`Studio: ${recStudio.name} — ${fmtMoney(weeklyCost)}/wk${mode !== "standard" ? ` (${mode})` : ""}.`,type:"neutral"});
    }

    if (s.project.studioBreakThisWeek) {
      s.project.studioBreakThisWeek = false;
      s.log.unshift({week:s.week,msg:"Took a studio break this week. Energy recovering.",type:"neutral"});
      // weeksLeft does NOT tick; energy recovers naturally at end of week
    } else if (s.project.pushThroughThisWeek) {
      s.project.pushThroughThisWeek = false;
      if ((s.energy ?? 0) < drain) {
        // Actually exhausted — apply push-through penalties
        s.energy = Math.max(0, (s.energy ?? 0) - drain);
        s.burnout = Math.min(100, (s.burnout ?? 0) + 12);
        s.project.pushThroughCount = (s.project.pushThroughCount ?? 0) + 1;
        s.project.weeksLeft--;
        s.log.unshift({week:s.week,msg:"Pushed through exhaustion to record. Heavy burnout hit. Quality will suffer.",type:"bad"});
      } else {
        // Energy recovered before the tick — record normally, no penalty
        s.energy = Math.max(0, (s.energy ?? 0) - drain);
        s.burnout = Math.min(100, (s.burnout ?? 0) + 2);
        s.project.weeksLeft--;
      }
    } else if ((s.energy ?? 0) < drain) {
      s.log.unshift({week:s.week,msg:"Too exhausted to record this week. Rest up.",type:"bad"});
      // Project stalls — weeksLeft does NOT tick
    } else {
      s.energy = Math.max(0, (s.energy ?? 0) - drain);
      s.burnout = Math.min(100, (s.burnout ?? 0) + 2);
      s.project.weeksLeft--;
    }
  }
  // Weekly energy regen comes AFTER recording drain so exhaustion stall can trigger
  s.energy = Math.min(100, s.energy+20);
  if (!s.tourActive) s.tourFatigue = Math.max(0, s.tourFatigue-5);

  // Streaming
  const CBACK = {Normal:0.008,Hit:0.015,Evergreen:0.025};
  const CRESTORE = {Normal:[0.25,0.45],Hit:[0.40,0.70],Evergreen:[0.60,0.90]};
  for (const t of s.catalog) {
    t.weeksActive=(t.weeksActive||0)+1;
    if (t.comebackCooldown>0) t.comebackCooldown--;
    if (t.weeksActive>=8 && t.comebackCooldown===0) {
      const ch=(CBACK as any)[t.lifecycle]??0.008;
      if (Math.random()<ch) {
        const [lo,hi]=(CRESTORE as any)[t.lifecycle]??[0.25,0.45];
        t.weeklyStreams=Math.floor(t.peakStreams*(lo+Math.random()*(hi-lo)));
        t.comebackCooldown=12;
      }
    }
    const age=Math.max(0.6,1-t.weeksActive*0.005);
    t.weeklyStreams=Math.max(t.streamFloor,Math.floor(t.weeklyStreams*t.decayRate*age));
    t.totalStreams+=t.weeklyStreams; s.totalStreams+=t.weeklyStreams;

    // ── Platform mix evolution ──
    // As fame grows, Apple Music share increases (older, wealthier demo)
    // YouTube share grows with viral hits (younger demo)
    const baseMix = s.platformMix;
    const fameBonus = Math.min(0.15, s.fame * 0.002);
    t.platformMix = {
      spotify: Math.max(0.35, (baseMix.spotify ?? 0.52) - fameBonus * 0.4),
      apple: Math.min(0.35, (baseMix.apple ?? 0.22) + fameBonus * 0.6),
      amazon: Math.max(0.03, (baseMix.amazon ?? 0.12) - fameBonus * 0.1),
      youtube: Math.min(0.20, (baseMix.youtube ?? 0.09) + fameBonus * 0.3),
      tidal: baseMix.tidal ?? 0.02,
      deezer: baseMix.deezer ?? 0.02,
      pandora: baseMix.pandora ?? 0.01,
    };
    // Normalize to sum to 1
    const mixSum = Object.values(t.platformMix).reduce((a,b)=>a+b,0);
    if (mixSum > 0) {
      for (const k of Object.keys(t.platformMix)) {
        t.platformMix[k] = t.platformMix[k] / mixSum;
      }
    }

    // ── Geographic distribution evolution ──
    // Touring in a region boosts that region's share
    const tourRegionBoost = s.regional ?? {};
    t.geoDist = {...(s.geoDist ?? DEFAULT_GEO_DIST)};
    let geoTotal = Object.values(t.geoDist).reduce((a,b)=>a+b,0);
    for (const [region, count] of Object.entries(tourRegionBoost)) {
      if (count > 0) {
        const boost = Math.min(0.08, count * 0.015);
        // Find matching country code for region
        const regionMap: Record<string, string> = {
          "South": "US", "Deep South": "US", "Southeast": "US",
          "Southwest": "US", "Midwest": "US", "Midwest-South": "US",
        };
        const country = regionMap[region] ?? "US";
        if (t.geoDist[country] !== undefined) {
          t.geoDist[country] = Math.min(0.85, t.geoDist[country] + boost);
          // Reduce "other" to compensate
          t.geoDist["other"] = Math.max(0.02, t.geoDist["other"] - boost * 0.5);
        }
      }
    }
    // Normalize
    geoTotal = Object.values(t.geoDist).reduce((a,b)=>a+b,0);
    if (geoTotal > 0) {
      for (const k of Object.keys(t.geoDist)) {
        t.geoDist[k] = t.geoDist[k] / geoTotal;
      }
    }

    // ── Premium ratio evolution ──
    // Superfans = premium subscribers. More superfans = higher premium ratio.
    const sfRatio = s.fans > 0 ? (s.superfans ?? 0) / s.fans : 0;
    t.premiumRatio = Math.min(0.85, Math.max(0.35, 0.45 + sfRatio * 0.4));

    // Initialize streamStats if missing (legacy save compatibility)
    if (!t.streamStats) {
      t.streamStats = {
        totalStreams: t.totalStreams,
        weeklyStreams: t.weeklyStreams,
        peakStreams: t.peakStreams,
        totalRevenue: 0,
        weeklyRevenue: 0,
        platformBreakdown: {},
        geoBreakdown: {},
        effectiveRate: BASE_STREAMING_RATE,
        premiumRatio: t.premiumRatio,
        usShare: t.geoDist?.US ?? 0.6,
        hitThreshold: t.totalStreams >= SPOTIFY_MIN_STREAMS,
        revenueHistory: [],
      };
    }

    // Update streamStats totals
    t.streamStats.totalStreams = t.totalStreams;
    t.streamStats.weeklyStreams = t.weeklyStreams;
    t.streamStats.peakStreams = t.peakStreams;
  }
  const streamCutPct = s.currentLabel?.streamingCut ?? (s.labelSigned ? 0.18 : 0);  // streamingCut unchanged
  const streamInc = calcStreamRevenue(s.catalog, streamCutPct, s.platformMix, s.geoDist, s.premiumRatio, s.distributorFee);
  s.money+=streamInc; s.totalEarned+=streamInc;
  const curWeekStreams = s.catalog.reduce((t,c)=>t+c.weeklyStreams,0);
  s.streamHistory = [...(s.streamHistory??[]), curWeekStreams].slice(-104);
  s.peakWeeklyStreams = Math.max(s.peakWeeklyStreams??0, curWeekStreams);

  // Expenses
  s.money -= s.weeklyExpenses;

  // Manager: weekly retainer + small rep accrual
  if (s.currentManager) {
    s.money -= s.currentManager.weeklyFee;
    if (s.currentManager.repPerWeek > 0) {
      s.rep = clamp(s.rep + s.currentManager.repPerWeek, 0, 100);
    }
  }

  // Label contract countdown — when expired, drop the contract.
  if (s.currentLabel) {
    s.currentLabel.weeksLeft -= 1;
    if (s.currentLabel.weeksLeft <= 0) {
      s.log.unshift({ week:s.week, msg:`Contract with ${s.currentLabel.name} expired. You're a free agent.`, type:"neutral" });
      s.currentLabel = null;
      s.labelSigned = false;
    }
  }

  // Brand deals
  const brandMult = s.currentManager?.brandDealBoost ?? 1.0;
  let brandInc=0;
  s.activeBrandDeals = s.activeBrandDeals.map(d=>({...d,weeksLeft:d.weeksLeft-1})).filter(d=>{
    if(d.weeksLeft>=0){brandInc+=Math.floor(d.weeklyIncome * brandMult);return true;}
    s.log.unshift({week:s.week,msg:`Brand deal ended: ${d.name}`,type:"neutral"});
    return false;
  });
  s.money+=brandInc; s.totalEarned+=brandInc;

  // Tour show
  let notifMsg:string|null=null, notifType="norm";
  if (s.tourActive && s.tourActive.progress<s.tourActive.shows.length) {
    const show=s.tourActive.shows[s.tourActive.progress];
    // ── #3 Burnout: high tiers can force cancellations on the road ──
    const cancelChance = burnoutCancelChance(s.burnout ?? 0);
    if (cancelChance > 0 && Math.random() < cancelChance) {
      // Lost gig: cover travel/crew, ding rep, lose a few casual fans.
      const lost = show.travelCost + Math.floor(calcCrewCost(show.venueTier) * 0.5);
      s.money -= lost;
      s.rep = clamp(s.rep - 4, 0, 100);
      // Cancelled = forced rest. Reward a burnout recovery to soften the spiral.
      s.burnout = clamp((s.burnout ?? 0) - 12, 0, 100);
      s.energy = clamp(s.energy + 8, 0, 100);
      const tier = getBurnoutTier(s.burnout ?? 0);
      s.log.unshift({ week:s.week, msg:`CANCELLED: ${show.cityName} @ ${show.venueName} — ${tier.label.toLowerCase()}. -${fmtMoney(lost)} sunk costs. Got some rest.`, type:"bad" });
      s.tourActive.progress++;
      notifMsg = `Cancelled ${show.cityName} — you couldn't go on. Rest helped a little.`;
      notifType = "bad";
      if (s.tourActive.progress >= s.tourActive.shows.length) {
        s.tourActive = null;
        s.log.unshift({ week:s.week, msg:"Tour ended early.", type:"neutral" });
      }
    } else {
    const demand=calcTourDemand(s.fans,s.fame,s.rep,show.genreMod,s.genre,s.tourActive.demandDecayIndex);
    const burnoutMult = burnoutShowMult(s.burnout ?? 0);
    const fill=calcFill(demand,show.venueCap,s.tourActive.ticketMult) * burnoutMult;
    const seats=Math.floor(fill*show.venueCap);
    // Realistic indie ticket pricing by venue tier + fame premium
    const baseTicketByTier = [8, 12, 18, 25, 35, 55, 85];
    const tierBase = baseTicketByTier[Math.min(show.venueTier-1, 6)] || 10;
    const famePrem = Math.floor(s.fame * 0.8);
    const repPrem = Math.floor(s.rep * 0.15);
    const ticket = Math.max(tierBase, Math.floor((tierBase + famePrem + repPrem) * s.tourActive.ticketMult));
    // Door gross
    const doorGross = seats * ticket;
    // Merch per head: superfans spend 3-6x more than casuals
    const sfRatio = s.fans > 0 ? (s.superfans ?? 0) / s.fans : 0;
    const merchPerHead = Math.floor((3.50 + s.fame*0.08) * (1 + sfRatio*4) * ((show.genreMod[s.genre]??1)>1.2?1.15:1.0));
    const merchGross = seats * merchPerHead;
    // Venue guarantee (small rooms pay YOU, big rooms you pay or split door)
    const venueGuarantee = show.venueTier <= 2 ? Math.floor(roll(120, 350))
                         : show.venueTier === 3 ? Math.floor(roll(200, 600))
                         : -Math.floor(show.venueTier * 180);
    const totalGross = doorGross + merchGross + venueGuarantee;
    // Expenses: travel, lodging, food, vehicle, crew
    const people = 1 + 2; // artist + 2 crew minimum
    const lodgingPerPerson = show.venueTier <= 2 ? 55 : show.venueTier <= 4 ? 85 : 120;
    const lodging = lodgingPerPerson * people;
    const food = 28 * people;
    const travel = show.travelCost; // gas, tolls, van wear for this leg
    const vehicleFixed = 26; // van payment/insurance/maintenance per day
    const crewDayRate = [120, 180, 280, 450, 750, 1500, 3500][Math.min(show.venueTier-1, 6)] || 120;
    const crew = crewDayRate * 2;
    const totalExpenses = travel + lodging + food + vehicleFixed + crew;
    const mgrPct = s.currentManager?.showRevPct ?? (s.hasManager ? 0.15 : 0);
    const revMult=showRevBonus(s.archetype,mgrPct);
    const preCutNet = (totalGross - totalExpenses) * revMult;
    const tourCutPct = s.currentLabel?.tourGrossCut ?? (s.labelSigned ? 0.10 : 0);
    const labelCut = tourCutPct > 0 ? Math.floor(preCutNet * tourCutPct) : 0;
    const net = Math.floor(preCutNet - labelCut);
    s.money+=net; s.totalEarned+=Math.max(0,net);
    const fG=Math.floor(seats*0.3*((show.genreMod[s.genre]??1)>1.2?1.2:1));
    s.fans+=fG;
    // Live shows convert casuals → superfans (in-person bond). ~8% of attending
    // seats become superfans, scaled by fill (a packed room makes more loyalists).
    const casualsAvail = Math.max(0, s.fans - (s.superfans ?? 0));
    const sfG = Math.min(casualsAvail, Math.floor(seats * 0.08 * Math.max(0.4, fill)));
    s.superfans = (s.superfans ?? 0) + sfG;
    s.totalShows++; s.tourFatigue=Math.min(100,s.tourFatigue+10);
    s.tourActive.demandDecayIndex++;
    const repG=fill>=0.7?(archHas(s.archetype,"showRepBonus")?archVal(s.archetype)*3:3):fill>=0.4?1:-2;
    s.rep=clamp(s.rep+repG,0,100);
    if (!s.regional[show.region]) s.regional[show.region]=0;
    s.regional[show.region]++;
    if (!s.tourHistory) s.tourHistory=[];
    s.tourHistory.unshift({
      week:s.week, cityName:show.cityName, venueName:show.venueName,
      venueCap:show.venueCap, seats, attendancePct:Math.floor(fill*100),
      ticket, gross, crew, travelCost:show.travelCost, labelCut, net,
      totalExpenses,
    });
    if (s.tourHistory.length>50) s.tourHistory.length=50;
    const sfNote = sfG > 0 ? ` · +${fmt(sfG)} superfans` : "";
    s.log.unshift({week:s.week,msg:`Show: ${show.cityName} @ ${show.venueName} — ${Math.floor(fill*100)}% full, ${fmtMoney(net)} net${sfNote}`,type:net>0?"good":"bad"});
    s.tourActive.progress++;
    notifMsg=`${show.cityName}: ${seats} fans · ${fmtMoney(net)} net`;
    notifType=net>0?"great":"bad";
    if (s.tourActive.progress>=s.tourActive.shows.length) {
      // Build tour wrap presentation before clearing tourActive
      const tourShows = s.tourActive.shows;
      const completedCount = s.tourActive.progress;
      const recentHistory = (s.tourHistory ?? []).slice(0, completedCount);
      const totalGross = recentHistory.reduce((a, h) => a + h.gross, 0);
      const totalExp   = recentHistory.reduce((a, h) => a + h.totalExpenses + h.labelCut, 0);
      const totalNet   = recentHistory.reduce((a, h) => a + h.net, 0);
      const avgFill    = recentHistory.length > 0 ? recentHistory.reduce((a, h) => a + h.attendancePct, 0) / recentHistory.length : 0;
      const bestH  = recentHistory.length > 0 ? recentHistory.reduce((a, b) => b.net > a.net ? b : a) : null;
      const worstH = recentHistory.length > 1 ? recentHistory.reduce((a, b) => b.attendancePct < a.attendancePct ? b : a) : null;
      const cityList = tourShows.map(sh => sh.cityName);
      const tourName = cityList.length > 3
        ? `${cityList[0]} → ${cityList[Math.floor(cityList.length / 2)]} → ${cityList[cityList.length - 1]}`
        : cityList.join(" → ");
      const wrap: TourWrapPresentation = {
        tourName,
        cities: cityList,
        completedShows: recentHistory.length,
        cancelledShows: Math.max(0, completedCount - recentHistory.length),
        grossRevenue: totalGross,
        totalExpenses: totalExp,
        netProfit: totalNet,
        avgFill: Math.round(avgFill),
        bestShow: bestH ? { city: bestH.cityName, venue: bestH.venueName, attendancePct: bestH.attendancePct, net: bestH.net } : null,
        worstShow: worstH ? { city: worstH.cityName, venue: worstH.venueName, attendancePct: worstH.attendancePct, net: worstH.net } : null,
        week: s.week,
      };
      s.tourWrapPresentation = wrap;
      s.tourActive=null;
      s.log.unshift({week:s.week,msg:"Tour complete!",type:"great"});
    }
    // Each show on the road burns you down a notch.
    s.burnout = Math.min(100, (s.burnout ?? 0) + 4);
    } // end else (cancellation branch closed)
  }

  // Merch shop weekly sales
  if (!s.merchShop) s.merchShop = [];
  if (s.totalMerchRevenue === undefined) s.totalMerchRevenue = 0;
  let merchProfitWeek = 0;
  let merchUnitsWeek = 0;
  for (const item of s.merchShop) {
    if (!item.active) {
      item.weeklySales.push(0);
      if (item.weeklySales.length > 52) item.weeklySales.shift();
      continue;
    }
    const tmpl = MERCH_TEMPLATES.find(t => t.type === item.type);
    const pop = tmpl?.popularity ?? 1;
    // Casuals buy modestly; superfans buy ~8× more (collectors, completists).
    const sf = s.superfans ?? 0;
    const casuals = Math.max(0, s.fans - sf);
    const base = (casuals * 0.003) + (sf * 0.025) + (s.fame * 0.5) + (s.hype * 0.3);
    let mult = pop * (0.7 + Math.random() * 0.6);
    if (item.tiedToReleaseId) {
      const rel = s.catalog.find(c => c.id === item.tiedToReleaseId);
      if (rel) {
        const weeksSince = s.week - rel.releasedWeek;
        if (weeksSince <= 6) mult *= 1.6;
        else if (weeksSince <= 16) mult *= 1.2;
        mult *= 1 + Math.min(0.5, rel.weeklyStreams / 50000);
      }
    }
    const merchAge = s.week - item.releasedWeek;
    if (merchAge > 6) mult *= Math.max(0.45, 1 - (merchAge - 6) * 0.035);
    const expected = tmpl?.basePrice ?? 20;
    const priceMult = priceDemandMultiplier(item.price, expected);
    const sold = Math.max(0, Math.floor(base * mult * priceMult));
    item.weeklySales.push(sold);
    if (item.weeklySales.length > 52) item.weeklySales.shift();
    item.totalSold += sold;
    const revenue = sold * (item.price - item.cost);
    item.totalRevenue += revenue;
    merchProfitWeek += revenue;
    merchUnitsWeek += sold;
    // Occasional fan review
    if (sold > 0 && Math.random() < Math.min(0.45, 0.1 + sold / 80)) {
      const r = Math.random();
      const qualityScore = (item.price <= expected ? 0.25 : 0) + (s.rep / 200);
      let mood: "great"|"good"|"mixed"|"bad";
      if (r < 0.10 - qualityScore*0.15) mood = "bad";
      else if (r < 0.32 - qualityScore*0.10) mood = "mixed";
      else if (r < 0.70) mood = "good";
      else mood = "great";
      item.reviews.unshift(generateMerchReview(mood, s.week));
      if (item.reviews.length > 30) item.reviews.length = 30;
    }
  }
  if (merchProfitWeek !== 0) {
    s.money += merchProfitWeek;
    s.totalEarned += Math.max(0, merchProfitWeek);
    s.totalMerchRevenue += merchProfitWeek;
    if (merchUnitsWeek > 0 && Math.random() < 0.30) {
      s.log.unshift({ week: s.week, msg: `Merch: ${fmt(merchUnitsWeek)} units sold · ${fmtMoney(merchProfitWeek)} profit`, type: merchProfitWeek > 0 ? "good" : "neutral" });
    }
  }

  // Feature requests — established artists periodically reach out asking YOU to guest.
  // Cooldown prevents spamming; only one pending at a time. Decrement existing deadlines first.
  if (!s.pendingFeatureRequests) s.pendingFeatureRequests = [];
  if (s.pendingFeatureRequests.length) {
    s.pendingFeatureRequests = s.pendingFeatureRequests
      .map(r => ({ ...r, weeksToRespond: r.weeksToRespond - 1 }))
      .filter(r => {
        if (r.weeksToRespond <= 0) {
          const f = getFeature(r.featureId);
          s.log.unshift({ week:s.week, msg:`Missed feature window from ${f?.name ?? "an artist"}.`, type:"neutral" });
          return false;
        }
        return true;
      });
  }
  if (
    !s.pendingFeatureRequests.length &&
    (s.cooldowns["feat_req"] ?? 0) <= 0 &&
    !s.pendingScenarioId &&
    !s.pendingLabelOffers.length &&
    !s.pendingManagerOffers.length &&
    Math.random() < 0.15
  ) {
    const req = generateFeatureRequest(s);
    if (req) {
      s.pendingFeatureRequests = [req];
      s.cooldowns["feat_req"] = 6; // baseline gap even if dismissed
    }
  }

  // Random scenario event (interactive — pause for player choice)
  if (!s.pendingScenarioId && !notifMsg && !s.pendingFeatureRequests.length && Math.random() < 0.20) {
    const eligible = RANDOM_SCENARIOS.filter(sc => {
      const t = sc.trigger;
      if (!t) return true;
      if (t.minFame     !== undefined && s.fame          < t.minFame)     return false;
      if (t.maxFame     !== undefined && s.fame          > t.maxFame)     return false;
      if (t.minReleases !== undefined && s.totalReleases < t.minReleases) return false;
      if (t.minMoney    !== undefined && s.money         < t.minMoney)    return false;
      if (t.minFans     !== undefined && s.fans          < t.minFans)     return false;
      if (t.minRep      !== undefined && s.rep           < t.minRep)      return false;
      if (t.hasLabel    !== undefined && t.hasLabel      !== !!s.currentLabel) return false;
      return true;
    });
    if (eligible.length > 0) {
      const tot = eligible.reduce((sum, sc) => sum + sc.weight, 0);
      let r = Math.random() * tot;
      const chosen = eligible.find(sc => { r -= sc.weight; return r <= 0; }) ?? eligible[0];
      s.pendingScenarioId = chosen.id;
    }
  }

  if (s.week%4===0) {
    s.trends.Country=0.8+Math.random()*0.5; s.trends.Blues=0.8+Math.random()*0.5;
    // Rotate the trending album theme — what Nashville is currently into.
    s.currentTrendTheme = pickTrendTheme(s.currentTrendTheme);
    try {
      const issue = generateNashvilleTimes(s);
      const json = JSON.stringify(issue);
      s.pendingNewspaperJson = json;
      if (!s.newspaperArchive) s.newspaperArchive = [];
      s.newspaperArchive.unshift(json);
      if (s.newspaperArchive.length > 36) s.newspaperArchive.length = 36;
    } catch { /* non-fatal */ }
  }

  const wonAward=runAwardCheck(s);
  if (wonAward) {
    notifMsg=`Award: ${wonAward.name}`;
    notifType="gold";
    const ap: AwardPresentation = {
      id: wonAward.id, name: wonAward.name, desc: wonAward.desc,
      famePerk: wonAward.famePerk, repPerk: wonAward.repPerk, money: wonAward.money,
      week: s.week,
    };
    s.awardPresentation = ap;
  }

  // Career tier milestone check
  const newTierIdx = getCareerTierIdx(s.fame);
  if (newTierIdx > (s.lastCareerTierIdx ?? 0) && newTierIdx > 0) {
    s.lastCareerTierIdx = newTierIdx;
    const tierDef = CAREER_TIERS[newTierIdx];
    const mp: CareerMilestonePresentation = {
      tier: tierDef, fans: s.fans, fame: s.fame, rep: s.rep, week: s.week,
    };
    s.milestonePresentation = mp;
  }

  if (notifMsg) s.pendingEvent={msg:notifMsg,type:notifType};

  // Casual fans drift away when there's nothing new to keep them engaged.
  // Superfans don't churn from inactivity — that's what makes them super.
  if (s.weeksSinceRelease > 8 && !s.tourActive) {
    const sf = s.superfans ?? 0;
    const casuals = Math.max(0, s.fans - sf);
    const churn = Math.floor(casuals * 0.005);
    if (churn > 0) s.fans = Math.max(sf, s.fans - churn);
  }
  // Invariant: superfans can never exceed total fans (negative scenarios may
  // have reduced s.fans below s.superfans).
  s.superfans = Math.max(0, Math.min(s.superfans ?? 0, s.fans));

  s.weeklyExpenses = Math.max(380, 340 + s.fans*0.008 + s.fame*6 + (s.totalShows*0.12));

  // ── #4 Rivals + #5 Story Arcs (tick after all base sim updates) ──
  // Order matters: tick rivals first (may add log entries), then arcs (may
  // raise pendingArcChoice modal), then maybe spawn a new arc.
  tickRivals(s);
  refreshInboundOffers(s);
  tickArcs(s);
  maybeSpawnArc(s);

  saveToDisk(s);
  return s;
}

// ─── HOOK ─────────────────────────────────────────────────
export function useGameState() {
  const [state,setState] = useState<GameState>(()=>{
    const saved=loadFromDisk();
    if (saved) return {
      ...saved,
      hasSave:true,
      pendingEvent:null,
      modal:null,
      // Migrate older saves that pre-date the album-theme + producer-relationship systems.
      themeCounts: saved.themeCounts ?? {},
      currentTrendTheme: saved.currentTrendTheme ?? pickTrendTheme(null),
      producerWorkCounts: saved.producerWorkCounts ?? {},
      // Migrate older saves to the rich label/manager system.
      currentLabel: saved.currentLabel ?? (saved.labelSigned ? {
        labelId:"legacy", name:"Legacy Major Label", exec:"Your A&R Rep",
        streamingCut:0.18, tourGrossCut:0.10, tourCut:0.10, marketingBoost:1.3,
        advance:0, advanceRecouped:0, recordingFund:0, recordingFundUsed:0,
        royaltyRate:0.15, recoupRate:1.0, merchCut:0, syncCut:0, publishingCut:0,
        marketingCommitment:0, marketingSpendYTD:0, albumsCommitted:1, albumsDelivered:0,
        optionsRemaining:0, optionWeeks:52, weeksLeft:104, totalWeeks:104,
        signedAtWeek:saved.week ?? 0, totalAdvance:0,
        crossCollateralization:false, controlledComposition:1.0, controlledCompositionCap:12,
        suspensionRights:false, keyPersonClause:false, creativeControl:50, approvalRights:[],
        isRecouped:false, perks:[], type:"indie" as const,
      } : null),
      currentManager: saved.currentManager ?? (saved.hasManager ? {
        managerId:"legacy", name:"Your Manager",
        weeklyFee:75, showRevPct:0.15, brandDealBoost:1.0, repPerWeek:0,
        signedAtWeek:saved.week ?? 0,
      } : null),
      pendingLabelOffers: saved.pendingLabelOffers ?? [],
      pendingManagerOffers: saved.pendingManagerOffers ?? [],
      // Feature artist system (added in v1.x)
      pendingFeatureRequests: saved.pendingFeatureRequests ?? [],
      guestCredits: saved.guestCredits ?? [],
      featureWorkCounts: saved.featureWorkCounts ?? {},
      // Casuals/Superfans split (added in v1.x). Backfill ~5% of the existing
      // fanbase as superfans so legacy careers don't read "0 superfans" jarringly.
      superfans: saved.superfans ?? Math.floor((saved.fans ?? 0) * 0.05),
      // ── #3 Burnout / #4 Rivals / #5 Story Arcs (added in v1.x) ──
      // Legacy saves: burnout starts at 0, rivals get seeded so the scene
      // isn't empty when an old career loads in.
      burnout: saved.burnout ?? 0,
      vacationCooldown: saved.vacationCooldown ?? 0,
      rivals: (saved.rivals && saved.rivals.length) ? saved.rivals : seedRivals(saved.fame ?? 0),
      activeArcs: saved.activeArcs ?? [],
      completedArcs: saved.completedArcs ?? [],
      pendingArcChoice: saved.pendingArcChoice ?? null,
    };
    return {...INITIAL_STATE};
  });

  const hasSave = !!loadFromDisk();

  const upd = useCallback((fn:(s:GameState)=>GameState)=>{
    setState(prev=>{ const next=fn(JSON.parse(JSON.stringify(prev))); saveToDisk(next); return next; });
  },[]);

  const goToMenu  = useCallback(()=>setState(p=>({...p,screen:"menu"})),[]);
  const goToSetup = useCallback(()=>setState(p=>({...p,screen:"setup"})),[]);
  const loadGame  = useCallback(()=>{ const s=loadFromDisk(); if(s) setState({
    ...s, hasSave:true, pendingEvent:null, modal:null,
    themeCounts: s.themeCounts ?? {},
    currentTrendTheme: s.currentTrendTheme ?? pickTrendTheme(null),
    producerWorkCounts: s.producerWorkCounts ?? {},
    currentLabel: s.currentLabel ?? (s.labelSigned ? {
      labelId:"legacy", name:"Legacy Major Label", exec:"Your A&R Rep",
      streamingCut:0.18, tourGrossCut:0.10, tourCut:0.10, marketingBoost:1.3,
      advance:0, advanceRecouped:0, recordingFund:0, recordingFundUsed:0,
      royaltyRate:0.15, recoupRate:1.0, merchCut:0, syncCut:0, publishingCut:0,
      marketingCommitment:0, marketingSpendYTD:0, albumsCommitted:1, albumsDelivered:0,
      optionsRemaining:0, optionWeeks:52, weeksLeft:104, totalWeeks:104,
      signedAtWeek:s.week ?? 0, totalAdvance:0,
      crossCollateralization:false, controlledComposition:1.0, controlledCompositionCap:12,
      suspensionRights:false, keyPersonClause:false, creativeControl:50, approvalRights:[],
      isRecouped:false, perks:[], type:"indie" as const,
    } : null),
    currentManager: s.currentManager ?? (s.hasManager ? {
      managerId:"legacy", name:"Your Manager",
      weeklyFee:75, showRevPct:0.15, brandDealBoost:1.0, repPerWeek:0,
      signedAtWeek:s.week ?? 0,
    } : null),
    pendingLabelOffers: s.pendingLabelOffers ?? [],
    pendingManagerOffers: s.pendingManagerOffers ?? [],
    pendingFeatureRequests: s.pendingFeatureRequests ?? [],
    guestCredits: s.guestCredits ?? [],
    featureWorkCounts: s.featureWorkCounts ?? {},
    superfans: s.superfans ?? Math.floor((s.fans ?? 0) * 0.05),
    burnout: s.burnout ?? 0,
    vacationCooldown: s.vacationCooldown ?? 0,
    rivals: (s.rivals && s.rivals.length) ? s.rivals : seedRivals(s.fame ?? 0),
    activeArcs: s.activeArcs ?? [],
    completedArcs: s.completedArcs ?? [],
    pendingArcChoice: s.pendingArcChoice ?? null,
  }); },[]);
  const clearSave = useCallback(()=>{ try{localStorage.removeItem(SAVE_KEY);}catch{} setState({...INITIAL_STATE}); },[]);

  const startNewGame = useCallback((name:string,genre:Genre,city:string,archetype:string)=>{
    const s:GameState={...INITIAL_STATE,screen:"game",hasSave:false,artistName:name,genre,city,archetype,
      qualityBase:archHas(archetype,"acousticQBonus")?35+archVal(archetype):35,
      trends:{Country:0.8+Math.random()*0.5,Blues:0.8+Math.random()*0.5},
      themeCounts:{},
      currentTrendTheme: pickTrendTheme(null),
      producerWorkCounts:{},
      regional:{[city]:0},
      // Seed the scene with rival artists (#4) so the world feels populated
      // from week 1. They'll release, beef, and chart in parallel.
      rivals: seedRivals(0),
    };
    saveToDisk(s); setState(s);
  },[]);

  const doAdvance       = useCallback(()=>setState(prev=>advance(prev)),[]);
  const doDismissEvent     = useCallback(()=>upd(s=>{s.pendingEvent=null;return s;}),[upd]);
  const dismissModal       = useCallback(()=>upd(s=>{s.modal=null;return s;}),[upd]);
  const dismissNewspaper   = useCallback(()=>upd(s=>{s.pendingNewspaperJson=null;return s;}),[upd]);
  const openArchivedNewspaper = useCallback((json:string)=>upd(s=>{s.pendingNewspaperJson=json;return s;}),[upd]);

  // Project
  const doStartProject = useCallback((type:ReleaseType, mode:RecordingMode="standard")=>upd(s=>{
    // Dynamic recording time: base weeks + track count × studio × producer × mode
    const mint:Record<string,number>={Single:1,EP:3,Album:8,"Live Album":4};
    const maxt:Record<string,number>={Single:1,EP:6,Album:16,"Live Album":8};
    const trackCount = mint[type] ?? 1;
    const w = calculateRecordingWeeks(type, trackCount, "home_studio", "self", mode);
    s.project={type,genre:s.genre,producerId:"self",studioId:"home_studio",title:genAlbumName(s.artistName),tracks:[],weeksLeft:w,totalWeeks:w,minTracks:mint[type]??1,maxTracks:maxt[type]??1,marketingBudget:0,mode};
    s.log.unshift({week:s.week,msg:`Started recording a new ${type}. ${w} weeks in the studio.`,type:"neutral"});
    return s;
  }),[upd]);

  const doUpdateProject = useCallback((ch:Partial<GameState["project"]>)=>upd(s=>{
    if (!s.project || !ch) return s;
    const p = s.project;

    // ── Charge cost deltas upfront when producer or studio is swapped ──
    // Producer fees apply the relationship discount (built up from past projects).
    let delta = 0;
    let blockMsg: string | null = null;

    if (ch.producerId && ch.producerId !== p.producerId) {
      const oldProd = PRODUCERS.find(pr => pr.id === p.producerId);
      const newProd = PRODUCERS.find(pr => pr.id === ch.producerId);
      const oldEff = oldProd ? getProducerEffectiveCost(oldProd, s.producerWorkCounts) : 0;
      const newEff = newProd ? getProducerEffectiveCost(newProd, s.producerWorkCounts) : 0;
      delta += newEff - oldEff;
    }
    // Studio fees are paid weekly during recording — no upfront delta for studio swaps.

    if (delta > 0 && s.money < delta) {
      const newProd = ch.producerId ? PRODUCERS.find(pr => pr.id === ch.producerId) : null;
      const newStudio = ch.studioId ? getStudio(ch.studioId) : null;
      const target = newProd?.name ?? newStudio?.name ?? "this upgrade";
      blockMsg = `Need ${fmtMoney(delta)} more to book ${target}.`;
    }

    if (blockMsg) {
      s.pendingEvent = { msg: blockMsg, type: "bad" };
      return s;
    }
    if (delta !== 0) s.money -= delta;

    // Apply the partial update first
    s.project = { ...s.project, ...ch } as GameState["project"];

    // ── Recalculate weeks if studio, producer, or mode changed ──
    const needsRecalc = ch.studioId !== undefined || ch.producerId !== undefined || ch.mode !== undefined;
    if (needsRecalc && s.project) {
      const elapsed = s.project.totalWeeks - s.project.weeksLeft;
      const newTotal = calculateRecordingWeeks(
        s.project.type,
        s.project.tracks.length,
        s.project.studioId,
        s.project.producerId,
        s.project.mode ?? "standard"
      );
      s.project.totalWeeks = newTotal;
      s.project.weeksLeft = Math.max(0, newTotal - elapsed);
    }

    return s;
  }),[upd]);

  const doAddTrack = useCallback((
    name:string,
    opts?: { featId?: string; hook?: import("./gameLogic").HookStyle; lyric?: import("./gameLogic").LyricStyle; cowriterId?: string }
  )=>upd(s=>{
    if (!s.project||s.project.tracks.length>=s.project.maxTracks) return s;
    // featId and cowriterId are mutually exclusive — featId wins if both given.
    const featId = opts?.featId || undefined;
    const cowriterId = featId ? undefined : (opts?.cowriterId || undefined);
    s.project.tracks.push({
      name,
      featId,
      cowriterId,
      // Conservative defaults if caller doesn't pass — matches the legacy
      // fallback used in computeTrackWritingQuality so behavior is consistent.
      hook: opts?.hook ?? "safe",
      lyric: opts?.lyric ?? "heartfelt",
    });
    // Recalculate weeks when track count changes
    const elapsed = s.project.totalWeeks - s.project.weeksLeft;
    const newTotal = calculateRecordingWeeks(
      s.project.type,
      s.project.tracks.length,
      s.project.studioId,
      s.project.producerId,
      s.project.mode ?? "standard"
    );
    s.project.totalWeeks = newTotal;
    s.project.weeksLeft = Math.max(0, newTotal - elapsed);
    return s;
  }),[upd]);

  const doRemoveTrack = useCallback((i:number)=>upd(s=>{
    if (!s.project) return s;
    s.project.tracks.splice(i,1);
    // Recalculate weeks when track count changes
    const elapsed = s.project.totalWeeks - s.project.weeksLeft;
    const newTotal = calculateRecordingWeeks(
      s.project.type,
      s.project.tracks.length,
      s.project.studioId,
      s.project.producerId,
      s.project.mode ?? "standard"
    );
    s.project.totalWeeks = newTotal;
    s.project.weeksLeft = Math.max(0, newTotal - elapsed);
    return s;
  }),[upd]);

  const doFinishProject = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    const p=s.project;
    const prod=PRODUCERS.find(pr=>pr.id===p.producerId);
    const studio=getStudio(p.studioId);
    // Studio fees paid weekly during recording. Producer fees paid upfront via doUpdateProject.
    // Only feature artists are paid here, since they're per-track and added late.
    for (const t of p.tracks) {
      if (t.featId) {
        const f = FEATURES.find(x=>x.id===t.featId);
        if (f) {
          const c = getFeatureEffectiveCost(f, s.featureWorkCounts, featCostMult(s.archetype));
          if (s.money < c) { s.pendingEvent={msg:`Can't pay ${f.name}.`,type:"bad"}; return s; }
          s.money -= c;
          if (!s.featureWorkCounts) s.featureWorkCounts = {};
          s.featureWorkCounts[f.id] = (s.featureWorkCounts[f.id] ?? 0) + 1;
        }
      }
    }
    // ── PRODUCER RELATIONSHIP + SPECIALTY BONUSES ──
    // Relationship: repeated work with the same producer adds a flat quality bump.
    const rel = prod ? getProducerRelationship(prod.id, s.producerWorkCounts) : null;
    const relQ = rel?.qBonus ?? 0;
    // Specialty: producer's stylistic strengths align with the album's theme.
    let specQ = 0;
    let specNote = "";
    if (prod && p.themeId) {
      const themes = PRODUCER_THEMES[prod.id] ?? [];
      if (themes.includes(p.themeId)) {
        specQ = PRODUCER_SPECIALTY_QUALITY_BONUS;
        specNote = ` · ${prod.specialty} fits the theme`;
      }
    }

    // ── SONGWRITING QUALITY (per-track) ──
    // Each track contributes its own writing quality (hook + lyric + cowriter +
    // producer-style affinity), then we average across tracks. Per-track variance
    // means an Experimental album swings harder than a Safe one.
    let trackQSum = 0;
    let cowriteCount = 0;
    let experimentalWins = 0;
    let experimentalLosses = 0;
    for (const t of p.tracks) {
      const wq = computeTrackWritingQuality(t);
      const psb = producerStyleBonus(prod, t);
      // Symmetric variance window: -variance .. +variance
      const qRoll = (Math.random() * 2 - 1) * wq.variance;
      trackQSum += wq.delta + psb + qRoll;
      // Track experimental outcomes for the recording-event flavor text.
      if ((t.hook ?? "safe") === "experimental") {
        if (qRoll + psb >= 3) experimentalWins++;
        else if (qRoll <= -3) experimentalLosses++;
      }
      if (t.cowriterId) cowriteCount++;
    }
    const writingAvgQ = p.tracks.length ? trackQSum / p.tracks.length : 0;

    // ── #3 Burnout: drained artists make worse records ──
    const burnPenalty = burnoutQualityPenalty(s.burnout ?? 0);
    // Each week the artist pushed through exhaustion costs 2 quality points
    const pushPenalty = -2 * (p.pushThroughCount ?? 0);
    if (pushPenalty < 0) {
      s.log.unshift({ week:s.week, msg:`Grinding through exhaustion hurt the recording (${pushPenalty.toFixed(0)} quality).`, type:"bad" });
    }

    // ── Recording mode quality & burnout modifiers ──
    const modeCfg = RECORDING_MODE_CONFIG[p.mode ?? "standard"];
    const modeQualityMod = modeCfg.qualityMod;
    let modeBurnoutAdd = 0;
    if (p.mode === "rush") {
      modeBurnoutAdd = 8; // One-time rush burnout hit
    } else if (p.mode === "deliberate") {
      const standardWeeks = getStandardRecordingWeeks(p.type, p.tracks.length, p.studioId, p.producerId);
      const extraWeeks = Math.max(0, p.totalWeeks - standardWeeks);
      modeBurnoutAdd = extraWeeks * 3; // +3 burnout per extra deliberate week
    }

    const baseQ=s.qualityBase+(prod?.qB??0)+(studio?.qB??0)+relQ+specQ+writingAvgQ+burnPenalty+pushPenalty+modeQualityMod;
    const adjQ=clamp(applyArchQuality(s.archetype,baseQ)+Math.random()*15-5,0,100);
    // Studio time itself accumulates burnout (longer formats = more burnout).
    const burnAdd = p.type==="Live Album"?8 : p.type==="Album"?18 : p.type==="EP"?10 : 5;
    s.burnout = Math.min(100, (s.burnout ?? 0) + burnAdd + modeBurnoutAdd);
    if (burnPenalty < 0) {
      s.log.unshift({ week:s.week, msg:`Recording while exhausted hurt the result (${burnPenalty.toFixed(0)} quality).`, type:"bad" });
    }
    if (modeQualityMod !== 0) {
      s.log.unshift({ week:s.week, msg:`${modeCfg.label} mode: ${modeQualityMod > 0 ? "+" : ""}${modeQualityMod} quality.`, type: modeQualityMod > 0 ? "good" : "bad" });
    }
    if (modeBurnoutAdd > 0) {
      s.log.unshift({ week:s.week, msg:`${modeCfg.label} mode added ${modeBurnoutAdd} burnout.`, type:"neutral" });
    }
    s.qualityBase=Math.min(95,s.qualityBase+roll(1,4));
    s.unreleased.push({id:"p"+Date.now(),type:p.type,genre:p.genre,title:p.title,producerId:p.producerId,studioId:p.studioId,themeId:p.themeId,tracks:p.tracks,avgQuality:adjQ,hypeSnapshot:s.hype,marketingBudget:p.marketingBudget});

    // Bump the relationship counter (Home Studio doesn't count).
    if (prod && prod.id !== "self") {
      if (!s.producerWorkCounts) s.producerWorkCounts = {};
      s.producerWorkCounts[prod.id] = (s.producerWorkCounts[prod.id] ?? 0) + 1;
    }
    // Co-writers also build the FEATURE relationship counter (toward the 30%
    // discount tiers). They paid nothing — the work itself is the bond.
    for (const t of p.tracks) {
      if (t.cowriterId) {
        if (!s.featureWorkCounts) s.featureWorkCounts = {};
        s.featureWorkCounts[t.cowriterId] = (s.featureWorkCounts[t.cowriterId] ?? 0) + 1;
      }
    }
    void STUDIOS;
    s.project=null;
    // Flavor text: relationship + specialty + co-write count + experimental swings.
    const flavorBits: string[] = [];
    if (relQ > 0 && rel) flavorBits.push(rel.label.toLowerCase());
    if (specNote) flavorBits.push(specNote.replace(/^ · /, ""));
    if (cowriteCount > 0) flavorBits.push(`${cowriteCount} co-write${cowriteCount===1?"":"s"}`);
    if (experimentalWins >= 2) flavorBits.push("the risks paid off");
    else if (experimentalLosses >= 2) flavorBits.push("some swings missed");
    const flavor = flavorBits.length ? ` (${flavorBits.join(" · ")})` : "";
    s.pendingEvent={msg:`"${s.unreleased[s.unreleased.length-1].title}" recorded. Release when ready.${flavor}`,type:"great"};
    return s;
  }),[upd]);

  const doReleaseProject = useCallback((id:string)=>upd(s=>{
    const idx=s.unreleased.findIndex(p=>p.id===id); if(idx<0) return s;
    const p=s.unreleased[idx];

    // ── Market Saturation gate ──
    const sat = s.marketSaturation ?? 0;
    if (sat >= 90) {
      s.pendingEvent = { msg: "The market is burned out on you. Lay low for a few weeks before releasing.", type:"bad" };
      return s;
    }

    if (p.marketingBudget>0){if(s.money<p.marketingBudget){s.pendingEvent={msg:"Not enough for marketing.",type:"bad"};return s;}s.money-=p.marketingBudget;}
    const trend=s.trends[p.genre]??1; const q=p.avgQuality; const hype=p.hypeSnapshot;
    let score=p.type==="Single"?(q*0.35)+(hype*0.4)+(trend*25):p.type==="EP"?(q*0.5)+(hype*0.3)+(trend*20):p.type==="Live Album"?(q*0.45)+(hype*0.2)+(s.rep*0.6)+(trend*15):(q*0.62)+(hype*0.22)+(trend*16);
    score*=roll(0.8,1.25);

    // ── ALBUM-THEME BONUSES ──
    // (a) Signature theme: if the player has built up an identity in this theme,
    //     fans and the press lean in. Bonus tier scales with how many releases.
    // (b) Trend theme: Nashville's hot theme right now gives a small lift.
    let themeFanMult = 1;
    let themeNote = "";
    const sig = getSignatureTheme(s.themeCounts);
    if (p.themeId && sig && p.themeId === sig.themeId) {
      score *= sig.scoreMult;
      themeFanMult *= sig.fanMult;
      themeNote = ` · ${sig.theme.icon} signature ${sig.theme.name.toLowerCase()}`;
    }
    if (p.themeId && s.currentTrendTheme && p.themeId === s.currentTrendTheme) {
      score *= TREND_THEME_SCORE_MULT;
      themeFanMult *= TREND_THEME_FAN_MULT;
      themeNote += ` · 🔥 on-trend`;
    }

    // ── Saturation penalties ──
    const satAdd = ({Single:20,EP:35,Album:55,"Live Album":28} as Record<string,number>)[p.type] ?? 25;
    let scoreMult = 1, fanMult = 1, revMult2 = 1;
    let satNote = "";
    if (sat >= 75) {
      scoreMult = 0.75; fanMult = 0.70; revMult2 = 0.70;
      satNote = " (market overexposed — heavy penalty)";
      s.qualityBase = Math.max(20, s.qualityBase - 2);
    } else if (sat >= 60) {
      scoreMult = 0.90; fanMult = 0.85; revMult2 = 0.85;
      satNote = " (market saturated — reduced returns)";
      s.qualityBase = Math.max(20, s.qualityBase - 1);
    }
    score *= scoreMult;
    // cap Viral at overexposed tier
    if (sat >= 75) score = Math.min(score, 73);

    type O="Flop"|"Moderate"|"Hit"|"Viral";
    const outcome:O=score<30?"Flop":score<52?"Moderate":score<74?"Hit":"Viral";
    const rm={Flop:0.1,Moderate:0.4,Hit:1,Viral:4};
    const fm={Flop:0.2,Moderate:0.6,Hit:1,Viral:3.5};
    const famD={Flop:-2,Moderate:2,Hit:6,Viral:15}[outcome];
    const repD={Flop:-4,Moderate:1,Hit:4,Viral:3}[outcome];
    const bRev={Single:450,EP:1200,Album:3500,"Live Album":800}[p.type]??450;
    const bFan={Single:350,EP:1000,Album:4200,"Live Album":650}[p.type]??350;
    // ── ALBUM WRITING MIX ──
    // Aggregate the hook/lyric palette across tracks to flavor the release:
    // party-heavy = more streams + fans, literary-heavy = critic rep but slower
    // commercial pickup. Co-writers add a smaller-than-feature fan bump.
    const writingMix = computeAlbumWritingMix(p.tracks);
    const revenue=Math.floor(bRev*rm[outcome]*roll(0.7,1.4)*revMult2);
    let fansG=Math.floor(bFan*fm[outcome]*roll(0.7,1.4)*fanMult*themeFanMult*writingMix.fanMult);
    for(const t of p.tracks){
      if(t.featId){
        const f=FEATURES.find(x=>x.id===t.featId);
        if(f)fansG+=Math.floor(f.fB*(outcome==="Viral"?1.8:outcome==="Hit"?1.2:0.6)*fanMult);
      } else if(t.cowriterId){
        // Co-writers get ~15% of a feature's fan boost. Free creative help —
        // they bring a slice of their audience but they aren't ON the song.
        // Tuned conservatively so co-writes don't dwarf paid features.
        const f=FEATURES.find(x=>x.id===t.cowriterId);
        if(f)fansG+=Math.floor(f.fB*0.15*(outcome==="Viral"?1.8:outcome==="Hit"?1.2:0.6)*fanMult);
      }
    }
    const radioMult=archHas(s.archetype,"radioBonus")?archVal(s.archetype):1;
    const bStr={Single:500,EP:1500,Album:5000,"Live Album":1200}[p.type]??500;
    const labelMktBoost = s.currentLabel?.marketingBoost ?? (s.labelSigned ? 1.3 : 1);
    const peakStr=Math.floor(bStr*(score/50)*roll(0.8,1.3)*labelMktBoost*radioMult*fanMult*writingMix.streamMult);
    const lifecycle=classifyLifecycle(q,outcome,p.marketingBudget,score,s.archetype);

    // Increase saturation after release
    s.marketSaturation = Math.min(100, sat + satAdd);
    const LC={Normal:{decayRate:0.92,floorPct:0.00},Hit:{decayRate:0.96,floorPct:0.03},Evergreen:{decayRate:0.985,floorPct:0.12}};
    const lcP=LC[lifecycle];
    const criticBand=CRITIC_REVIEWS.find(b=>q>=b.min&&q<b.max)??CRITIC_REVIEWS[0];
    // Literary lyrics earn extra critic respect; party-heavy albums lose a bit
    // of it. The mix is averaged per-track so one cut won't tank the verdict.
    // We do NOT floor at 0 — bad albums' negative crit rep punishment must
    // still bite (final s.rep is clamped 0..100 downstream anyway).
    const repFromCritic=criticBand.rep + writingMix.critRepBonus;
    const headline=rnd(criticBand.headlines);
    const cid="r"+Date.now()+Math.random().toString(36).slice(2,6);
    s.catalog.push({
    id:cid,title:p.title,type:p.type,genre:p.genre,quality:q,outcome,lifecycle,
    decayRate:lcP.decayRate,streamFloor:Math.floor(peakStr*lcP.floorPct),
    weeklyStreams:peakStr,peakStreams:peakStr,totalStreams:0,
    releasedWeek:s.week,weeksActive:0,promoted:false,comebackCooldown:0,
    tracks:p.tracks,hasMusicVideo:false,
    // Realistic streaming tracking (v2.0)
    streamStats: {
      totalStreams: 0,
      weeklyStreams: peakStr,
      peakStreams: peakStr,
      totalRevenue: 0,
      weeklyRevenue: 0,
      platformBreakdown: {},
      geoBreakdown: {},
      effectiveRate: BASE_STREAMING_RATE,
      premiumRatio: 0.45,
      usShare: 0.62,
      hitThreshold: false,
      revenueHistory: [],
    },
    platformMix: {...s.platformMix},
    geoDist: {...s.geoDist},
    premiumRatio: 0.45,
    effectiveRate: BASE_STREAMING_RATE,
    lifetimeRevenue: 0,
    weeklyRevenue: 0,
    revenueHistory: [],
  });
    s.money+=revenue; s.fans+=fansG;
    // Releases convert casuals → superfans based on outcome. A masterpiece
    // (q >= 85) converts an extra slice on top of the outcome bonus.
    const sfRate = outcome === "Viral" ? 0.030 : outcome === "Hit" ? 0.015 : outcome === "Moderate" ? 0.004 : 0;
    const sfBonus = q >= 85 ? 0.010 : 0;
    if (sfRate + sfBonus > 0) {
      const sfPrior = s.superfans ?? 0;
      const casualsAvail = Math.max(0, s.fans - sfPrior);
      const sfConv = Math.floor(casualsAvail * (sfRate + sfBonus));
      if (sfConv > 0) s.superfans = sfPrior + sfConv;
    }
    s.fame=clamp(s.fame+famD,0,100); s.rep=clamp(s.rep+repD+Math.floor(repFromCritic*0.7),0,100);
    s.hype=Math.max(0,s.hype-15); s.weeksSinceRelease=0; s.totalReleases++;
    s.discography.push({id:cid,type:p.type,title:p.title,genre:p.genre,themeId:p.themeId,tracks:p.tracks,avgQuality:q,outcome,revenue,fansGained:fansG,fameDelta:famD,repDelta:repD+repFromCritic,releasedWeek:s.week,peakStreams:peakStr,criticHeadline:headline,lifecycle,hasMusicVideo:false});
    // Record this release toward the player's theme identity.
    if (p.themeId) {
      if (!s.themeCounts) s.themeCounts = {};
      s.themeCounts[p.themeId] = (s.themeCounts[p.themeId] ?? 0) + 1;
    }
    s.criticReviews.push({week:s.week,headline,title:p.title,score:Math.floor(q)});
    s.unreleased.splice(idx,1);
    const msg={Flop:`"${p.title}" flopped. Brutal.`,Moderate:`"${p.title}" did okay.`,Hit:`"${p.title}" is a HIT!`,Viral:`"${p.title}" went VIRAL!`}[outcome];
    s.log.unshift({week:s.week,msg:`${msg} ${fmtMoney(revenue)} · +${fmt(fansG)} fans · ${lifecycle}${satNote}${themeNote}`,type:outcome==="Flop"?"bad":outcome==="Viral"?"great":"good"});
    s.pendingEvent = null;
    s.releasePresentation = {
      title: p.title, type: p.type, outcome, quality: q, revenue,
      fansGained: fansG, fameDelta: famD, repDelta: repD+repFromCritic,
      peakStreams: peakStr, criticHeadline: headline, lifecycle,
      week: s.week, genre: p.genre, tracks: p.tracks,
      fanReviews: genFanReviews(outcome),
    };
    s.weeklyExpenses=Math.max(100,80+s.fans*0.003+s.fame*5);
    s.pendingPressing = { releaseId: cid, releaseTitle: p.title, releaseType: p.type };
    return s;
  }),[upd]);

  const doDeleteUnreleased = useCallback((id:string)=>upd(s=>{s.unreleased=s.unreleased.filter(p=>p.id!==id);return s;}),[upd]);
  const doScrubProject = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    // Refund the upfront producer fee (studio fees were paid weekly, nothing to refund there).
    const p = s.project;
    const prod = PRODUCERS.find(pr => pr.id === p.producerId);
    const prodRefund = prod ? getProducerEffectiveCost(prod, s.producerWorkCounts) : 0;
    if (prodRefund > 0) s.money += prodRefund;
    s.project = null;
    if (prodRefund > 0) {
      s.pendingEvent = { msg:`Project scrapped. ${fmtMoney(prodRefund)} producer fee refunded.`, type:"good" };
    }
    return s;
  }),[upd]);

  // Grind
  const doGrind = useCallback((id:string)=>upd(s=>{
    const a=GRIND_ACTIONS.find(x=>x.id===id); if(!a) return s;
    if(s.energy<a.e){s.pendingEvent={msg:"Not enough energy.",type:"bad"};return s;}
    if(a.mc&&s.money<a.mc){s.pendingEvent={msg:"Not enough money.",type:"bad"};return s;}
    s.energy-=a.e; if(a.mc)s.money-=a.mc; s.cooldowns[a.id]=a.cd;
    // ── #3 Burnout: heavy actions add fatigue beyond the energy cost ──
    // Anything 25+ energy is "real work" and contributes to burnout.
    if (a.e >= 25) {
      s.burnout = Math.min(100, (s.burnout ?? 0) + (a.e >= 35 ? 3 : 2));
    }
    const ef=a.eff; const msgs:string[]=[];
    if(ef.fame){const v=ef.fame*roll(0.7,1.4);s.fame=clamp(s.fame+v,0,100);msgs.push(`fame+${v.toFixed(1)}`);}
    if(ef.rep){const v=ef.rep*roll(0.7,1.4);s.rep=clamp(s.rep+v,0,100);msgs.push(`rep+${v.toFixed(1)}`);}
    if(ef.hype){const v=ef.hype*roll(0.7,1.3);s.hype=clamp(s.hype+v,0,100);msgs.push(`hype+${v.toFixed(1)}`);}
    if(ef.fans){const v=Math.floor(ef.fans*roll(0.5,1.6));s.fans+=v;msgs.push(`fans+${fmt(v)}`);}
    if(ef.money){const v=Math.floor(ef.money*roll(0.85,1.15));s.money+=v;msgs.push(`+${fmtMoney(v)}`);}
    if(ef.money_pct&&s.fans>0){const v=Math.floor(s.fans*ef.money_pct*roll(0.8,1.2));s.money+=v;msgs.push(`+${fmtMoney(v)}`);}
    if(ef.satReduce){s.marketSaturation=Math.max(0,(s.marketSaturation??0)-ef.satReduce);msgs.push(`sat-${ef.satReduce}`);}
    if(ef.radio&&s.totalReleases>0&&Math.random()<0.4){const rm2=archHas(s.archetype,"radioBonus")?archVal(s.archetype):1;const fG=Math.floor(roll(400,1200)*rm2);s.fans+=fG;s.fame=clamp(s.fame+Math.max(1,Math.floor(2*rm2)),0,100);s.rep=clamp(s.rep+2,0,100);msgs.push(`RADIO! +${fmt(fG)} fans`);s.pendingEvent={msg:`Radio spin! +${fmt(fG)} fans`,type:"great"};}
    if(ef.playlist&&s.totalReleases>0&&Math.random()<0.35){s.hype=clamp(s.hype+18,0,100);s.fans+=Math.floor(roll(200,800));s.catalog.forEach(t=>{t.weeklyStreams=Math.min(t.peakStreams,Math.floor(t.weeklyStreams*1.3));});s.pendingEvent={msg:"Playlist secured! Streams boosted.",type:"great"};}
    if(ef.sync_chance&&s.totalReleases>0){const prob=archHas(s.archetype,"syncRadioBoost")?0.38:0.25;if(Math.random()<prob){const m=Math.floor(roll(3000,15000));s.money+=m;s.fame=clamp(s.fame+2,0,100);msgs.push(`SYNC +${fmtMoney(m)}`);s.pendingEvent={msg:`Sync deal! +${fmtMoney(m)}`,type:"gold"};}}
    if(ef.festival_chance&&s.totalReleases>0&&Math.random()<0.3){const fF=Math.floor(roll(500,2000));s.fans+=fF;s.fame=clamp(s.fame+3,0,100);s.rep=clamp(s.rep+2,0,100);msgs.push(`FEST! +${fmt(fF)}`);s.pendingEvent={msg:`Festival slot! +${fmt(fF)} fans`,type:"great"};}
    if(!s.pendingEvent)s.pendingEvent={msg:`${a.name}: ${msgs.slice(0,3).join(" · ")}`,type:"norm"};
    s.log.unshift({week:s.week,msg:`${a.name}: ${msgs.join(", ")}`,type:"good"});
    return s;
  }),[upd]);

  // Tour
  const doToggleTourCity = useCallback((cityName:string)=>upd(s=>{
    const city=CITIES.find(c=>c.name===cityName); if(!city) return s;
    const inQ=s.tourQueue.findIndex(q=>q.cityName===cityName);
    if(inQ>=0){s.tourQueue.splice(inQ,1);return s;}
    const v=city.venues.find(v=>v.tier===s.tourVenue)??city.venues[city.venues.length-1];
    if(!v)return s;
    s.tourQueue.push({cityName,venueName:v.name,venueCap:v.cap,venueCost:v.cost,venueTier:v.tier,travelCost:city.travelCost,region:city.region,genreMod:city.genreMod});
    return s;
  }),[upd]);

  const doSetVenueTier = useCallback((tier:number)=>upd(s=>{
    s.tourVenue=tier;
    s.tourQueue=s.tourQueue.map(stop=>{
      const city=CITIES.find(c=>c.name===stop.cityName); if(!city) return stop;
      const v=city.venues.find(v=>v.tier===tier)??city.venues[city.venues.length-1];
      return {...stop,venueName:v.name,venueCap:v.cap,venueCost:v.cost,venueTier:v.tier};
    });
    return s;
  }),[upd]);

  const doSetTicketMult = useCallback((mult:number)=>upd(s=>{s.tourTicketMult=mult;return s;}),[upd]);

  const doStartTour = useCallback(()=>upd(s=>{
    if(!s.tourQueue.length) return s;
    const mult=tourCostMult(s.archetype);
    // Upfront tour costs: travel + venue deposit + crew advance
    const upfront=s.tourQueue.reduce((sum,q)=>{
      const travel = q.travelCost; // gas, tolls, van wear for the leg
      const venueDeposit = Math.floor(q.venueCost * 0.3); // 30% deposit
      const crewAdvance = Math.floor(calcCrewCost(q.venueTier) * 0.5); // half crew pay upfront
      return sum + Math.floor((travel + venueDeposit + crewAdvance) * mult);
    },0);
    if(s.money<upfront){s.pendingEvent={msg:`Need ${fmtMoney(upfront)} upfront.`,type:"bad"};return s;}
    s.money-=upfront;
    s.tourActive={shows:[...s.tourQueue],progress:0,ticketMult:s.tourTicketMult,demandDecayIndex:0};
    s.tourQueue=[];
    s.log.unshift({week:s.week,msg:`Tour started: ${s.tourActive.shows.map(sh=>sh.cityName).join(" → ")}`,type:"good"});
    s.pendingEvent={msg:"On the road! End a week to play your first show.",type:"great"};
    return s;
  }),[upd]);

  // Streaming
  const doPromoteTrack = useCallback((id:string)=>upd(s=>{
    if(s.money<350){s.pendingEvent={msg:"Need $350 to promote.",type:"bad"};return s;}
    const t=s.catalog.find(x=>x.id===id); if(!t) return s;
    s.money-=350;
    const pct={Normal:0.50,Hit:0.65,Evergreen:0.80}[t.lifecycle]??0.50;
    t.weeklyStreams=Math.max(t.weeklyStreams,Math.floor(t.peakStreams*pct));
    t.promoted=true;
    // Promotion boosts Spotify/YouTube discovery algorithm placement
    if (t.platformMix) {
      t.platformMix.spotify = Math.min(0.65, (t.platformMix.spotify ?? 0.5) + 0.08);
      t.platformMix.youtube = Math.min(0.15, (t.platformMix.youtube ?? 0.08) + 0.04);
      // Normalize
      const sum = Object.values(t.platformMix).reduce((a,b)=>a+b,0);
      for (const k of Object.keys(t.platformMix)) t.platformMix[k] /= sum;
    }
    s.pendingEvent={msg:`"${t.title}" streams restored to ${Math.floor(pct*100)}% of peak. Spotify algorithm boost active.`,type:"great"};
    return s;
  }),[upd]);

  const doShootMusicVideo = useCallback((id:string)=>upd(s=>{
    if(s.money<1200){s.pendingEvent={msg:"Need $1,200 for music video.",type:"bad"};return s;}
    s.money-=1200; s.fame=clamp(s.fame+3,0,100); s.rep=clamp(s.rep+2,0,100); s.hype=clamp(s.hype+22,0,100); s.fans+=900;
    // Music videos deepen engagement — convert ~2% of casuals into superfans.
    const sfPrior = s.superfans ?? 0;
    const casualsAvail = Math.max(0, s.fans - sfPrior);
    const sfBump = Math.min(casualsAvail, 50 + Math.floor(casualsAvail * 0.02));
    if (sfBump > 0) s.superfans = sfPrior + sfBump;
    const cat=s.catalog.find(x=>x.id===id); const disc=s.discography.find(x=>x.id===id);
    if(cat){
      cat.hasMusicVideo=true;
      cat.weeklyStreams=Math.min(cat.peakStreams,Math.floor(cat.weeklyStreams*1.35));
      // Music videos boost YouTube Music and Spotify (video integration)
      if (cat.platformMix) {
        cat.platformMix.youtube = Math.min(0.18, (cat.platformMix.youtube ?? 0.08) + 0.06);
        cat.platformMix.spotify = Math.min(0.60, (cat.platformMix.spotify ?? 0.52) + 0.03);
        const sum = Object.values(cat.platformMix).reduce((a,b)=>a+b,0);
        for (const k of Object.keys(cat.platformMix)) cat.platformMix[k] /= sum;
      }
    }
    if(disc)disc.hasMusicVideo=true;
    s.pendingEvent={msg:"Music video done! YouTube Music + Spotify video boost active. Streams and hype up.",type:"great"};
    return s;
  }),[upd]);

  // More
  const doSignBrandDeal = useCallback((id:string)=>upd(s=>{
    const b=BRAND_DEALS.find(x=>x.id===id); if(!b) return s;
    s.activeBrandDeals.push({id:b.id,name:b.name,weeklyIncome:b.weeklyIncome,weeksLeft:b.duration});
    if(b.rep)s.rep=clamp(s.rep+Math.floor(b.rep*0.5),0,100); if(b.famePerk)s.fame=clamp(s.fame+Math.floor(b.famePerk*0.5),0,100);
    s.log.unshift({week:s.week,msg:`Brand deal: ${b.name} — ${fmtMoney(b.weeklyIncome)}/wk`,type:"good"});
    s.pendingEvent={msg:`Signed with ${b.name}!`,type:"gold"};
    return s;
  }),[upd]);

  // Accept / reject a queued label offer. Accepting locks in the contract & pays the advance.
  const doAcceptLabelOffer = useCallback((labelId:string)=>upd(s=>{
    const offer = s.pendingLabelOffers.find(o => o.labelId === labelId);
    if (!offer) return s;
    const L = getLabel(labelId);
    if (!L) return s;
    s.money += offer.advance;
    s.fame = clamp(s.fame + 10, 0, 100);
    s.currentLabel = {
      labelId: L.id, name: L.name, exec: L.exec, type: L.type,
      advance: offer.advance, advanceRecouped: 0,
      recordingFund: offer.recordingFund, recordingFundUsed: 0,
      royaltyRate: offer.royaltyRate, recoupRate: offer.recoupRate,
      streamingCut: offer.streamingCut, tourGrossCut: offer.tourGrossCut,
      merchCut: offer.merchCut, syncCut: offer.syncCut, publishingCut: offer.publishingCut,
      marketingCommitment: offer.marketingCommitment, marketingBoost: offer.marketingBoost, marketingSpendYTD: 0,
      albumsCommitted: offer.albumsCommitted, albumsDelivered: 0,
      optionsRemaining: offer.options, optionWeeks: offer.optionWeeks,
      weeksLeft: offer.termWeeks, totalWeeks: offer.termWeeks, signedAtWeek: s.week,
      crossCollateralization: offer.crossCollateralization,
      controlledComposition: offer.controlledComposition,
      controlledCompositionCap: offer.controlledCompositionCap,
      suspensionRights: offer.suspensionRights, keyPersonClause: offer.keyPersonClause,
      creativeControl: offer.creativeControl, approvalRights: [...offer.approvalRights],
      isRecouped: false, perks: [...(L.perks ?? [])],
    };
    s.labelSigned = true;
    s.pendingLabelOffers = [];
    s.log.unshift({week:s.week,msg:`Signed with ${L.name}! ${fmtMoney(offer.advance)} advance.`,type:"great"});
    // Build signing presentation
    const typeColor: Record<string,string> = {
      major:"#c0442c", americana:"#d4a820", indie:"#6a8d5a", boutique:"#a47bb8", specialty:"#5a8da8",
    };
    const signing: SigningPresentation = {
      kind: "label",
      name: L.name,
      exec: L.exec,
      city: L.city,
      accentColor: typeColor[L.type] ?? "#d4a820",
      advance: offer.advance,
      terms: [
        { label: "Streaming cut", value: Math.round(offer.streamingCut * 100) + "%", isGood: false },
        { label: "Tour cut", value: Math.round(offer.tourGrossCut * 100) + "%", isGood: false },
        { label: "Marketing boost", value: "×" + offer.marketingBoost.toFixed(2), isGood: true },
        { label: "Contract length", value: offer.termWeeks + " wk", isGood: true },
      ],
      perks: L.perks,
      quote: L.pitch,
      week: s.week,
    };
    s.signingPresentation = signing;
    return s;
  }),[upd]);

  const doDismissLabelOffers = useCallback(()=>upd(s=>{
    if (s.pendingLabelOffers.length) {
      s.log.unshift({week:s.week,msg:"Walked away from label offers.",type:"neutral"});
    }
    s.pendingLabelOffers = [];
    return s;
  }),[upd]);

  // Accept / reject a queued manager offer.
  const doAcceptManagerOffer = useCallback((managerId:string)=>upd(s=>{
    const offer = s.pendingManagerOffers.find(o => o.managerId === managerId);
    if (!offer) return s;
    const M = getManager(managerId);
    if (!M) return s;
    s.currentManager = {
      managerId: M.id, name: M.name,
      weeklyFee: offer.weeklyFee, showRevPct: offer.showRevPct,
      brandDealBoost: offer.brandDealBoost, repPerWeek: offer.repPerWeek,
      signedAtWeek: s.week,
    };
    s.hasManager = true;
    s.rep = clamp(s.rep + 5, 0, 100);
    s.pendingManagerOffers = [];
    s.log.unshift({week:s.week,msg:`Signed with ${M.name} as manager.`,type:"great"});
    // Build signing presentation
    const mgrTypeColor: Record<string,string> = {
      old_school:"#8a6d3a", boutique:"#a47bb8", aggressive:"#c0442c", legend:"#d4a820",
    };
    const terms = [
      { label: "Weekly retainer", value: fmtMoney(offer.weeklyFee) + "/wk", isGood: false },
      { label: "Show net bonus", value: "+" + Math.round(offer.showRevPct * 100) + "%", isGood: true },
    ];
    if (offer.brandDealBoost > 1) terms.push({ label: "Brand deal boost", value: "+" + Math.round((offer.brandDealBoost - 1) * 100) + "%", isGood: true });
    if (offer.repPerWeek > 0) terms.push({ label: "Rep accrual", value: "+" + offer.repPerWeek.toFixed(2) + "/wk", isGood: true });
    const signing: SigningPresentation = {
      kind: "manager",
      name: M.name,
      city: M.city,
      accentColor: mgrTypeColor[M.type] ?? "#6a8d5a",
      weeklyFee: offer.weeklyFee,
      terms,
      perks: M.perks,
      quote: M.pitch,
      week: s.week,
    };
    s.signingPresentation = signing;
    return s;
  }),[upd]);

  const doDismissManagerOffers = useCallback(()=>upd(s=>{
    if (s.pendingManagerOffers.length) {
      s.log.unshift({week:s.week,msg:"Walked away from manager offers.",type:"neutral"});
    }
    s.pendingManagerOffers = [];
    return s;
  }),[upd]);

  // ── FEATURE REQUESTS ─────────────────────────────────────────
  // Accept an inbound feature request: pay the cost in energy, collect the fee,
  // gain fame/rep/fans, log a guest credit, and bump the relationship counter
  // (which discounts THEIR fee on YOUR future tracks).
  const doAcceptFeatureRequest = useCallback((featureId:string)=>upd(s=>{
    if (!s.pendingFeatureRequests?.length) return s;
    const req = s.pendingFeatureRequests.find(r => r.featureId === featureId);
    if (!req) return s;
    const f = getFeature(featureId);
    if (!f) return s;
    if (s.energy < 10) {
      s.pendingEvent = { msg:"Need at least 10 energy to lay down a guest verse.", type:"bad" };
      return s;
    }
    s.energy -= 10;
    s.money += req.fee;
    s.totalEarned += req.fee;
    s.fame = clamp(s.fame + req.fameBonus, 0, 100);
    s.rep  = clamp(s.rep  + req.repBonus,  0, 100);
    s.fans += req.fanBonus;
    if (!s.guestCredits) s.guestCredits = [];
    s.guestCredits.unshift({
      featureId, artistName:f.name, trackTitle:req.trackTitle,
      week:s.week, fee:req.fee, themeId:req.themeId,
    });
    if (s.guestCredits.length > 24) s.guestCredits.length = 24;
    if (!s.featureWorkCounts) s.featureWorkCounts = {};
    s.featureWorkCounts[featureId] = (s.featureWorkCounts[featureId] ?? 0) + 1;
    s.log.unshift({
      week:s.week,
      msg:`Guested on ${f.name}'s "${req.trackTitle}" — ${fmtMoney(req.fee)}, +${req.fameBonus} fame.`,
      type:"good",
    });
    s.pendingFeatureRequests = [];
    s.cooldowns["feat_req"] = 8; // earned a longer breather after collaborating
    s.pendingEvent = {
      msg:`Featured on ${f.name}'s track! +${fmtMoney(req.fee)}, +${req.fameBonus} fame, +${fmt(req.fanBonus)} fans.`,
      type:"gold",
    };
    return s;
  }),[upd]);

  const doDismissFeatureRequests = useCallback(()=>upd(s=>{
    if (s.pendingFeatureRequests?.length) {
      const r = s.pendingFeatureRequests[0];
      const f = getFeature(r.featureId);
      s.log.unshift({ week:s.week, msg:`Passed on a feature offer from ${f?.name ?? "an artist"}.`, type:"neutral" });
    }
    s.pendingFeatureRequests = [];
    return s;
  }),[upd]);

  // Drop your current contracts. Breaking a label deal carries a rep penalty
  // AND blocks new label pitches for a long cooldown to prevent advance-farming.
  const doDropLabel = useCallback(()=>upd(s=>{
    if (!s.currentLabel) return s;
    s.log.unshift({week:s.week,msg:`Dropped from ${s.currentLabel.name}. -5 rep. Word travels fast.`,type:"bad"});
    s.rep = clamp(s.rep - 5, 0, 100);
    s.currentLabel = null;
    s.labelSigned = false;
    // 26-week (~6 month) industry-wide cooldown — labels talk to each other.
    s.cooldowns["net_label"] = 26;
    return s;
  }),[upd]);

  const doDropManager = useCallback(()=>upd(s=>{
    if (!s.currentManager) return s;
    s.log.unshift({week:s.week,msg:`Parted ways with ${s.currentManager.name}.`,type:"neutral"});
    s.currentManager = null;
    s.hasManager = false;
    return s;
  }),[upd]);

  const doCloseReleasePresentation = useCallback(()=>upd(s=>{
    s.releasePresentation = null;
    return s;
  }),[upd]);

  const doCloseTourWrapPresentation = useCallback(()=>upd(s=>{
    s.tourWrapPresentation = null;
    return s;
  }),[upd]);

  const doCloseSigningPresentation = useCallback(()=>upd(s=>{
    s.signingPresentation = null;
    return s;
  }),[upd]);

  const doCloseAwardPresentation = useCallback(()=>upd(s=>{
    s.awardPresentation = null;
    return s;
  }),[upd]);

  const doCloseMilestonePresentation = useCallback(()=>upd(s=>{
    s.milestonePresentation = null;
    return s;
  }),[upd]);

  const doResolveScenario = useCallback((scenarioId: string, choiceIdx: number, rollSuccess?: boolean) => upd(s => {
    const scenario = RANDOM_SCENARIOS.find(sc => sc.id === scenarioId);
    if (!scenario) return s;
    const choice = scenario.choices[choiceIdx];
    if (!choice) return s;
    s.pendingScenarioId = null;
    let effect: ScenarioEffect = { ...choice.effect };
    let resultMsg = choice.result;
    if (choice.roll) {
      const win = rollSuccess !== undefined ? rollSuccess : Math.random() < choice.roll.chance;
      if (win) { effect = { ...effect, ...choice.roll.onSuccess }; resultMsg = choice.roll.successMsg; }
      else      { effect = { ...effect, ...choice.roll.onFail };   resultMsg = choice.roll.failMsg; }
    }
    if (effect.money)       s.money += effect.money;
    if (effect.fans)        s.fans  = Math.max(0, s.fans + effect.fans);
    if (effect.fame)        s.fame  = clamp(s.fame + effect.fame, 0, 100);
    if (effect.rep)         s.rep   = clamp(s.rep  + effect.rep,  0, 100);
    if (effect.energy)      s.energy = clamp((s.energy ?? 0) + effect.energy, 0, 100);
    if (effect.hype)        s.hype  = clamp((s.hype ?? 0) + effect.hype, 0, 100);
    if (effect.qualityBase) s.qualityBase = Math.max(20, s.qualityBase + effect.qualityBase);
    if (effect.saturation)  s.marketSaturation = Math.min(100, Math.max(0, (s.marketSaturation ?? 0) + effect.saturation));
    const netVal = (effect.money ?? 0) * 0.001 + (effect.fans ?? 0) * 0.01 + (effect.fame ?? 0) + (effect.rep ?? 0);
    const logType = netVal > 5 ? "great" : netVal > 0 ? "good" : netVal < -3 ? "bad" : "neutral";
    s.log.unshift({ week: s.week, msg: `${scenario.title}: ${resultMsg}`, type: logType as "good"|"bad"|"great"|"neutral" });
    s.pendingEvent = { msg: resultMsg, type: logType };
    return s;
  }), [upd]);

  // ── #3 Burnout: Vacation action ─────────────────────────
  // A real reset — clears most burnout, restores energy, but costs cash + time
  // off (cooldown gates spam-vacationing). Strong but not free.
  const doTakeVacation = useCallback(()=>upd(s=>{
    if ((s.vacationCooldown ?? 0) > 0) {
      s.pendingEvent = { msg:`You've vacationed recently. ${s.vacationCooldown}wk cooldown.`, type:"bad" };
      return s;
    }
    const cost = 2200;
    if (s.money < cost) {
      s.pendingEvent = { msg:`Need ${fmtMoney(cost)} for a real getaway.`, type:"bad" };
      return s;
    }
    s.money -= cost;
    const before = s.burnout ?? 0;
    s.burnout = Math.max(0, before - 45);
    s.energy  = clamp(s.energy + 35, 0, 100);
    s.vacationCooldown = 8;
    s.log.unshift({ week:s.week, msg:`Took a week off. Burnout ${before.toFixed(0)}→${s.burnout.toFixed(0)}. -${fmtMoney(cost)}.`, type:"good" });
    s.pendingEvent = { msg:"You took a real break. The studio can wait.", type:"great" };
    return s;
  }),[upd]);

  // ── #5 Story Arcs: resolve a pending choice ─────────────
  // Apply the choice's immediate effect, push the choice into the path, then
  // either advance to the next step (with its delay) or mark the arc complete.
  const doResolveArcChoice = useCallback((arcId:string, choiceIdx:number)=>upd(s=>{
    if (!s.pendingArcChoice || s.pendingArcChoice.arcId !== arcId) return s;
    const arc = getStoryArc(arcId);
    if (!arc) { s.pendingArcChoice = null; return s; }
    const inst = (s.activeArcs ?? []).find(a => a.arcId === arcId);
    if (!inst) { s.pendingArcChoice = null; return s; }
    const step = arc.steps[inst.currentStep];
    if (!step) { s.pendingArcChoice = null; inst.currentStep = -1; return s; }
    const choice = step.choices[choiceIdx];
    if (!choice) return s;

    // If the choice carries an inline roll (e.g. lawsuit verdict), resolve it
    // now and swap in the rolled effect/result before applying anything.
    let appliedEffect: ScenarioEffect = choice.effect ?? {};
    let appliedResult: string = choice.result;
    if (choice.roll) {
      const success = Math.random() < choice.roll.chance;
      appliedEffect = success ? choice.roll.onSuccess : choice.roll.onFail;
      appliedResult = success ? choice.roll.successResult : choice.roll.failResult;
    }

    // Apply immediate one-shot effect (mirrors doResolveScenario's mapping).
    const e = appliedEffect;
    if (e.money)       s.money += e.money;
    if (e.fans)        s.fans  = Math.max(0, s.fans + e.fans);
    if (e.fame)        s.fame  = clamp(s.fame  + e.fame, 0, 100);
    if (e.rep)         s.rep   = clamp(s.rep   + e.rep,  0, 100);
    if (e.energy)      s.energy= clamp(s.energy+ e.energy, 0, 100);
    if (e.hype)        s.hype  = clamp(s.hype  + e.hype, 0, 100);
    if (e.burnout)     s.burnout = clamp((s.burnout ?? 0) + e.burnout, 0, 100);
    if (e.qualityBase) s.qualityBase = Math.max(20, s.qualityBase + e.qualityBase);
    if (e.superfans)   s.superfans = Math.max(0, Math.min(s.fans, (s.superfans ?? 0) + e.superfans));

    // ArcChoice has no id field — record by index for the run history.
    inst.choicePath.push(`${inst.currentStep}:${choiceIdx}`);
    s.pendingArcChoice = null;

    // Advance the arc — either next step (with delay) or finish.
    if (choice.nextStep === -1 || choice.nextStep === undefined) {
      inst.currentStep = -1;
      s.completedArcs = [...(s.completedArcs ?? []), arcId];
      s.log.unshift({ week:s.week, msg:`Chapter closed: ${arc.title}. ${appliedResult}`, type:"neutral" });
    } else {
      const nextIdx = choice.nextStep;
      const nextStep = arc.steps[nextIdx];
      if (!nextStep) {
        inst.currentStep = -1;
        s.completedArcs = [...(s.completedArcs ?? []), arcId];
      } else {
        inst.currentStep = nextIdx;
        inst.fireOnWeek = s.week + (nextStep.delay ?? 1);
        s.log.unshift({ week:s.week, msg:`${arc.title}: ${appliedResult}`, type:"neutral" });
      }
    }
    s.pendingEvent = { msg: appliedResult, type: "neutral" };
    return s;
  }),[upd]);

  const doSignLabel = useCallback(()=>upd(s=>{
    const adv=(s as any)._pendingLabelAdvance??30000;
    s.money+=adv; s.labelSigned=true; s.fame=clamp(s.fame+5,0,100);
    delete (s as any)._pendingLabelAdvance; s.modal=null;
    s.pendingEvent={msg:`Label signed! ${fmtMoney(adv)} advance.`,type:"gold"};
    return s;
  }),[upd]);

  // Merch shop
  const doAddMerchItem = useCallback((
    type: MerchType, tiedReleaseId: string | null, name: string, price: number,
    opts?: { variantName?: string; variantColor?: string; editionLabel?: string; bonusCost?: number; bonusPrice?: number; suppressEvent?: boolean }
  ) => upd(s => {
    const tmpl = MERCH_TEMPLATES.find(t => t.type === type);
    if (!tmpl) return s;
    if (tmpl.needsRelease && !tiedReleaseId) {
      s.pendingEvent = { msg: `${type} requires an album to tie to.`, type: "bad" };
      return s;
    }
    const unitCost = tmpl.baseCost + (opts?.bonusCost ?? 0);
    const setup = Math.max(40, Math.floor(unitCost * 25));
    if (s.money < setup) {
      s.pendingEvent = { msg: `Need ${fmtMoney(setup)} to set up the ${type} run.`, type: "bad" };
      return s;
    }
    const tied = tiedReleaseId ? s.catalog.find(c => c.id === tiedReleaseId) : null;
    const finalPrice = Math.max(1, Math.floor(price + (opts?.bonusPrice ?? 0)));
    const editionTag = opts?.editionLabel && opts.editionLabel !== "Standard" ? ` — ${opts.editionLabel}` : "";
    const variantTag = opts?.variantName && opts.variantName !== "Standard Black" && opts.variantName !== "Standard Jewel Case" && opts.variantName !== "Black Shell" ? ` (${opts.variantName})` : "";
    const baseName = name.trim() || tmpl.defaultName(tied?.title ?? null, s.artistName);
    const item: MerchItem = {
      id: "m" + Date.now() + Math.random().toString(36).slice(2,5),
      type, name: baseName + variantTag + editionTag,
      emoji: tmpl.emoji,
      tiedToReleaseId: tiedReleaseId,
      tiedToReleaseTitle: tied?.title ?? null,
      price: finalPrice,
      cost: unitCost,
      releasedWeek: s.week,
      weeklySales: [],
      totalSold: 0,
      totalRevenue: 0,
      reviews: [],
      active: true,
      variantName: opts?.variantName,
      variantColor: opts?.variantColor,
      editionLabel: opts?.editionLabel && opts.editionLabel !== "Standard" ? opts.editionLabel : undefined,
    };
    s.money -= setup;
    if (!s.merchShop) s.merchShop = [];
    s.merchShop.unshift(item);
    s.log.unshift({ week: s.week, msg: `New merch listed: ${item.name} (${fmtMoney(setup)} setup)`, type: "neutral" });
    if (!opts?.suppressEvent) {
      s.pendingEvent = { msg: `${item.name} is live in the shop.`, type: "good" };
    }
    return s;
  }), [upd]);

  const doDismissPressing = useCallback(() => upd(s => { s.pendingPressing = null; return s; }), [upd]);

  // Press one or more physical formats at once. selections = [{type, variantName, variantColor, edition, ...}]
  const doQuickPress = useCallback((releaseId: string, selections: Array<{ type: MerchType; variantName: string; variantColor: string; variantPriceMod: number; variantCostMod: number; editionName: string; editionPriceMod: number; editionCostMod: number; }>) => upd(s => {
    const rel = s.catalog.find(c => c.id === releaseId);
    if (!rel) { s.pendingPressing = null; return s; }
    let totalSetup = 0;
    for (const sel of selections) {
      const tmpl = MERCH_TEMPLATES.find(t => t.type === sel.type);
      if (!tmpl) continue;
      const unitCost = tmpl.baseCost + sel.variantCostMod + sel.editionCostMod;
      totalSetup += Math.max(40, Math.floor(unitCost * 30));
    }
    if (s.money < totalSetup) {
      s.pendingEvent = { msg: `Need ${fmtMoney(totalSetup)} to press these. You have ${fmtMoney(s.money)}.`, type: "bad" };
      return s;
    }
    if (!s.merchShop) s.merchShop = [];
    let pressed = 0;
    for (const sel of selections) {
      const tmpl = MERCH_TEMPLATES.find(t => t.type === sel.type);
      if (!tmpl) continue;
      const unitCost = tmpl.baseCost + sel.variantCostMod + sel.editionCostMod;
      const setup = Math.max(40, Math.floor(unitCost * 25));
      const finalPrice = tmpl.basePrice + sel.variantPriceMod + sel.editionPriceMod;
      const variantTag = sel.variantName && sel.variantName !== "Standard Black" && sel.variantName !== "Standard Jewel Case" && sel.variantName !== "Black Shell" ? ` (${sel.variantName})` : "";
      const editionTag = sel.editionName && sel.editionName !== "Standard" ? ` — ${sel.editionName}` : "";
      const item: MerchItem = {
        id: "m" + Date.now() + Math.random().toString(36).slice(2,5) + pressed,
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
    // touch helpers so TS sees they're referenced
    void getPressingVariants; void isPhysicalFormat; void MERCH_EDITIONS;
    return s;
  }), [upd]);

  const doToggleMerchItem = useCallback((id: string) => upd(s => {
    const it = s.merchShop?.find(m => m.id === id);
    if (it) it.active = !it.active;
    return s;
  }), [upd]);

  const doRemoveMerchItem = useCallback((id: string) => upd(s => {
    s.merchShop = (s.merchShop ?? []).filter(m => m.id !== id);
    return s;
  }), [upd]);

  const doTakeStudioBreak = useCallback(()=>upd(s=>{
    if (!s.project || s.project.weeksLeft === 0) return s;
    s.project.studioBreakThisWeek = true;
    s.project.pushThroughThisWeek = false;
    return s;
  }),[upd]);

  const doPushThrough = useCallback(()=>upd(s=>{
    if (!s.project || s.project.weeksLeft === 0) return s;
    s.project.pushThroughThisWeek = true;
    s.project.studioBreakThisWeek = false;
    return s;
  }),[upd]);

  const doCancelStudioChoice = useCallback(()=>upd(s=>{
    if (!s.project) return s;
    s.project.studioBreakThisWeek = false;
    s.project.pushThroughThisWeek = false;
    return s;
  }),[upd]);

  const doAbortTour = useCallback(()=>upd(s=>{
    if (!s.tourActive) return s;
    const remaining = s.tourActive.shows.length - s.tourActive.progress;
    if (remaining === 0) { s.tourActive = null; return s; }
    // Rep penalty scales with how many shows you bail on.
    const repPenalty = Math.min(12, 2 + remaining * 2);
    s.rep = clamp(s.rep - repPenalty, 0, 100);
    // Cutting the road short means real rest — meaningful burnout + energy recovery.
    s.burnout = clamp((s.burnout ?? 0) - 20, 0, 100);
    s.energy = clamp(s.energy + 15, 0, 100);
    s.tourActive = null;
    s.log.unshift({ week: s.week, msg: `Pulled off the road. ${remaining} show${remaining===1?"":"s"} cancelled. -${repPenalty} rep. Got some rest.`, type: "bad" });
    s.pendingEvent = { msg: `Tour ended early — ${remaining} show${remaining===1?"":"s"} cut. -${repPenalty} rep.`, type: "bad" };
    return s;
  }), [upd]);

  const doSwitchGenre = useCallback((genre:Genre)=>upd(s=>{
    s.genre=genre; s.rep=clamp(s.rep-10,0,100);
    // Superfans signed up for who you were. A pivot loses ~25% of them.
    const sfLost = Math.floor((s.superfans ?? 0) * 0.25);
    if (sfLost > 0) {
      s.superfans = Math.max(0, (s.superfans ?? 0) - sfLost);
      s.fans = Math.max(0, s.fans - sfLost);
    }
    const lostNote = sfLost > 0 ? ` -${fmt(sfLost)} superfans walked.` : "";
    s.pendingEvent={msg:`Now making ${genre} music. -10 rep.${lostNote}`,type:"bad"};
    return s;
  }),[upd]);

  return {
    state, hasSave, advance:doAdvance, doDismissEvent, dismissModal, dismissNewspaper, openArchivedNewspaper,
    doCloseReleasePresentation, doResolveScenario,
    goToMenu, goToSetup, loadGame, clearSave, startNewGame,
    doStartProject, doUpdateProject, doAddTrack, doRemoveTrack,
    doFinishProject, doReleaseProject, doDeleteUnreleased, doScrubProject,
    doGrind, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour,
    doPromoteTrack, doShootMusicVideo,
    doSignBrandDeal, doSignLabel, doSwitchGenre,
    doAcceptLabelOffer, doDismissLabelOffers, doAcceptManagerOffer, doDismissManagerOffers,
    doAcceptFeatureRequest, doDismissFeatureRequests,
    doDropLabel, doDropManager,
    doAddMerchItem, doToggleMerchItem, doRemoveMerchItem,
    doDismissPressing, doQuickPress,
    doTakeVacation, doResolveArcChoice, doAbortTour,
    doTakeStudioBreak, doPushThrough, doCancelStudioChoice,
    doCloseTourWrapPresentation, doCloseSigningPresentation,
    doCloseAwardPresentation, doCloseMilestonePresentation,
  };
}
