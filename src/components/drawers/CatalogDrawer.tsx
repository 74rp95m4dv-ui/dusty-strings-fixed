import { fmtMoney, fmt } from "../../gameLogic";

export default function CatalogDrawer({ state, doPromoteTrack, doShootMusicVideo, onClose }: any) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Promote & Video</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>Select a track to promote or shoot a music video.</div>
        <div className="stagger-1">
          {state.catalog.length === 0 && <div className="empty-state">No releases in catalog yet.</div>}
          {state.catalog.map((c: any) => (
            <div className="card" key={c.id} style={{ marginBottom: 10 }}>
              <div className="rel-hd">
                <div>
                  <div className="rel-title">{c.title}</div>
                  <div className="rel-meta">{c.type} • {fmt(c.weeklyStreams)} weekly</div>
                </div>
                <span className={`tag ${c.lifecycle === "Evergreen" ? "t-gold" : c.lifecycle === "Hit" ? "t-lime" : "t-gray"}`}>
                  {c.lifecycle}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm" disabled={state.money < 350 || c.promoted} onClick={() => doPromoteTrack(c.id)}>
                  Promote ($350)
                </button>
                <button className="btn btn-sm" disabled={state.money < 1200 || c.hasMusicVideo} onClick={() => doShootMusicVideo(c.id)}>
                  Video ($1.2k)
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
}
