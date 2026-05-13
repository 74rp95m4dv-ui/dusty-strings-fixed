import React from "react";
import {
BRAND_DEALS,
AWARDS,
CAREER_TIERS,
getCareerTierIdx,
fmtMoney,
RIVALS,
type GameState,
type SignedLabel,
recoupProgress,
get360Summary,
fmtPercent,
fmtDuration,
getRiskLabel,
type LabelOffer,
} from "../gameLogic";

interface CareerTabProps {
state: GameState;
doSignBrandDeal: (id: string) => void;
doDropLabel: () => void;
doDropManager: () => void;
doTakeVacation: () => void;
doSwitchGenre: () => void;
doDismissLabelOffers: () => void;
doDismissManagerOffers: () => void;
doSignLabel: (offer: LabelOffer) => void;
doViewLabelOffer: (offer: LabelOffer) => void;
}

export default function CareerTab(game: CareerTabProps) {
const {
state,
doSignBrandDeal,
doDropLabel,
doDropManager,
doTakeVacation,
doSwitchGenre,
doDismissLabelOffers,
doDismissManagerOffers,
doSignLabel,
doViewLabelOffer,
} = game;

return (
<div className="career-tab">
<div className="pg-hd">
<div className="pg-title">Deals & Career</div>
</div>

```
  {/* ── LABEL CONTRACT ── */}
  <LabelContractCard
    state={state}
    onDrop={doDropLabel}
    onSign={doSignLabel}
    onView={doViewLabelOffer}
  />

  {/* ── MANAGEMENT ── */}
  <div className="card">
    <div className="card-title">Management</div>
    {state.currentManager ? (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {state.currentManager.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>
          {fmtMoney(state.currentManager.weeklyFee)}/wk • +{Math.round(state.currentManager.showRevPct * 100)}% shows
        </div>
        <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={doDropManager}>
          Part Ways
        </button>
      </div>
    ) : (
      <div style={{ fontSize: 12, color: "var(--muted2)" }}>
        No manager. Offers appear as you grow.
      </div>
    )}
  </div>

  {/* ── BRAND DEALS ── */}
  <div className="card">
    <div className="card-title">Brand Deals</div>
    {BRAND_DEALS.filter(
      (b: any) =>
        state.fame >= b.fameReq &&
        state.rep >= b.repReq &&
        !state.activeBrandDeals.find((d: any) => d.id === b.id)
    ).map((b: any) => (
      <div className="pick-card" key={b.id} onClick={() => doSignBrandDeal(b.id)}>
        <div>
          <div className="pick-name">{b.name}</div>
          <div className="pick-meta">
            {fmtMoney(b.weeklyIncome)}/wk • {b.duration}wk • {b.desc}
          </div>
        </div>
      </div>
    ))}
    {BRAND_DEALS.filter(
      (b: any) =>
        state.fame >= b.fameReq &&
        state.rep >= b.repReq &&
        !state.activeBrandDeals.find((d: any) => d.id === b.id)
    ).length === 0 && (
      <div style={{ fontSize: 12, color: "var(--muted2)" }}>No deals available right now.</div>
    )}
  </div>

  {/* ── AWARDS ── */}
  <div className="card">
    <div className="card-title">Awards</div>
    {state.awardsWon.length === 0 && (
      <div style={{ fontSize: 12, color: "var(--muted2)" }}>None yet.</div>
    )}
    {state.awardsWon.map((id: string) => {
      const a = AWARDS.find((x: any) => x.id === id)!;
      return (
        <div className="award-card" key={id}>
          <div className="award-icon">🏆</div>
          <div className="award-info">
            <div className="award-name">{a.name}</div>
            <div className="award-desc">{a.desc}</div>
          </div>
        </div>
      );
    })}
  </div>

  {/* ── CAREER TIER ── */}
  <div className="card">
    <div className="card-title">Career Tier</div>
    {CAREER_TIERS.map((t: any) => (
      <div
        key={t.idx}
        style={{
          opacity: state.fame >= t.fameReq ? 1 : 0.35,
          marginBottom: 6,
          fontSize: 12,
        }}
      >
        <b>
          {t.icon} {t.name}
        </b>
        {state.fame >= t.fameReq ? " ✓" : ` (need ${t.fameReq} fame)`}
        <div style={{ fontSize: 11, color: "var(--muted2)" }}>{t.flavor}</div>
      </div>
    ))}
  </div>

  {/* ── RIVALS ── */}
  <div className="card">
    <div className="card-title">Scene Rivals</div>
    {state.rivals.map((r: any) => {
      const def = RIVALS.find((x: any) => x.id === r.id);
      return (
        <div className="card-sm" key={r.id} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{def?.name ?? r.id}</div>
          <div style={{ fontSize: 11, color: "var(--muted2)" }}>
            Fame {r.fame.toFixed(0)} • Fans {r.fans} • Rel {r.relationship > 0 ? "+" : ""}
            {r.relationship}
          </div>
          {r.lastReleaseTitle && (
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Last drop: <i>{r.lastReleaseTitle}</i>
            </div>
          )}
        </div>
      );
    })}
  </div>

  {/* ── ACTIONS ── */}
  <div className="card">
    <div className="card-title">Actions</div>
    <button
      className="btn btn-block"
      disabled={(state.vacationCooldown ?? 0) > 0 || state.money < 3000}
      onClick={doTakeVacation}
    >
      Take Vacation ({fmtMoney(3000)}){" "}
      {(state.vacationCooldown ?? 0) > 0 ? `• ${state.vacationCooldown}wk cd` : ""}
    </button>
    <button className="btn btn-block" style={{ marginTop: 8 }} onClick={doSwitchGenre}>
      Switch Genre (-10rep, lose superfans)
    </button>
  </div>
</div>
```

);
}

