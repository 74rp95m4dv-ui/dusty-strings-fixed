import React from "react";
import {
  type LabelOffer,
  type GameState,
  getLabel,
  getRiskLabel,
  get360Summary,
  fmtMoney,
  fmtPercent,
  fmtDuration,
} from "../gameLogic";

interface LabelOfferModalProps {
  offer: LabelOffer;
  allOffers: LabelOffer[];
  state: GameState;
  onSign: (offer: LabelOffer) => void;
  onClose: () => void;
}

export default function LabelOfferModal({
  offer,
  allOffers,
  state,
  onSign,
  onClose,
}: LabelOfferModalProps) {
  const def = getLabel(offer.labelId);
  const risk = getRiskLabel(offer.riskLevel);
  const threeSixty = get360Summary(offer);
  const hasMultiple = allOffers.length > 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel label-offer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="deal-memo-stamp">DEAL MEMO</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Letterhead */}
        <div className="offer-letterhead">
          <div className="offer-letterhead-name">{def?.name}</div>
          <div className="offer-letterhead-meta">
            {def?.exec}, A&R • {def?.city} • {def?.type.toUpperCase()} LABEL
          </div>
          <div className="offer-letterhead-date">
            Re: {state.artistName || "Artist"} — {state.genre} • Week {state.week}
          </div>
        </div>

        {/* Pitch */}
        <div className="offer-pitch">"{def?.pitch}"</div>

        {/* Risk & Score Banner */}
        <div className="offer-banner" style={{ borderColor: risk.color }}>
          <div className="offer-banner-risk">
            <span style={{ color: risk.color, fontWeight: 800 }}>
              {risk.icon} {risk.text.toUpperCase()}
            </span>
          </div>
          <div className="offer-banner-score">
            Deal Score: <b>{offer.dealScore}</b>/100
          </div>
          <div className="offer-banner-fit">{offer.fitNote}</div>
        </div>

        {/* Lawyer Review Box */}
        <div className="lawyer-box">
          <div className="lawyer-header">📝 COUNSEL'S REVIEW</div>
          <div className="lawyer-note">{offer.lawyerNote}</div>
        </div>

        {/* THE OFFER */}
        <div className="offer-section">
          <div className="offer-section-title">THE OFFER</div>
          <div className="offer-grid">
            <OfferBlock
              label="All-In Advance"
              value={fmtMoney(offer.advance)}
              sub="Upfront cash. Recoupable."
              highlight
            />
            <OfferBlock
              label="Recording Fund"
              value={fmtMoney(offer.recordingFund)}
              sub="Per-album budget. Use it or lose it."
              highlight
            />
            <OfferBlock
              label="Royalty Rate"
              value={fmtPercent(offer.royaltyRate)}
              sub="Paid AFTER recoupment."
              good={offer.royaltyRate >= 0.18}
              bad={offer.royaltyRate <= 0.12}
            />
            <OfferBlock
              label="Marketing Commitment"
              value={fmtMoney(offer.marketingCommitment)}
              sub="Minimum spend per release."
            />
            <OfferBlock
              label="Marketing Boost"
              value={`${offer.marketingBoost.toFixed(2)}x`}
              sub="Release performance multiplier."
            />
          </div>
        </div>

        {/* YOUR CUTS (360) */}
        <div className="offer-section">
          <div className="offer-section-title">
            YOUR CUTS — 360 PARTICIPATION
            <span className="offer-severity" style={{ color: threeSixty.color }}>
              {threeSixty.severity.toUpperCase()}
            </span>
          </div>
          <div className="cuts-visual">
            <CutBar label="Streaming" cut={offer.streamingCut} keep={1 - offer.streamingCut} />
            <CutBar label="Tour Gross" cut={offer.tourGrossCut} keep={1 - offer.tourGrossCut} />
            <CutBar label="Merch" cut={offer.merchCut} keep={1 - offer.merchCut} />
            <CutBar label="Sync" cut={offer.syncCut} keep={1 - offer.syncCut} />
            <CutBar label="Publishing" cut={offer.publishingCut} keep={1 - offer.publishingCut} />
          </div>
          <div className="cuts-legend">
            <span className="legend-label">■ Label Share</span>
            <span className="legend-keep">■ Your Share</span>
          </div>
        </div>

        {/* TERM STRUCTURE */}
        <div className="offer-section">
          <div className="offer-section-title">TERM STRUCTURE</div>
          <div className="terms-grid">
            <TermBlock label="Albums Committed" value={`${offer.albumsCommitted}`} />
            <TermBlock label="Label Options" value={`${offer.options}`} />
            <TermBlock label="Option Period" value={fmtDuration(offer.optionWeeks)} />
            <TermBlock label="Max Term" value={fmtDuration(offer.termWeeks)} />
            <TermBlock label="Creative Control" value={`${offer.creativeControl}%`} good={offer.creativeControl >= 60} />
          </div>
        </div>

        {/* LEGAL CLAUSES */}
        <div className="offer-section">
          <div className="offer-section-title">LEGAL CLAUSES</div>
          <div className="clauses-grid">
            <ClauseBlock
              label="Cross-Collateralization"
              active={offer.crossCollateralization}
              good={!offer.crossCollateralization}
              desc={
                offer.crossCollateralization
                  ? "Every album pays for every other album. One flop can trap you forever."
                  : "Each album stands alone. Smart."
              }
            />
            <ClauseBlock
              label="Suspension Rights"
              active={offer.suspensionRights}
              good={!offer.suspensionRights}
              desc={
                offer.suspensionRights
                  ? "They can freeze your contract indefinitely if they don't like your progress."
                  : "They can't bench you without cause."
              }
            />
            <ClauseBlock
              label="Key-Person Clause"
              active={offer.keyPersonClause}
              good={true}
              desc={
                offer.keyPersonClause
                  ? `If ${def?.exec} leaves, you may have grounds to renegotiate or exit.`
                  : "No key-person protection."
              }
            />
            <ClauseBlock
              label="Controlled Composition"
              active={offer.controlledComposition < 1.0}
              good={offer.controlledComposition >= 1.0}
              desc={
                offer.controlledComposition < 1.0
                  ? `Mechanical rate capped at ${fmtPercent(offer.controlledComposition)}. Songwriters on your album get less.`
                  : "Full statutory mechanical rate. Songwriters get paid properly."
              }
            />
            <ClauseBlock
              label="Approval Rights"
              active={true}
              good={offer.approvalRights.length >= 3}
              desc={`You approve: ${offer.approvalRights.join(", ") || "nothing"}`}
            />
          </div>
        </div>

        {/* COMPARISON TABLE (if multiple offers) */}
        {hasMultiple && (
          <div className="offer-section">
            <div className="offer-section-title">SIDE-BY-SIDE COMPARISON</div>
            <ComparisonTable offers={allOffers} currentId={offer.labelId} />
          </div>
        )}

        {/* PERKS */}
        <div className="offer-section">
          <div className="offer-section-title">LABEL PERKS</div>
          <div className="perks-list">
            {def?.perks.map((p, i) => (
              <div key={i} className="perk-item">• {p}</div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="offer-actions-footer">
          <button className="btn btn-lg btn-primary" onClick={() => onSign(offer)}>
            ✍️ Sign This Contract
          </button>
          <button className="btn btn-lg btn-ghost" onClick={onClose}>
            Keep Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ─────────────────────────────────────────

function OfferBlock({
  label,
  value,
  sub,
  highlight,
  good,
  bad,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <div className={`offer-block ${highlight ? "offer-block-highlight" : ""}`}>
      <div className="offer-block-label">{label}</div>
      <div
        className="offer-block-value"
        style={{
          color: good ? "var(--sage)" : bad ? "var(--rust)" : highlight ? "var(--ink)" : undefined,
          fontWeight: highlight ? 800 : 700,
        }}
      >
        {value}
      </div>
      {sub && <div className="offer-block-sub">{sub}</div>}
    </div>
  );
}

function CutBar({ label, cut, keep }: { label: string; cut: number; keep: number }) {
  const cutPct = Math.round(cut * 100);
  const keepPct = Math.round(keep * 100);
  return (
    <div className="cut-bar-row">
      <div className="cut-bar-label">{label}</div>
      <div className="cut-bar-track">
        {cutPct > 0 && (
          <div
            className="cut-bar-label-share"
            style={{ width: `${cutPct}%` }}
            title={`Label takes ${cutPct}%`}
          />
        )}
        <div
          className="cut-bar-artist-share"
          style={{ width: `${keepPct}%` }}
          title={`You keep ${keepPct}%`}
        />
      </div>
      <div className="cut-bar-numbers">
        <span style={{ color: "var(--rust)" }}>{cutPct > 0 ? `${cutPct}% lbl` : "FREE"}</span>
        <span style={{ color: "var(--sage)" }}>{keepPct > 0 ? `${keepPct}% you` : ""}</span>
      </div>
    </div>
  );
}

function TermBlock({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="term-block">
      <div className="term-block-label">{label}</div>
      <div className="term-block-value" style={{ color: good ? "var(--sage)" : undefined }}>
        {value}
      </div>
    </div>
  );
}

function ClauseBlock({
  label,
  active,
  good,
  desc,
}: {
  label: string;
  active: boolean;
  good: boolean;
  desc: string;
}) {
  return (
    <div className={`clause-block ${active ? (good ? "clause-good" : "clause-bad") : "clause-neutral"}`}>
      <div className="clause-block-header">
        <span className="clause-block-icon">{active ? (good ? "✓" : "⚠") : "—"}</span>
        <span className="clause-block-label">{label}</span>
      </div>
      <div className="clause-block-desc">{desc}</div>
    </div>
  );
}

function ComparisonTable({ offers, currentId }: { offers: LabelOffer[]; currentId: string }) {
  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Term</th>
            {offers.map((o) => {
              const d = getLabel(o.labelId);
              return (
                <th key={o.labelId} className={o.labelId === currentId ? "col-active" : ""}>
                  {d?.name}
                  <div className="col-sub">Score {o.dealScore}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <CompRow label="Advance" offers={offers} fmt={(o) => fmtMoney(o.advance)} higherIsBetter />
          <CompRow label="Rec. Fund" offers={offers} fmt={(o) => fmtMoney(o.recordingFund)} higherIsBetter />
          <CompRow label="Royalty" offers={offers} fmt={(o) => fmtPercent(o.royaltyRate)} higherIsBetter goodThreshold={0.18} />
          <CompRow label="Streaming Cut" offers={offers} fmt={(o) => fmtPercent(o.streamingCut)} higherIsBetter={false} />
          <CompRow label="Tour Cut" offers={offers} fmt={(o) => fmtPercent(o.tourGrossCut)} higherIsBetter={false} />
          <CompRow label="Merch Cut" offers={offers} fmt={(o) => fmtPercent(o.merchCut)} higherIsBetter={false} />
          <CompRow label="Sync Cut" offers={offers} fmt={(o) => fmtPercent(o.syncCut)} higherIsBetter={false} />
          <CompRow label="Publishing" offers={offers} fmt={(o) => fmtPercent(o.publishingCut)} higherIsBetter={false} />
          <CompRow label="Marketing" offers={offers} fmt={(o) => fmtMoney(o.marketingCommitment)} higherIsBetter />
          <CompRow label="Boost" offers={offers} fmt={(o) => `${o.marketingBoost.toFixed(2)}x`} higherIsBetter />
          <CompRow label="Creative Ctrl" offers={offers} fmt={(o) => `${o.creativeControl}%`} higherIsBetter goodThreshold={60} />
          <CompRow label="Term" offers={offers} fmt={(o) => fmtDuration(o.termWeeks)} higherIsBetter={false} />
        </tbody>
      </table>
    </div>
  );
}

function CompRow({
  label,
  offers,
  fmt,
  higherIsBetter: _higherIsBetter,
  goodThreshold: _goodThreshold,
}: {
  label: string;
  offers: LabelOffer[];
  fmt: (o: LabelOffer) => string;
  higherIsBetter?: boolean;
  goodThreshold?: number;
}) {
  const values = offers.map(fmt);

  return (
    <tr>
      <td className="row-label">{label}</td>
      {offers.map((o, i) => (
        <td key={o.labelId}>
          {values[i]}
        </td>
      ))}
    </tr>
  );
}
