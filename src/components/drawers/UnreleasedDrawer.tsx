import { fmtMoney } from "../../gameLogic";

export default function UnreleasedDrawer({ state, doReleaseProject, doDeleteUnreleased, onClose }: any) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Unreleased Vault</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>Projects ready to drop.</div>
        <div className="stagger-1">
          {state.unreleased.length === 0 && <div className="empty-state">Nothing in the vault.</div>}
          {state.unreleased.map((p: any) => (
            <div className="rel-card" key={p.id}>
              <div className="rel-hd">
                <div>
                  <div className="rel-title">{p.title}</div>
                  <div className="rel-meta">{p.type} • Q{p.avgQuality.toFixed(0)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm btn-lime" onClick={() => doReleaseProject(p.id)}>Release</button>
                <button className="btn btn-sm btn-danger" onClick={() => doDeleteUnreleased(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
}
