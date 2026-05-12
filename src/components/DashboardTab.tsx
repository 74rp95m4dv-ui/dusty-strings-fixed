import { fmt, fmtMoney, getCareerTierIdx, CAREER_TIERS, getBurnoutTier } from "../gameLogic";

export default function DashboardTab(game: any) {
  const s = game.state;
  const tier = CAREER_TIERS[getCareerTierIdx(s.fame)];
  const burn = getBurnoutTier(s.burnout ?? 0);

  return (
    <div>
      <div className="pg-hd">
        <div className="pg-title">{tier.name}</div>
        <div className="pg-sub">{tier.tagline}</div>
      </div>
      <div className="gstat">
        <div className="card bigstat"><div className="bigstat-num" style={{ color: "var(--amber)" }}>{fmtMoney(s.money)}</div><div className="bigstat-lbl">Cash</div></div>
        <div className="card bigstat"><div className="bigstat-num" style={{ color: "var(--sage)" }}>{fmt(s.fans)}</div><div className="bigstat-lbl">Fans</div></div>
        <div className="card bigstat"><div className="bigstat-num" style={{ color: "var(--gold)" }}>{fmt(s.superfans ?? 0)}</div><div className="bigstat-lbl">Superfans</div></div>
        <div className="card bigstat"><div className="bigstat-num" style={{ color: "var(--denim)" }}>{s.totalReleases}</div><div className="bigstat-lbl">Releases</div></div>
      </div>
      <div className="card">
        <div className="card-title">Vitals</div>
        <StatBar name="Fame" val={s.fame} max={100} color="f-lime" />
        <StatBar name="Rep" val={s.rep} max={100} color="f-green" />
        <StatBar name="Energy" val={s.energy} max={100} color="f-blue" />
        <StatBar name="Hype" val={s.hype} max={100} color="f-purple" />
        <StatBar name="Burnout" val={s.burnout ?? 0} max={100} color="f-orange" />
        <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6, fontStyle: "italic" }}>{burn.desc}</div>
      </div>
      {s.tourActive && (
        <div className="card" style={{ borderColor: "var(--amber)" }}>
          <div className="card-title">On Tour</div>
          <div style={{ fontSize: 13 }}>Show {s.tourActive.progress + 1} of {s.tourActive.shows.length} • {s.tourActive.shows[s.tourActive.progress]?.cityName ?? "Wrapping up"}</div>
          <button className="btn btn-danger btn-sm btn-block" style={{ marginTop: 10 }} onClick={game.doAbortTour}>Abort Tour</button>
        </div>
      )}
      {s.project && (
        <div className="card">
          <div className="card-title">In the Studio</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.project.title}</div>
          <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{s.project.type} • {s.project.tracks.length} track{s.project.tracks.length === 1 ? "" : "s"} • {s.project.weeksLeft}wk left</div>
        </div>
      )}
      <div className="card">
        <div className="card-title">Active Deals</div>
        {s.activeBrandDeals.length === 0 && <div style={{ fontSize: 12, color: "var(--muted2)" }}>No brand deals.</div>}
        {s.activeBrandDeals.map((d: any) => (
          <div key={d.id} style={{ fontSize: 12, marginBottom: 4 }}><span className="tag t-lime">{d.name}</span> {d.weeksLeft}wk left • {fmtMoney(d.weeklyIncome)}/wk</div>
        ))}
        {s.currentLabel && <div style={{ fontSize: 12, marginTop: 6 }}><span className="tag t-gold">Label</span> {s.currentLabel.name} • {s.currentLabel.weeksLeft}wk left</div>}
        {s.currentManager && <div style={{ fontSize: 12, marginTop: 6 }}><span className="tag t-blue">Manager</span> {s.currentManager.name}</div>}
      </div>
      <button className="btn btn-lime btn-block" onClick={game.advance} style={{ marginTop: 10 }}>End Week</button>
      <div className="sec-div">Recent Log</div>
      <div>
        {s.log.slice(0, 8).map((entry: any, i: number) => (
          <div className="ev-item" key={i}>
            <div className="ev-wk">W{entry.week}</div>
            <div style={{ color: entry.type === "bad" ? "var(--danger)" : entry.type === "great" ? "var(--success)" : "var(--text)" }}>{entry.msg}</div>
          </div>
        ))}
        {s.log.length === 0 && <div className="empty-state">No events yet.</div>}
      </div>
    </div>
  );
}

function StatBar({ name, val, max, color }: { name: string; val: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (val / max) * 100));
  return (
    <div className="sbar">
      <div className="sbar-row"><span className="sbar-name">{name}</span><span className="sbar-val">{val.toFixed(0)}</span></div>
      <div className="sbar-track"><div className={`sbar-fill ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
