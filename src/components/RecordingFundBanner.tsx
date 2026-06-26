import React from "react";
import {
  type GameState,
  type SignedLabel,
  fmtMoney,
} from "../gameLogic";
import { getRecordingFundStatus } from "../recording-fund";

interface RecordingFundBannerProps {
  state: GameState;
  compact?: boolean;
}

export default function RecordingFundBanner({ state, compact }: RecordingFundBannerProps) {
  const status = getRecordingFundStatus(state);

  if (!status.hasLabel) {
    if (compact) {
      return (
        <div className="fund-banner-compact unsigned">
          <span className="fund-icon">💵</span>
          <span className="fund-text">{fmtMoney(state.money)}</span>
        </div>
      );
    }
    return (
      <div className="fund-banner unsigned">
        <div className="fund-banner-title">Recording Budget</div>
        <div className="fund-banner-body">
          <span className="fund-source">Your money</span>
          <span className="fund-amount">{fmtMoney(state.money)}</span>
        </div>
        <div className="fund-banner-note">Unsigned — everything comes out of your pocket.</div>
      </div>
    );
  }

  const lbl = state.currentLabel!;
  const pct = status.fundPctUsed;

  if (compact) {
    return (
      <div className="fund-banner-compact signed">
        <span className="fund-icon">🏷️</span>
        <span className="fund-text" style={{ color: status.color }}>
          {fmtMoney(status.fundRemaining)} label
        </span>
        <span className="fund-divider">•</span>
        <span className="fund-text">{fmtMoney(state.money)} you</span>
      </div>
    );
  }

  return (
    <div className="fund-banner signed">
      <div className="fund-banner-header">
        <div className="fund-banner-title">{lbl.name} — Recording Fund</div>
        <div className="fund-badge" style={{ background: status.color }}>
          {pct >= 1 ? "DEPLETED" : pct > 0.9 ? "LOW" : "ACTIVE"}
        </div>
      </div>

      {/* Label Fund Bar */}
      <div className="fund-bar-row">
        <span className="fund-bar-label">Label Fund</span>
        <div className="fund-bar-track">
          <div
            className="fund-bar-fill"
            style={{
              width: `${pct * 100}%`,
              background:
                pct > 0.9
                  ? "linear-gradient(90deg, var(--rust), #e74c3c)"
                  : pct > 0.6
                  ? "linear-gradient(90deg, var(--amber), #f39c12)"
                  : "linear-gradient(90deg, var(--sage), #5a9e5a)",
            }}
          />
        </div>
        <span className="fund-bar-numbers">
          {fmtMoney(status.fundUsed)} / {fmtMoney(status.fundTotal)}
        </span>
      </div>

      {/* Artist Pocket */}
      <div className="fund-pocket-row">
        <span className="fund-pocket-label">Your money</span>
        <span className="fund-pocket-amount">{fmtMoney(state.money)}</span>
      </div>

      {status.fundRemaining <= 0 && (
        <div className="fund-warning">
          ⚠️ Recording fund depleted. All future recording costs come from your pocket.
        </div>
      )}
    </div>
  );
}
