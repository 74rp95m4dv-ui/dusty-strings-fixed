import { GRIND_ACTIONS, fmtMoney } from "../../gameLogic";

export default function GrindDrawer({ state, doGrind, doStreetCircuit, doSetStreetLodging, onClose }: any) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Hustle</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>Spend energy to build the career.</div>
        {state.streetHustle && !state.streetHustle.graduated && <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title">🎸 Street Hustle</div>
          <div className="tip-text">Street Credibility: {state.streetHustle.credibility}/4 · one legal set per week.</div>
          <div className="grind-tags" style={{ marginTop: 8 }}>
            {[["couch", "Couch/crash pad", "$0 · -8 energy"], ["room", "Weekly room", "$75 · -2 energy"], ["motel", "Cheap motel", "$160 · rested"]].map(([id, label, detail]) => <button key={id} className={`btn btn-sm ${state.streetHustle.lodging === id ? "btn-lime" : ""}`} onClick={() => doSetStreetLodging(id)}>{label}<br /><small>{detail}</small></button>)}
          </div>
          {[['tunnel', 'Park Tunnel', '$55 · +18 listeners · -10 energy'], ['platform', 'Subway Platform', '$80 · +25 listeners · -18 energy'], ['patio', 'Late-night Patio', '$115 · +30 listeners · -25 energy · burnout risk']].map(([id, name, detail]) => <button key={id} className="btn btn-sm btn-block" disabled={state.streetHustle.lastCircuitWeek === state.week || !!state.streetHustle.pendingPerformance} onClick={() => doStreetCircuit(id)} style={{ marginTop: 8 }}>{name} — {detail}</button>)}
          {state.streetHustle.credibility >= 3 && !state.streetHustle.diyReleased && <div className="tip-text" style={{ marginTop: 8 }}>DIY Single unlocked in Studio: $150, one track, 2 weeks, -8 quality.</div>}
          {state.streetHustle.diyReleased && state.streetHustle.credibility >= 4 && !state.streetHustle.microRouteUsed && <div className="tip-text" style={{ marginTop: 8 }}>Micro Route unlocked: launch any route of up to 3 stops; street contacts cover the crew advance.</div>}
        </div>}
        <div className="stagger-1">
          {GRIND_ACTIONS.map((a: any) => {
            const cd = state.cooldowns[a.id] ?? 0;
            const locked = state.energy < a.e || cd > 0 || (a.mc && state.money < a.mc);
            return (
              <div className={`grind-item ${locked ? "locked-item" : ""}`} key={a.id}>
                <div className="grind-top">
                  <div className="grind-name">{a.name}</div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <span className="tag t-orange">-{a.e} NRG</span>
                    {a.mc ? <span className="tag t-red">{fmtMoney(a.mc)}</span> : null}
                    {cd > 0 ? <span className="tag t-gray">{cd}wk</span> : null}
                  </div>
                </div>
                <div className="grind-desc">{a.desc}</div>
                <div className="grind-tags">
                  {Object.entries(a.eff).slice(0, 4).map(([k, v]: any) => (
                    <span className="tag t-lime" key={k}>{k} {typeof v === "number" && v > 0 ? "+" : ""}{v}</span>
                  ))}
                </div>
                <button className="btn btn-sm btn-block" disabled={locked} onClick={() => doGrind(a.id)} style={{ marginTop: 8 }}>
                  {cd > 0 ? `Cooldown ${cd}wk` : "Do It"}
                </button>
              </div>
            );
          })}
        </div>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
}
