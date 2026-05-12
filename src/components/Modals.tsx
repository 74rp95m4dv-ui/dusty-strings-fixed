import { useState } from "react";
import { RANDOM_SCENARIOS, getStoryArc, fmtMoney, fmt, VINYL_VARIANTS, CD_VARIANTS, CASSETTE_VARIANTS, MERCH_EDITIONS, getFeature, getLabel, getManager, MERCH_TEMPLATES } from "../gameLogic";

export function ReleaseModal(game: any) {
  const { state, doCloseReleasePresentation } = game;
  const r = state.releasePresentation!;
  return (
    <div className="modal-overlay" onClick={doCloseReleasePresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title" style={{ color: r.outcome === "Viral" ? "var(--gold)" : r.outcome === "Hit" ? "var(--sage)" : r.outcome === "Flop" ? "var(--danger)" : "var(--text)" }}>
          {r.outcome === "Viral" ? "🔥 VIRAL" : r.outcome === "Hit" ? "📀 HIT" : r.outcome === "Flop" ? "💔 FLOP" : "MODERATE"}
        </div>
        <div style={{ fontSize: 18, fontFamily: "var(--head)", fontWeight: 900, fontStyle: "italic", marginBottom: 8 }}>“{r.title}”</div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>{r.type} • Q{r.quality.toFixed(0)} • {r.lifecycle}</div>
        <div className="gstat" style={{ marginBottom: 12 }}>
          <div className="card bigstat"><div className="bigstat-num">{fmtMoney(r.revenue)}</div><div className="bigstat-lbl">Revenue</div></div>
          <div className="card bigstat"><div className="bigstat-num">{fmt(r.fansGained)}</div><div className="bigstat-lbl">Fans</div></div>
        </div>
        <div style={{ fontSize: 13, fontStyle: "italic", marginBottom: 12, lineHeight: 1.5 }}>“{r.criticHeadline}”</div>
        <div style={{ marginBottom: 10 }}>
          <div className="card-title">Fan Reviews</div>
          {r.fanReviews.map((rev: any, i: number) => (
            <div key={i} style={{ fontSize: 12, marginBottom: 6, padding: 8, background: "var(--bg3)", borderRadius: 6 }}>
              <b>{rev.handle}</b> {"★".repeat(rev.stars)}{"☆".repeat(5 - rev.stars)}<br />
              <span style={{ color: "var(--muted2)" }}>{rev.text}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-lime btn-block" onClick={doCloseReleasePresentation}>Continue</button>
      </div>
    </div>
  );
}

export function TourWrapModal(game: any) {
  const { state, doCloseTourWrapPresentation } = game;
  const w = state.tourWrapPresentation!;
  return (
    <div className="modal-overlay" onClick={doCloseTourWrapPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">Tour Wrapped</div>
        <div style={{ fontSize: 14, marginBottom: 12 }}>{w.tourName}</div>
        <div className="gstat" style={{ marginBottom: 12 }}>
          <div className="card bigstat"><div className="bigstat-num">{fmtMoney(w.netProfit)}</div><div className="bigstat-lbl">Net</div></div>
          <div className="card bigstat"><div className="bigstat-num">{w.avgFill}%</div><div className="bigstat-lbl">Avg Fill</div></div>
        </div>
        {w.bestShow && <div style={{ fontSize: 12, marginBottom: 6 }}>Best: {w.bestShow.city} @ {w.bestShow.venue} ({w.bestShow.attendancePct}%)</div>}
        {w.worstShow && <div style={{ fontSize: 12, marginBottom: 12 }}>Worst: {w.worstShow.city} @ {w.worstShow.venue} ({w.worstShow.attendancePct}%)</div>}
        <button className="btn btn-lime btn-block" onClick={doCloseTourWrapPresentation}>Continue</button>
      </div>
    </div>
  );
}

export function SigningModal(game: any) {
  const { state, doCloseSigningPresentation } = game;
  const sig = state.signingPresentation!;
  return (
    <div className="modal-overlay" onClick={doCloseSigningPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title" style={{ color: sig.accentColor }}>{sig.kind === "label" ? "Label Signed" : "Manager Signed"}</div>
        <div style={{ fontSize: 18, fontFamily: "var(--head)", fontWeight: 900, marginBottom: 4 }}>{sig.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>{sig.city}</div>
        {sig.advance && <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{fmtMoney(sig.advance)} advance</div>}
        {sig.weeklyFee && <div style={{ fontSize: 14, marginBottom: 12 }}>{fmtMoney(sig.weeklyFee)}/wk retainer</div>}
        <div style={{ marginBottom: 12 }}>
          {sig.terms.map((t: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{t.label}</span><span style={{ color: t.isGood ? "var(--sage)" : "var(--danger)" }}>{t.value}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, fontStyle: "italic", lineHeight: 1.5, marginBottom: 16 }}>“{sig.quote}”</div>
        <button className="btn btn-lime btn-block" onClick={doCloseSigningPresentation}>Continue</button>
      </div>
    </div>
  );
}

export function AwardModal(game: any) {
  const { state, doCloseAwardPresentation } = game;
  const a = state.awardPresentation!;
  return (
    <div className="modal-overlay" onClick={doCloseAwardPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title" style={{ color: "var(--gold)" }}>🏆 {a.name}</div>
        <div style={{ fontSize: 13, marginBottom: 12 }}>{a.desc}</div>
        <div className="gstat">
          <div className="card bigstat"><div className="bigstat-num">{fmtMoney(a.money)}</div><div className="bigstat-lbl">Prize</div></div>
          <div className="card bigstat"><div className="bigstat-num">+{a.famePerk}</div><div className="bigstat-lbl">Fame</div></div>
        </div>
        <button className="btn btn-lime btn-block" style={{ marginTop: 12 }} onClick={doCloseAwardPresentation}>Continue</button>
      </div>
    </div>
  );
}

export function MilestoneModal(game: any) {
  const { state, doCloseMilestonePresentation } = game;
  const m = state.milestonePresentation!;
  return (
    <div className="modal-overlay" onClick={doCloseMilestonePresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title" style={{ color: m.tier.color }}>{m.tier.icon} {m.tier.name}</div>
        <div style={{ fontSize: 13, marginBottom: 12 }}>{m.tier.flavor}</div>
        <div style={{ fontSize: 12, color: "var(--muted2)" }}>Unlocks: {m.tier.unlocks.join(", ")}</div>
        <button className="btn btn-lime btn-block" style={{ marginTop: 12 }} onClick={doCloseMilestonePresentation}>Continue</button>
      </div>
    </div>
  );
}

export function ScenarioModal(game: any) {
  const { state, doResolveScenario } = game;
  const sc = RANDOM_SCENARIOS.find((s: any) => s.id === state.pendingScenarioId)!;
  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">{sc.emoji} {sc.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{sc.body}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sc.choices.map((c: any, i: number) => (
            <button key={i} className="btn btn-block" onClick={() => doResolveScenario(sc.id, i)}>
              <div style={{ textAlign: "left", width: "100%" }}><div style={{ fontWeight: 700 }}>{c.label}</div><div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{c.sub}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewspaperModal(game: any) {
  const { state, dismissNewspaper } = game;
  const issue = JSON.parse(state.pendingNewspaperJson!);
  return (
    <div className="modal-overlay" onClick={dismissNewspaper}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "92vh" }}>
        <div className="modal-handle" />
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--head)", fontSize: 20, fontWeight: 900 }}>The Nashville Times</div>
          <div style={{ fontSize: 11, color: "var(--muted2)" }}>Vol {issue.volume} No {issue.issue} • Week {issue.week}</div>
          <div style={{ fontSize: 11, color: "var(--muted2)", fontStyle: "italic" }}>{issue.weather}</div>
        </div>
        <div>
          {issue.stories.map((st: any, i: number) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.1, color: "var(--amber)", marginBottom: 2 }}>{st.section}</div>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--head)", marginBottom: 4 }}>{st.headline}</div>
              <div style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 6 }}>{st.byline}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text2)" }}>{st.body}</div>
            </div>
          ))}
        </div>
        {issue.letters && issue.letters.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="sec-div">Letters to the Editor</div>
            {issue.letters.map((l: any, i: number) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 10, padding: 10, background: "var(--bg3)", borderRadius: 8 }}>
                <div style={{ fontStyle: "italic", marginBottom: 4 }}>“{l.body}”</div>
                <div style={{ fontSize: 10, color: "var(--muted2)" }}>— {l.signature}, {l.city}</div>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-lime btn-block" style={{ marginTop: 12 }} onClick={dismissNewspaper}>Close</button>
      </div>
    </div>
  );
}

export function ArcModal(game: any) {
  const { state, doResolveArcChoice } = game;
  const { arcId, stepIndex } = state.pendingArcChoice!;
  const arc = getStoryArc(arcId)!;
  const step = arc.steps[stepIndex];
  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">{step.emoji} {step.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{step.body}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {step.choices.map((c: any, i: number) => (
            <button key={i} className="btn btn-block" onClick={() => doResolveArcChoice(arcId, i)}>
              <div style={{ textAlign: "left", width: "100%" }}><div style={{ fontWeight: 700 }}>{c.label}</div><div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{c.sub}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureModal(game: any) {
  const { state, doAcceptFeatureRequest, doDismissFeatureRequests } = game;
  const req = state.pendingFeatureRequests[0];
  const feat = getFeature(req.featureId);
  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">🎤 Feature Request</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{feat?.name ?? "An artist"}</div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>Wants you on <i>“{req.trackTitle}”</i></div>
        <div className="gstat" style={{ marginBottom: 12 }}>
          <div className="card bigstat"><div className="bigstat-num">{fmtMoney(req.fee)}</div><div className="bigstat-lbl">Fee</div></div>
          <div className="card bigstat"><div className="bigstat-num">+{req.fameBonus}</div><div className="bigstat-lbl">Fame</div></div>
        </div>
        <div style={{ fontSize: 12, marginBottom: 16 }}>{req.fitNote}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-lime" style={{ flex: 1 }} onClick={() => doAcceptFeatureRequest(req.featureId)}>Accept</button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={doDismissFeatureRequests}>Decline</button>
        </div>
      </div>
    </div>
  );
}

export function LabelOfferModal(game: any) {
  const { state, doAcceptLabelOffer, doDismissLabelOffers } = game;
  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">📋 Label Offers</div>
        {state.pendingLabelOffers.map((o: any) => {
          const L = getLabel(o.labelId);
          return (
            <div className="card" key={o.labelId} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{L?.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6 }}>{L?.exec} • {L?.city}</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>{o.fitNote}</div>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)" }}>
                Advance: {fmtMoney(o.advance)}<br />Streaming cut: {Math.round(o.streamingCut * 100)}%<br />Tour cut: {Math.round(o.tourCut * 100)}%<br />Marketing: ×{o.marketingBoost.toFixed(2)}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm btn-lime" onClick={() => doAcceptLabelOffer(o.labelId)}>Sign</button>
              </div>
            </div>
          );
        })}
        <button className="btn btn-ghost btn-block" onClick={doDismissLabelOffers}>Walk Away</button>
      </div>
    </div>
  );
}

