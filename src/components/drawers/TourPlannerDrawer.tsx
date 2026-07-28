import { useState } from "react";
import { CITIES, VENUES, fmtMoney } from "../../gameLogic";

export default function TourPlannerDrawer({ state, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour, onClose, onSwitchTab }: any) {
  const [confirmLaunch, setConfirmLaunch] = useState(false);
  const inQueue = new Set(state.tourQueue.map((q: any) => q.cityName));
  const upfront = state.tourQueue.reduce((s: number, q: any) => s + q.travelCost + q.venueCost, 0);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">Quick Tour Planner</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>Pick cities and launch. Full planner is in the Live tab.</div>

        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card-title">Venue Tier</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {VENUES.map((v: any) => (
              <button key={v.tier} className={`btn btn-sm ${state.tourVenue === v.tier ? "btn-lime" : ""}`} onClick={() => doSetVenueTier(v.tier)}>
                {v.tier}: {v.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card-title">Ticket Price</div>
          <input aria-label="Ticket price multiplier" type="range" min={0.5} max={2.5} step={0.1} value={state.tourTicketMult} onChange={(e) => doSetTicketMult(parseFloat(e.target.value))} />
          <div style={{ textAlign: "center", fontSize: 12, marginTop: 4 }}>×{state.tourTicketMult.toFixed(1)}</div>
        </div>

        <div className="card" style={{ marginBottom: 10, maxHeight: 300, overflowY: "auto" }}>
          <div className="card-title">Cities ({state.tourQueue.length} selected)</div>
          {CITIES.map((c: any) => {
            const v = c.venues.find((v: any) => v.tier === state.tourVenue) ?? c.venues[c.venues.length - 1];
            const isIn = inQueue.has(c.name);
            return (
              <button key={c.name} type="button" className={`city-row ${isIn ? "booked" : ""}`} onClick={() => doToggleTourCity(c.name)} aria-pressed={isIn}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                  <div className="tip-text">{v.name} • {v.cap} cap • {fmtMoney(v.cost + c.travelCost)}</div>
                </div>
                <div style={{ fontSize: 18 }}>{isIn ? "✓" : "+"}</div>
              </button>
            );
          })}
        </div>

        <div className="tip-text" style={{ marginBottom: 8 }}>Launch cost: {fmtMoney(upfront)} now. Each selected city resolves one show per week and increases fatigue.</div>
        <button className="btn btn-lime btn-block" disabled={state.tourQueue.length === 0} onClick={() => setConfirmLaunch(true)}>
          Launch Tour ({fmtMoney(upfront)})
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => { onSwitchTab("live"); onClose(); }} style={{ marginTop: 8 }}>
          Open Full Planner →
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8 }}>Close</button>
        {confirmLaunch && <div className="modal-overlay"><section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="tour-confirm-title"><div className="modal-title" id="tour-confirm-title">Launch this tour?</div><p className="tip-text">Pay {fmtMoney(upfront)} up front for {state.tourQueue.length} booked stop{state.tourQueue.length === 1 ? "" : "s"}. The route will start when you end the week.</p><div className="modal-footer"><button className="btn btn-lime" onClick={() => { doStartTour(); onClose(); }}>Launch tour</button><button className="btn btn-ghost" onClick={() => setConfirmLaunch(false)}>Review route</button></div></section></div>}
      </div>
    </div>
  );
}
