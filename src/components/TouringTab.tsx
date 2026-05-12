import { CITIES, VENUES, fmtMoney } from "../gameLogic";

export default function TouringTab(game: any) {
  const { state, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour } = game;
  const inQueue = new Set(state.tourQueue.map((q: any) => q.cityName));

  return (
    <div>
      <div className="pg-hd"><div className="pg-title">Touring</div></div>
      {state.tourActive ? (
        <div className="card" style={{ borderColor: "var(--amber)" }}>
          <div className="card-title">On The Road</div>
          <div style={{ fontSize: 13 }}>Show {state.tourActive.progress + 1} of {state.tourActive.shows.length}</div>
          <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>Next: {state.tourActive.shows[state.tourActive.progress]?.cityName ?? "Finishing up..."}</div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-title">Venue Tier</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {VENUES.map((v: any) => <button key={v.tier} className={`btn btn-sm ${state.tourVenue === v.tier ? "btn-lime" : ""}`} onClick={() => doSetVenueTier(v.tier)}>{v.tier}: {v.name}</button>)}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Ticket Price</div>
            <input type="range" min={0.5} max={2.5} step={0.1} value={state.tourTicketMult} onChange={(e) => doSetTicketMult(parseFloat(e.target.value))} />
            <div style={{ textAlign: "center", fontSize: 12, marginTop: 4 }}>×{state.tourTicketMult.toFixed(1)}</div>
          </div>
          <div className="card">
            <div className="card-title">Cities ({state.tourQueue.length} selected)</div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {CITIES.map((c: any) => {
                const v = c.venues.find((v: any) => v.tier === state.tourVenue) ?? c.venues[c.venues.length - 1];
                const isIn = inQueue.has(c.name);
                return (
                  <div key={c.name} className={`city-row ${isIn ? "booked" : ""}`} onClick={() => doToggleTourCity(c.name)}>
                    <div><div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: "var(--muted2)" }}>{v.name} • {v.cap} cap • {fmtMoney(v.cost + c.travelCost)}</div></div>
                    <div style={{ fontSize: 18 }}>{isIn ? "✓" : "+"}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="btn btn-lime btn-block" disabled={state.tourQueue.length === 0} onClick={doStartTour}>
            Launch Tour ({fmtMoney(state.tourQueue.reduce((s: number, q: any) => s + q.travelCost + q.venueCost, 0))})
          </button>
        </>
      )}
      <div className="sec-div">Tour History</div>
      {state.tourHistory.length === 0 && <div className="empty-state">No shows yet.</div>}
      {state.tourHistory.slice(0, 10).map((h: any, i: number) => (
        <div className="ev-item" key={i}><div className="ev-wk">W{h.week}</div><div><b>{h.cityName}</b> @ {h.venueName} — {h.attendancePct}% full • {fmtMoney(h.net)} net</div></div>
      ))}
    </div>
  );
}