// ═══════════════════════════════════════════════════════════════
// LABEL CONTRACT CARD -- Active or Offers
// ═══════════════════════════════════════════════════════════════

function LabelContractCard({
state,
onDrop,
onSign,
onView,
}: {
state: GameState;
onDrop: () => void;
onSign: (offer: LabelOffer) => void;
onView: (offer: LabelOffer) => void;
}) {
// ── ACTIVE CONTRACT ──
if (state.currentLabel) {
const lbl = state.currentLabel;
const recoup = recoupProgress(lbl);
const threeSixty = get360Summary(lbl);
const weeksUsed = lbl.totalWeeks - lbl.weeksLeft;
const termPct = weeksUsed / lbl.totalWeeks;

```
return (
  <div className="card label-contract-card">
    <div className="contract-header">
      <div className="contract-letterhead">
        <div className="contract-label-name">{lbl.name}</div>
        <div className="contract-exec">{lbl.exec} • {lbl.type} label</div>
      </div>
      <div
        className="contract-badge"
        style={{
          background: lbl.isRecouped ? "var(--sage)" : "var(--amber)",
          color: "#fff",
        }}
      >
        {lbl.isRecouped ? "✓ RECOUPED" : "RECOUPING"}
      </div>
    </div>

    {/* Recoupment Bar */}
    <div className="contract-section">
      <div className="contract-section-title">Advance Recoupment</div>
      <div className="recoup-bar-bg">
        <div
          className="recoup-bar-fill"
          style={{
            width: `${recoup.pct * 100}%`,
            background: lbl.isRecouped
              ? "linear-gradient(90deg, var(--sage), #5a9e5a)"
              : "linear-gradient(90deg, var(--amber), var(--rust))",
          }}
        />
      </div>
      <div className="recoup-numbers">
        <span>{recoup.formatted}</span>
        <span style={{ color: "var(--muted2)" }}>{recoup.status}</span>
      </div>
    </div>

    {/* 360 Cuts Grid */}
    <div className="contract-section">
      <div className="contract-section-title">
        360 Participation{" "}
        <span style={{ color: threeSixty.color, fontWeight: 700 }}>
          ({threeSixty.severity})
        </span>
      </div>
      <div className="cuts-grid">
        <CutPill label="Streaming" value={lbl.streamingCut} />
        <CutPill label="Tour Gross" value={lbl.tourGrossCut} />
        <CutPill label="Merch" value={lbl.merchCut} />
        <CutPill label="Sync" value={lbl.syncCut} />
        <CutPill label="Publishing" value={lbl.publishingCut} />
      </div>
    </div>

    {/* Financial Summary */}
    <div className="contract-section">
      <div className="contract-section-title">Contract Terms</div>
      <div className="terms-grid">
        <TermRow label="Royalty Rate" value={fmtPercent(lbl.royaltyRate)} good={lbl.royaltyRate >= 0.18} />
        <TermRow label="Recording Fund" value={fmtMoney(lbl.recordingFund)} sub={`used ${fmtMoney(lbl.recordingFundUsed)}`} />
        <TermRow label="Marketing Commitment" value={fmtMoney(lbl.marketingCommitment)} sub={`spent ${fmtMoney(lbl.marketingSpendYTD)}`} />
        <TermRow label="Marketing Boost" value={`${lbl.marketingBoost.toFixed(2)}x`} />
        <TermRow label="Albums" value={`${lbl.albumsDelivered}/${lbl.albumsCommitted} delivered`} />
        <TermRow label="Options" value={`${lbl.optionsRemaining} remaining`} />
      </div>
    </div>

    {/* Term Progress */}
    <div className="contract-section">
      <div className="contract-section-title">Term Remaining</div>
      <div className="term-bar-bg">
        <div
          className="term-bar-fill"
          style={{
            width: `${termPct * 100}%`,
            background: "var(--ink)",
          }}
        />
      </div>
      <div className="term-numbers">
        <span>
          {lbl.weeksLeft} weeks left ({fmtDuration(lbl.weeksLeft)})
        </span>
        <span style={{ color: "var(--muted2)" }}>
          signed week {lbl.signedAtWeek}
        </span>
      </div>
    </div>

    {/* Legal Clauses */}
    <div className="contract-section">
      <div className="contract-section-title">Legal Clauses</div>
      <div className="clauses-list">
        <ClauseBadge active={lbl.crossCollateralization} good={false} label="Cross-Collateralization" />
        <ClauseBadge active={lbl.suspensionRights} good={false} label="Suspension Rights" />
        <ClauseBadge active={lbl.keyPersonClause} good={true} label="Key-Person Clause" />
        <ClauseBadge active={lbl.controlledComposition < 1.0} good={false} label={`Controlled Comp (${fmtPercent(lbl.controlledComposition)})`} />
        <ClauseBadge active={true} good={lbl.creativeControl >= 60} label={`Creative Control ${lbl.creativeControl}%`} />
      </div>
    </div>

    <button className="btn btn-sm btn-danger" style={{ marginTop: 12 }} onClick={onDrop}>
      Terminate Contract (-8 rep, possible legal fees)
    </button>
  </div>
);
```

}

// ── UNSIGNED -- SHOW PENDING OFFERS ──
return (
<div className="card">
<div className="card-title">Record Label</div>
{state.pendingLabelOffers.length === 0 && (
<div style={{ fontSize: 12, color: "var(–muted2)" }}>
Unsigned. Offers appear as you grow. Keep releasing and touring to get on their radar.
</div>
)}

```
  {state.pendingLabelOffers.map((offer) => {
    const def = getLabel(offer.labelId);
    const risk = getRiskLabel(offer.riskLevel);
    const threeSixty = get360Summary(offer);

    return (
      <div
        key={offer.labelId}
        className="label-offer-card"
        onClick={() => onView(offer)}
      >
        <div className="offer-header">
          <div>
            <div className="offer-label-name">{def?.name}</div>
            <div className="offer-exec">{def?.exec} • {def?.type}</div>
          </div>
          <div className="offer-badges">
            <span className="badge-risk" style={{ background: risk.color }}>
              {risk.icon} {risk.text}
            </span>
            <span className="badge-score">Score {offer.dealScore}/100</span>
          </div>
        </div>

        <div className="offer-quick-stats">
          <QuickStat label="Advance" value={fmtMoney(offer.advance)} />
          <QuickStat label="Rec. Fund" value={fmtMoney(offer.recordingFund)} />
          <QuickStat label="Royalty" value={fmtPercent(offer.royaltyRate)} good={offer.royaltyRate >= 0.18} />
          <QuickStat label="360" value={threeSixty.severity} color={threeSixty.color} />
        </div>

        <div className="offer-fit">{offer.fitNote}</div>

        <div className="offer-actions">
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onSign(offer); }}>
            Sign Deal
          </button>
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onView(offer); }}>
            Review Contract →
          </button>
        </div>
      </div>
    );
  })}

  {state.pendingLabelOffers.length > 0 && (
    <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={doDismissLabelOffers}>
      Decline All Offers
    </button>
  )}
</div>
```

);
}

