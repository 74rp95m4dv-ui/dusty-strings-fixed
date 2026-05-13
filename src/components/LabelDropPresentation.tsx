import React from "react";
import {
  type SignedLabel,
  type GameState,
  fmtMoney,
  recoupProgress,
} from "../gameLogic";

interface LabelDropPresentationProps {
  label: SignedLabel;
  settlementCost: number;
  repLoss: number;
  wasDropped: boolean;  // true = label dropped YOU
  state: GameState;
  onDismiss: () => void;
}

export default function LabelDropPresentation({
  label,
  settlementCost,
  repLoss,
  wasDropped,
  state,
  onDismiss,
}: LabelDropPresentationProps) {
  const recoup = recoupProgress(label);

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-panel drop-panel" onClick={(e) => e.stopPropagation()}>
        {wasDropped ? (
          <>
            <div className="drop-header dropped">
              <div className="drop-emoji">📄🚫</div>
              <div className="drop-title">They Dropped You</div>
              <div className="drop-label">{label.name}</div>
            </div>
            <div className="drop-body">
              <p>
                Week {state.week}. The call came from {label.exec}'s assistant.
                "The label has decided to move in a different direction."
              </p>
              <p>
                Your contract is terminated effective immediately.
                {label.isRecouped
                  ? " You were fully recouped — they owed you nothing."
                  : ` You were ${recoup.formatted} recouped. They'll write off the remainder.`}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="drop-header walked">
              <div className="drop-emoji">✌️</div>
              <div className="drop-title">You Walked</div>
              <div className="drop-label">{label.name}</div>
            </div>
            <div className="drop-body">
              <p>
                Week {state.week}. You called {label.exec} and told them it's over.
              </p>
              {settlementCost > 0 ? (
                <p>
                  They demanded <b>{fmtMoney(settlementCost)}</b> to settle the unrecouped
                  balance. You paid it. The contract is void.
                </p>
              ) : (
                <p>
                  No settlement. Clean break. The contract is void.
                </p>
              )}
              {repLoss < -10 && (
                <p className="drop-burn">
                  Word travels fast in this town. Your rep took a hit.
                </p>
              )}
            </div>
          </>
        )}

        <div className="drop-stats">
          {settlementCost > 0 && (
            <div className="drop-stat">
              <span className="drop-stat-label">Settlement</span>
              <span className="drop-stat-value" style={{ color: "var(--rust)" }}>
                {fmtMoney(settlementCost)}
              </span>
            </div>
          )}
          <div className="drop-stat">
            <span className="drop-stat-label">Rep Impact</span>
            <span className="drop-stat-value" style={{ color: repLoss < -8 ? "var(--rust)" : "var(--amber)" }}>
              {repLoss > 0 ? "+" : ""}{repLoss}
            </span>
          </div>
          <div className="drop-stat">
            <span className="drop-stat-label">Status</span>
            <span className="drop-stat-value">Unsigned</span>
          </div>
        </div>

        <button className="btn btn-lg btn-primary" onClick={onDismiss}>
          {wasDropped ? "Rebuild" : "Move On"}
        </button>
      </div>
    </div>
  );
}
