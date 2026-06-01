import { fmtMoney } from "../gameLogic";

/* These are stub modal components that preserve the original structure.
   Fill them in with your existing modal logic from the original codebase. */

export function ReleaseModal({ state, doCloseReleasePresentation }: any) {
  const pres = state.releasePresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseReleasePresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🎉 Release Results</div>
        <div className="signing-emoji">{pres.emoji || "🎵"}</div>
        <div className="signing-title">{pres.title}</div>
        <div className="signing-desc">{pres.desc}</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseReleasePresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function TourWrapModal({ state, doCloseTourWrapPresentation }: any) {
  const pres = state.tourWrapPresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseTourWrapPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🚐 Tour Wrap</div>
        <div className="signing-emoji">{pres.emoji || "🎤"}</div>
        <div className="signing-title">{pres.title}</div>
        <div className="signing-desc">{pres.desc}</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseTourWrapPresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function SigningModal({ state, doCloseSigningPresentation }: any) {
  const pres = state.signingPresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseSigningPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">📝 Signing</div>
        <div className="signing-emoji">{pres.emoji || "✍️"}</div>
        <div className="signing-title">{pres.title}</div>
        <div className="signing-desc">{pres.desc}</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseSigningPresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function AwardModal({ state, doCloseAwardPresentation }: any) {
  const pres = state.awardPresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseAwardPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🏆 Award</div>
        <div className="signing-emoji">{pres.emoji || "🏆"}</div>
        <div className="signing-title">{pres.title}</div>
        <div className="signing-desc">{pres.desc}</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseAwardPresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function MilestoneModal({ state, doCloseMilestonePresentation }: any) {
  const pres = state.milestonePresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseMilestonePresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">⭐ Milestone</div>
        <div className="signing-emoji">{pres.emoji || "⭐"}</div>
        <div className="signing-title">{pres.title}</div>
        <div className="signing-desc">{pres.desc}</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseMilestonePresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function ScenarioModal({ state, doResolveScenario }: any) {
  const id = state.pendingScenarioId;
  if (!id) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Scenario</div>
        <div className="tip-text">A scenario requires your attention.</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={() => doResolveScenario(0)}>Option A</button>
          <button className="btn btn-ghost btn-block" onClick={() => doResolveScenario(1)}>Option B</button>
        </div>
      </div>
    </div>
  );
}

export function NewspaperModal({ state, dismissNewspaper }: any) {
  if (!state.pendingNewspaperJson) return null;
  const news = JSON.parse(state.pendingNewspaperJson);
  return (
    <div className="modal-overlay" onClick={dismissNewspaper}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">📰 Nashville Times</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          {news.headline && <div style={{ fontWeight: 700, marginBottom: 8 }}>{news.headline}</div>}
          {news.body && <div>{news.body}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={dismissNewspaper}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function ArcModal({ state, doResolveArcChoice }: any) {
  if (!state.pendingArcChoice) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Arc Choice</div>
        <div className="tip-text">A story arc choice awaits.</div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={() => doResolveArcChoice(0)}>Choose</button>
        </div>
      </div>
    </div>
  );
}

export function FeatureModal({ state, doAcceptFeatureRequest, doDismissFeatureRequests }: any) {
  if (!state.pendingFeatureRequests?.length) return null;
  const req = state.pendingFeatureRequests[0];
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Feature Request</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <b>{req.featureName}</b> wants to feature on <b>"{req.trackTitle}"</b>
          <div className="tip-text" style={{ marginTop: 8 }}>Fee: {fmtMoney(req.fee)}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={() => doAcceptFeatureRequest(req.featureId)}>Accept</button>
          <button className="btn btn-ghost" onClick={doDismissFeatureRequests}>Decline</button>
        </div>
      </div>
    </div>
  );
}

export function ManagerOfferModal({ state, doAcceptManagerOffer, doDismissManagerOffers }: any) {
  if (!state.pendingManagerOffers?.length) return null;
  const offer = state.pendingManagerOffers[0];
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Manager Offer</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <b>{offer.managerName || offer.name}</b> wants to manage you.
          <div className="tip-text" style={{ marginTop: 8 }}>{fmtMoney(offer.weeklyFee)}/wk</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={() => doAcceptManagerOffer(offer.managerId || offer.id)}>Sign</button>
          <button className="btn btn-ghost" onClick={doDismissManagerOffers}>Decline</button>
        </div>
      </div>
    </div>
  );
}

export function PressingModal({ state, doDismissPressing }: any) {
  if (!state.pendingPressing) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Pressing</div>
        <div className="tip-text">A pressing opportunity awaits.</div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={doDismissPressing}>Got It</button>
        </div>
      </div>
    </div>
  );
}
