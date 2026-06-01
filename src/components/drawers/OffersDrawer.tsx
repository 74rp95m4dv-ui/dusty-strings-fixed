import { fmtMoney } from "../../gameLogic";

export default function OffersDrawer({ state, doAcceptFeatureRequest, doDismissFeatureRequests, onClose }: any) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Pending Offers</div>
        <div className="stagger-1">
          {state.pendingFeatureRequests?.length > 0 && (
            <div className="card">
              <div className="card-title">Feature Requests</div>
              {state.pendingFeatureRequests.map((req: any) => (
                <div key={req.featureId} className="card-sm" style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{req.featureName}</div>
                  <div className="tip-text">"{req.trackTitle}" • {fmtMoney(req.fee)} • {req.weeksToRespond}wk to respond</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn btn-sm btn-lime" onClick={() => doAcceptFeatureRequest(req.featureId)}>Accept</button>
                    <button className="btn btn-sm" onClick={doDismissFeatureRequests}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(!state.pendingFeatureRequests || state.pendingFeatureRequests.length === 0) && (
            <div className="empty-state">No pending offers right now.</div>
          )}
        </div>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
}
