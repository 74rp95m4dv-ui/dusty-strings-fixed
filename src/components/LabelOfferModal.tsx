import { fmtMoney, fmtPercent, getLabel, getRiskLabel, get360Summary } from "../gameLogic";
import type { LabelOffer } from "../gameLogic";

export default function LabelOfferModal({ offer, allOffers, state, onSign, onClose }: {
  offer: LabelOffer; allOffers: LabelOffer[]; state: any; onSign: (o: LabelOffer) => void; onClose: () => void;
}) {
  const def = getLabel(offer.labelId);
  const risk = getRiskLabel(offer.riskLevel);
  const threeSixty = get360Summary(offer);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="deal-memo-stamp">DEAL MEMO</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="offer-letterhead">
          <div className="offer-letterhead-name">{def?.name}</div>
          <div className="offer-letterhead-meta">{def?.exec} • {def?.type} label</div>
          <div className="offer-letterhead-date">Week {state.week} • CONFIDENTIAL</div>
        </div>
        <div className="offer-pitch">{offer.fitNote}</div>
        <div className="offer-banner" style={{ borderColor: risk.color }}>
          <div className="offer-banner-risk" style={{ color: risk.color }}>
            {risk.icon} {risk.text} Risk
          </div>
          <div className="offer-banner-score">Deal Score: {offer.dealScore}/100</div>
        </div>
        <div className="offer-section">
          <div className="offer-section-title">Financial Terms</div>
          <div className="offer-grid">
            <div className="offer-block offer-block-highlight">
              <div className="offer-block-label">Advance</div>
              <div className="offer-block-value">{fmtMoney(offer.advance)}</div>
            </div>
            <div className="offer-block">
              <div className="offer-block-label">Recording Fund</div>
              <div className="offer-block-value">{fmtMoney(offer.recordingFund)}</div>
            </div>
            <div className="offer-block">
              <div className="offer-block-label">Royalty Rate</div>
              <div className="offer-block-value" style={{ color: offer.royaltyRate >= 0.18 ? "var(--sage)" : undefined }}>
                {fmtPercent(offer.royaltyRate)}
              </div>
            </div>
            <div className="offer-block">
              <div className="offer-block-label">Marketing</div>
              <div className="offer-block-value">{fmtMoney(offer.marketingCommitment)}</div>
            </div>
          </div>
        </div>
        <div className="offer-section">
          <div className="offer-section-title">360 Participation</div>
          <div className="cuts-visual">
            {Object.entries({
              Streaming: offer.streamingCut,
              "Tour Gross": offer.tourGrossCut,
              Merch: offer.merchCut,
              Sync: offer.syncCut,
              Publishing: offer.publishingCut,
            }).map(([label, value]) => {
              const pct = Math.round(value * 100);
              return (
                <div className="cut-bar-row" key={label}>
                  <div className="cut-bar-label">{label}</div>
                  <div className="cut-bar-track">
                    <div className="cut-bar-label-share" style={{ width: `${pct}%` }} />
                    <div className="cut-bar-artist-share" style={{ width: `${100 - pct}%` }} />
                  </div>
                  <div className="cut-bar-numbers">
                    <span style={{ color: "var(--rust)" }}>Label {pct}%</span>
                    <span style={{ color: "var(--sage)" }}>You {100 - pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="offer-actions-footer">
          <button className="btn btn-lg btn-lime" onClick={() => onSign(offer)}>Sign Deal</button>
          <button className="btn btn-lg btn-ghost" onClick={onClose}>Review Later</button>
        </div>
      </div>
    </div>
  );
}