export function ManagerOfferModal(game: any) {
  const { state, doAcceptManagerOffer, doDismissManagerOffers } = game;
  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">📋 Manager Offers</div>
        {state.pendingManagerOffers.map((o: any) => {
          const M = getManager(o.managerId);
          return (
            <div className="card" key={o.managerId} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{M?.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6 }}>{M?.city}</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>{o.fitNote}</div>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)" }}>
                Fee: {fmtMoney(o.weeklyFee)}/wk<br />Show bonus: +{Math.round(o.showRevPct * 100)}%<br />Brand boost: ×{o.brandDealBoost.toFixed(2)}<br />Rep: +{o.repPerWeek.toFixed(2)}/wk
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm btn-lime" onClick={() => doAcceptManagerOffer(o.managerId)}>Sign</button>
              </div>
            </div>
          );
        })}
        <button className="btn btn-ghost btn-block" onClick={doDismissManagerOffers}>Walk Away</button>
      </div>
    </div>
  );
}

export function PressingModal(game: any) {
  const { state, doQuickPress, doDismissPressing } = game;
  const p = state.pendingPressing!;
  const [selections, setSelections] = useState<any[]>([]);

  const toggleFormat = (fmt: string) => {
    const exists = selections.find((s: any) => s.type === fmt);
    if (exists) setSelections(selections.filter((s: any) => s.type !== fmt));
    else {
      const variants = fmt === "Vinyl" ? VINYL_VARIANTS : fmt === "CD" ? CD_VARIANTS : CASSETTE_VARIANTS;
      const v = variants[0];
      const e = MERCH_EDITIONS[0];
      setSelections([...selections, { type: fmt, variantName: v?.name ?? "", variantColor: v?.color ?? "", variantPriceMod: v?.priceMod ?? 0, variantCostMod: v?.costMod ?? 0, editionName: e.name, editionPriceMod: e.priceMod, editionCostMod: e.costMod }]);
    }
  };

  const totalSetup = selections.reduce((sum: number, sel: any) => {
    const tmpl = MERCH_TEMPLATES.find((t: any) => t.type === sel.type);
    if (!tmpl) return sum;
    return sum + Math.max(40, Math.floor((tmpl.baseCost + sel.variantCostMod + sel.editionCostMod) * 30));
  }, 0);

  return (
    <div className="modal-overlay" onClick={doDismissPressing}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" /><div className="modal-title">💿 Press {p.releaseTitle}</div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>{p.releaseType} • Pick formats to manufacture</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {(["Vinyl", "CD", "Cassette"] as string[]).map((fmt) => <button key={fmt} className={`btn ${selections.find((s: any) => s.type === fmt) ? "btn-lime" : ""}`} onClick={() => toggleFormat(fmt)}>{fmt}</button>)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Setup cost: {fmtMoney(totalSetup)}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-lime" disabled={selections.length === 0 || state.money < totalSetup} onClick={() => doQuickPress(p.releaseId, selections)}>Press</button>
          <button className="btn btn-ghost" onClick={doDismissPressing}>Skip</button>
        </div>
      </div>
    </div>
  );
}
