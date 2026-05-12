import { BRAND_DEALS, AWARDS, CAREER_TIERS, getCareerTierIdx, fmtMoney, RIVALS } from "../gameLogic";

export default function CareerTab(game: any) {
  const { state, doSignBrandDeal, doDropLabel, doDropManager, doTakeVacation, doSwitchGenre, doDismissLabelOffers, doDismissManagerOffers } = game;

  return (
    <div>
      <div className="pg-hd"><div className="pg-title">Deals & Career</div></div>

      <div className="card">
        <div className="card-title">Record Label</div>
        {state.currentLabel ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{state.currentLabel.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{state.currentLabel.exec} • {state.currentLabel.weeksLeft}wk left</div>
            <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={doDropLabel}>Drop Label (-5 rep)</button>
          </div>
        ) : <div style={{ fontSize: 12, color: "var(--muted2)" }}>Unsigned. Offers appear as you grow.</div>}
      </div>

      <div className="card">
        <div className="card-title">Management</div>
        {state.currentManager ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{state.currentManager.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{fmtMoney(state.currentManager.weeklyFee)}/wk • +{Math.round(state.currentManager.showRevPct * 100)}% shows</div>
            <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={doDropManager}>Part Ways</button>
          </div>
        ) : <div style={{ fontSize: 12, color: "var(--muted2)" }}>No manager. Offers appear as you grow.</div>}
      </div>

      <div className="card">
        <div className="card-title">Brand Deals</div>
        {BRAND_DEALS.filter((b: any) => state.fame >= b.fameReq && state.rep >= b.repReq && !state.activeBrandDeals.find((d: any) => d.id === b.id)).map((b: any) => (
          <div className="pick-card" key={b.id} onClick={() => doSignBrandDeal(b.id)}>
            <div><div className="pick-name">{b.name}</div><div className="pick-meta">{fmtMoney(b.weeklyIncome)}/wk • {b.duration}wk • {b.desc}</div></div>
          </div>
        ))}
        {BRAND_DEALS.filter((b: any) => state.fame >= b.fameReq && state.rep >= b.repReq && !state.activeBrandDeals.find((d: any) => d.id === b.id)).length === 0 && <div style={{ fontSize: 12, color: "var(--muted2)" }}>No deals available right now.</div>}
      </div>

      <div className="card">
        <div className="card-title">Awards</div>
        {state.awardsWon.length === 0 && <div style={{ fontSize: 12, color: "var(--muted2)" }}>None yet.</div>}
        {state.awardsWon.map((id: string) => {
          const a = AWARDS.find((x: any) => x.id === id)!;
          return <div className="award-card" key={id}><div className="award-icon">🏆</div><div className="award-info"><div className="award-name">{a.name}</div><div className="award-desc">{a.desc}</div></div></div>;
        })}
      </div>

      <div className="card">
        <div className="card-title">Career Tier</div>
        {CAREER_TIERS.map((t: any) => (
          <div key={t.idx} style={{ opacity: state.fame >= t.fameReq ? 1 : 0.35, marginBottom: 6, fontSize: 12 }}>
            <b>{t.icon} {t.name}</b> {state.fame >= t.fameReq ? "✓" : `(need ${t.fameReq} fame)`}
            <div style={{ fontSize: 11, color: "var(--muted2)" }}>{t.flavor}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Scene Rivals</div>
        {state.rivals.map((r: any) => {
          const def = RIVALS.find((x: any) => x.id === r.id);
          return (
            <div className="card-sm" key={r.id} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{def?.name ?? r.id}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)" }}>Fame {r.fame.toFixed(0)} • Fans {r.fans} • Rel {r.relationship > 0 ? "+" : ""}{r.relationship}</div>
              {r.lastReleaseTitle && <div style={{ fontSize: 11, marginTop: 2 }}>Last drop: <i>{r.lastReleaseTitle}</i></div>}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-title">Actions</div>
        <button className="btn btn-block" disabled={(state.vacationCooldown ?? 0) > 0 || state.money < 3000} onClick={doTakeVacation}>
          Take Vacation ({fmtMoney(3000)}) {(state.vacationCooldown ?? 0) > 0 ? `• ${state.vacationCooldown}wk cd` : ""}
        </button>
        <button className="btn btn-block" style={{ marginTop: 8 }} onClick={() => doSwitchGenre(state.genre === "Country" ? "Blues" : "Country")}>
          Switch Genre (-10 rep, lose superfans)
        </button>
      </div>
    </div>
  );
}
