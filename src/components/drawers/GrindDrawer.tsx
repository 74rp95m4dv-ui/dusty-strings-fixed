import { GRIND_ACTIONS, fmtMoney } from "../../gameLogic";

export default function GrindDrawer({ state, doGrind, onClose }: any) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Hustle</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>Spend energy to build the career.</div>
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