// ── SUB-COMPONENTS ─────────────────────────────────────────

function CutPill({ label, value }: { label: string; value: number }) {
const pct = Math.round(value * 100);
const color = pct === 0 ? "var(–sage)" : pct <= 8 ? "var(–ink)" : pct <= 15 ? "var(–amber)" : "var(–rust)";
return (
<div className="cut-pill">
<span className="cut-pill-label">{label}</span>
<span className="cut-pill-value" style={{ color }}>
{pct === 0 ? "FREE" : `${pct}%`}
</span>
</div>
);
}

function TermRow({
label,
value,
sub,
good,
}: {
label: string;
value: string;
sub?: string;
good?: boolean;
}) {
return (
<div className="term-row">
<span className="term-row-label">{label}</span>
<span className="term-row-value" style={{ color: good === true ? "var(–sage)" : good === false ? "var(–rust)" : undefined }}>
{value}
</span>
{sub && <span className="term-row-sub">{sub}</span>}
</div>
);
}

function ClauseBadge({ active, good, label }: { active: boolean; good: boolean; label: string }) {
if (!active) return null;
return (
<span
className="clause-badge"
style={{
background: good ? "rgba(90,157,90,0.15)" : "rgba(192,57,43,0.15)",
color: good ? "var(–sage)" : "var(–rust)",
border: `1px solid ${good ? "var(--sage)" : "var(--rust)"}`,
}}
>
{good ? "✓" : "⚠"} {label}
</span>
);
}

function QuickStat({
label,
value,
good,
color,
}: {
label: string;
value: string;
good?: boolean;
color?: string;
}) {
return (
<div className="quick-stat">
<div className="quick-stat-label">{label}</div>
<div
className="quick-stat-value"
style={{ color: color ?? (good === true ? "var(–sage)" : good === false ? "var(–rust)" : undefined) }}
>
{value}
</div>
</div>
);
}