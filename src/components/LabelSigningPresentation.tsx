import React from "react";
import {
  type SignedLabel,
  type GameState,
  fmtMoney,
  fmtPercent,
  fmtDuration,
  get360Summary,
  getRiskLabel,
} from "../gameLogic";

interface LabelSigningPresentationProps {
  label: SignedLabel;
  state: GameState;
  onDismiss: () => void;
}

export default function LabelSigningPresentation({
  label,
  state,
  onDismiss,
}: LabelSigningPresentationProps) {
  const threeSixty = get360Summary(label);
  const risk = getRiskLabel(threeSixty.severity === "light" ? "low" : threeSixty.severity === "moderate" ? "moderate" : "high");

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-panel signing-panel" onClick={(e) => e.stopPropagation()}>
        {/* Contract header */}
        <div className="signing-header">
          <div className="signing-stamp">EXECUTED</div>
          <div className="signing-label">{label.name}</div>
          <div className="signing-sub">Recording Agreement</div>
        </div>

        {/* The moment */}
        <div className="signing-moment">
          <div className="signing-emoji">✍️</div>
          <div className="signing-title">You Signed</div>
          <div className="signing-desc">
            Week {state.week} — {label.exec} slid the contract across the table.
            You read every page. Then you signed.
          </div>
        </div>

        {/* Money shot */}
        <div className="signing-money-block">
          <div className="signing-money-label">Advance Deposited</div>
          <div className="signing-money-amount">{fmtMoney(label.advance)}</div>
          <div className="signing-money-note">
            Hit your account immediately. Recoupable. Spend it wisely.
          </div>
        </div>

        {/* Quick terms */}
        <div className="signing-terms">
          <div className="signing-term">
            <span className="signing-term-label">Recording Fund</span>
            <span className="signing-term-value">{fmtMoney(label.recordingFund)}</span>
          </div>
          <div className="signing-term">
            <span className="signing-term-label">Royalty Rate</span>
            <span className="signing-term-value" style={{ color: label.royaltyRate >= 0.18 ? "var(--sage)" : "var(--rust)" }}>
              {fmtPercent(label.royaltyRate)}
            </span>
          </div>
          <div className="signing-term">
            <span className="signing-term-label">Term</span>
            <span className="signing-term-value">{fmtDuration(label.totalWeeks)}</span>
          </div>
          <div className="signing-term">
            <span className="signing-term-label">360 Participation</span>
            <span className="signing-term-value" style={{ color: threeSixty.color }}>
              {threeSixty.severity}
            </span>
          </div>
        </div>

        {/* Warning box for bad deals */}
        {threeSixty.severity === "crushing" || threeSixty.severity === "heavy" ? (
          <div className="signing-warning">
            <div className="signing-warning-title">⚠️ Your lawyer was nervous</div>
            <div className="signing-warning-body">
              This is a {label.type} label with aggressive 360 terms. You'll feel it
              on every stream, every tour, every t-shirt. But the advance is real
              and the machine is powerful. Just know what you signed.
            </div>
          </div>
        ) : label.royaltyRate >= 0.20 ? (
          <div className="signing-good">
            <div className="signing-good-title">✓ Artist-friendly deal</div>
            <div className="signing-good-body">
              Strong royalty rate, moderate 360 cuts, and real creative control.
              This is the kind of deal people wait years for.
            </div>
          </div>
        ) : null}

        {/* Perks */}
        <div className="signing-perks">
          {label.perks.map((p, i) => (
            <div key={i} className="signing-perk">• {p}</div>
          ))}
        </div>

        <button className="btn btn-lg btn-primary" style={{ marginTop: 16 }} onClick={onDismiss}>
          Begin the Term
        </button>
      </div>
    </div>
  );
}
