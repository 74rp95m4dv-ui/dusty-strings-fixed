import { useState } from "react";
import {
  fmtMoney, fmtPercent, fmtDuration,
  getRiskLabel,
  BRAND_DEALS,
  type SyncOffer,
  type PublishingOffer,
} from "../gameLogic";

export default function BusinessTab(game: any) {
  const { state, doAcceptLabelOffer, doDismissLabelOffers, doDropLabel,
    doAcceptManagerOffer, doDismissManagerOffers, doDropManager,
    doAcceptPublishingOffer, doDismissPublishingOffers,
    doAcceptSyncOffer, doDismissSyncOffers,
    doSignBrandDeal } = game;

  const [sub, setSub] = useState<"deals" | "sync" | "brands" | "recoup">("deals");

  return (
    <div>
      <div className="pg-hd">
        <div className="pg-title">Business</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          {state.currentLabel ? `Signed to ${state.currentLabel.name}` : "Independent"} • 
          {state.currentManager ? ` ${state.currentManager.name}` : " No manager"} • 
          Sellout: {Math.round(state.selloutScore || 0)}%
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 12 }}>
        <button className={`btn ${sub === "deals" ? "btn-lime" : ""}`} onClick={() => setSub("deals")}>Deals</button>
        <button className={`btn ${sub === "sync" ? "btn-lime" : ""}`} onClick={() => setSub("sync")}>Sync</button>
        <button className={`btn ${sub === "brands" ? "btn-lime" : ""}`} onClick={() => setSub("brands")}>Brands</button>
        <button className={`btn ${sub === "recoup" ? "btn-lime" : ""}`} onClick={() => setSub("recoup")}>Recoupment</button>
      </div>

      {sub === "deals" && <DealsSection {...game} />}
      {sub === "sync" && <SyncSection {...game} />}
      {sub === "brands" && <BrandsSection {...game} />}
      {sub === "recoup" && <RecoupmentSection {...game} />}
    </div>
  );
}

function DealsSection(game: any) {
  const { state, doAcceptLabelOffer, doDismissLabelOffers, doDropLabel,
    doAcceptManagerOffer, doDismissManagerOffers, doDropManager,
    doAcceptPublishingOffer, doDismissPublishingOffers } = game;

  return (
    <div>
      {/* Label */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Record Label</div>
        {state.currentLabel ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{state.currentLabel.name}</div>
            <div className="pick-bio" style={{ marginTop: 4 }}>{state.currentLabel.exec}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              {fmtDuration(state.currentLabel.weeksLeft)} remaining • {state.currentLabel.albumsDelivered}/{state.currentLabel.albumsCommitted} albums
            </div>
            <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={doDropLabel}>
              Drop Label (-5 rep)
            </button>
          </div>
        ) : state.pendingLabelOffers.length > 0 ? (
          <div>
            {state.pendingLabelOffers.map((o: any) => (
              <div className="pick-card" key={o.labelId} style={{ marginBottom: 8 }}>
                <div className="pick-name">{o.labelId}</div>
                <div className="pick-bio">{o.fitNote}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  Advance: {fmtMoney(o.advance)} • Royalty: {fmtPercent(o.royaltyRate)} • Term: {fmtDuration(o.termWeeks)}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="btn btn-sm btn-lime" onClick={() => doAcceptLabelOffer(o.labelId)}>Sign</button>
                </div>
              </div>
            ))}
            <button className="btn btn-sm btn-ghost" onClick={doDismissLabelOffers}>Dismiss All</button>
          </div>
        ) : (
          <div className="empty-state">No label offers. Build your buzz.</div>
        )}
      </div>

      {/* Manager */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Manager</div>
        {state.currentManager ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{state.currentManager.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {fmtMoney(state.currentManager.weeklyFee)}/wk • +{Math.round(state.currentManager.showRevPct * 100)}% show net
            </div>
            <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={doDropManager}>
              Part Ways
            </button>
          </div>
        ) : state.pendingManagerOffers.length > 0 ? (
          <div>
            {state.pendingManagerOffers.map((o: any) => (
              <div className="pick-card" key={o.managerId} style={{ marginBottom: 8 }}>
                <div className="pick-name">{o.managerId}</div>
                <div className="pick-bio">{o.fitNote}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="btn btn-sm btn-lime" onClick={() => doAcceptManagerOffer(o.managerId)}>Sign</button>
                </div>
              </div>
            ))}
            <button className="btn btn-sm btn-ghost" onClick={doDismissManagerOffers}>Dismiss All</button>
          </div>
        ) : (
          <div className="empty-state">No manager offers yet.</div>
        )}
      </div>

      {/* Publishing */}
      <div className="card">
        <div className="card-title">Publishing</div>
        {state.currentPublishing ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{state.currentPublishing.publisherName}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {state.currentPublishing.type === "admin" ? "Admin Deal" : state.currentPublishing.type === "co_pub" ? "Co-Publishing" : "Full Assignment"} • 
              Artist split: {fmtPercent(state.currentPublishing.artistSplit)} • 
              {fmtDuration(state.currentPublishing.weeksLeft)} left
            </div>
            {state.currentPublishing.advance > 0 && (
              <div style={{ fontSize: 11, marginTop: 4 }}>
                Recoup: {fmtMoney(state.currentPublishing.advanceRecouped)} / {fmtMoney(state.currentPublishing.advance)}
              </div>
            )}
          </div>
        ) : state.pendingPublishingOffers?.length > 0 ? (
          <div>
            {state.pendingPublishingOffers.map((o: PublishingOffer) => (
              <div className="pick-card" key={o.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="pick-name">{o.publisherName}</div>
                  <span className="tag" style={{ color: getRiskLabel(o.riskLevel).color }}>{getRiskLabel(o.riskLevel).text}</span>
                </div>
                <div className="pick-bio" style={{ marginTop: 4 }}>{o.fitNote}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  Type: <b>{o.type === "admin" ? "Admin" : o.type === "co_pub" ? "Co-Pub" : "Full Assignment"}</b> • 
                  Advance: {fmtMoney(o.advance)} • Split: {fmtPercent(o.artistSplit)}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontStyle: "italic" }}>
                  "{o.lawyerNote}"
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="btn btn-sm btn-lime" onClick={() => doAcceptPublishingOffer(o.id)}>Sign</button>
                </div>
              </div>
            ))}
            <button className="btn btn-sm btn-ghost" onClick={doDismissPublishingOffers}>Dismiss All</button>
          </div>
        ) : (
          <div className="empty-state">No publishing offers. Need more catalog heat.</div>
        )}
      </div>
    </div>
  );
}

function SyncSection(game: any) {
  const { state, doAcceptSyncOffer, doDismissSyncOffers } = game;
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Sync Licensing</div>
        <div className="tip-text" style={{ marginBottom: 10 }}>
          TV shows, films, and commercials want your songs. Prestige placements build cred. Embarrassing ones hurt it.
        </div>
        {state.pendingSyncOffers?.length === 0 && (
          <div className="empty-state">No sync offers this week. Keep releasing.</div>
        )}
        {state.pendingSyncOffers?.map((o: SyncOffer) => (
          <div className="pick-card" key={o.id} style={{ marginBottom: 10, borderLeft: o.showType === "prestige" ? "3px solid var(--sage)" : o.showType === "embarrassing" ? "3px solid var(--rust)" : "3px solid var(--amber)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="pick-name">{o.showName}</div>
              <span className="tag" style={{ 
                color: o.showType === "prestige" ? "var(--sage)" : o.showType === "embarrassing" ? "var(--rust)" : "var(--amber)" 
              }}>
                {o.showType}
              </span>
            </div>
            <div className="pick-bio" style={{ marginTop: 4 }}>
              Wants <b>"{o.songTitle}"</b> for their next season.
            </div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Payout: <b style={{ color: "var(--sage)" }}>{fmtMoney(o.payout)}</b> • 
              Fame: {o.fameBonus > 0 ? "+" : ""}{o.fameBonus} • 
              Rep: {o.repBonus > 0 ? "+" : ""}{o.repBonus}
              {o.selloutHit > 0 && <span style={{ color: "var(--rust)", marginLeft: 8 }}>Sellout +{o.selloutHit}</span>}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
              {o.weeksToRespond} week{o.weeksToRespond === 1 ? "" : "s"} to respond
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button className="btn btn-sm btn-lime" onClick={() => doAcceptSyncOffer(o.id)}>Accept</button>
              <button className="btn btn-sm btn-ghost" onClick={() => doDismissSyncOffers()}>Pass</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandsSection(game: any) {
  const { state, doSignBrandDeal } = game;
  const active = state.activeBrandDeals || [];
  const available = BRAND_DEALS.filter((b: any) => !active.find((a: any) => a.id === b.id) && state.fame >= b.fameReq && state.rep >= b.repReq);

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Sellout Meter</div>
        <div style={{ width: "100%", height: 8, background: "var(--bg2)", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
          <div style={{ 
            width: `${state.selloutScore || 0}%`, 
            height: "100%", 
            background: (state.selloutScore || 0) > 60 ? "var(--rust)" : (state.selloutScore || 0) > 30 ? "var(--amber)" : "var(--sage)",
            borderRadius: 4 
          }}></div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          {(state.selloutScore || 0) > 60 ? "Fans are calling you a sellout. Rep decaying." : 
           (state.selloutScore || 0) > 30 ? "Some side-eye from the purists." : 
           "Cred intact. The hardcore fans still trust you."}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Active Deals</div>
        {active.length === 0 && <div className="empty-state">No active brand deals.</div>}
        {active.map((d: any) => (
          <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--bg2)", fontSize: 12 }}>
            <span>{d.name}</span>
            <span style={{ color: "var(--sage)" }}>{fmtMoney(d.weeklyIncome)}/wk · {d.weeksLeft}wk left</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Available Deals</div>
        {available.length === 0 && <div className="empty-state">No deals available. Grow your fame.</div>}
        {available.map((b: any) => (
          <div className="pick-card" key={b.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="pick-name">{b.name}</div>
              {b.selloutHit > 0 && <span className="tag t-rust">-{b.selloutHit} cred</span>}
            </div>
            <div className="pick-bio" style={{ marginTop: 4 }}>{b.desc}</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              {fmtMoney(b.weeklyIncome)}/wk • {b.duration} weeks
              {b.rep ? ` • ${b.rep > 0 ? "+" : ""}${b.rep} rep` : ""}
              {b.famePerk ? ` • +${b.famePerk} fame` : ""}
            </div>
            <button className="btn btn-sm btn-lime" style={{ marginTop: 8 }} onClick={() => doSignBrandDeal(b.id)}>
              Sign Deal
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoupmentSection(game: any) {
  const { state } = game;
  const label = state.currentLabel;
  const publishing = state.currentPublishing;

  return (
    <div>
      {label && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title">Label Recoupment</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label.name}</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Advance</span>
              <span>{fmtMoney(label.advance)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Recouped</span>
              <span style={{ color: "var(--sage)" }}>{fmtMoney(label.advanceRecouped)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Remaining</span>
              <span style={{ color: label.isRecouped ? "var(--sage)" : "var(--rust)" }}>{fmtMoney(Math.max(0, label.advance - label.advanceRecouped))}</span>
            </div>
            <div style={{ width: "100%", height: 8, background: "var(--bg2)", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
              <div style={{ 
                width: `${Math.min(100, (label.advanceRecouped / Math.max(1, label.advance)) * 100)}%`, 
                height: "100%", 
                background: label.isRecouped ? "var(--sage)" : "var(--amber)",
                borderRadius: 4 
              }}></div>
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
              {label.isRecouped ? "✓ Fully recouped — royalties now paying" : "You don't see royalties until the advance earns back."}
            </div>
            <div style={{ fontSize: 11, marginTop: 8, color: "var(--muted)" }}>
              Streaming cut: {fmtPercent(label.streamingCut)} • Tour cut: {fmtPercent(label.tourGrossCut)} • 
              Merch cut: {fmtPercent(label.merchCut)} • Sync cut: {fmtPercent(label.syncCut)}
            </div>
          </div>
        </div>
      )}

      {publishing && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title">Publishing Recoupment</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{publishing.publisherName}</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Advance</span>
              <span>{fmtMoney(publishing.advance)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Recouped</span>
              <span style={{ color: "var(--sage)" }}>{fmtMoney(publishing.advanceRecouped)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Remaining</span>
              <span style={{ color: publishing.isRecouped ? "var(--sage)" : "var(--rust)" }}>{fmtMoney(Math.max(0, publishing.advance - publishing.advanceRecouped))}</span>
            </div>
            <div style={{ width: "100%", height: 8, background: "var(--bg2)", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
              <div style={{ 
                width: `${Math.min(100, (publishing.advanceRecouped / Math.max(1, publishing.advance)) * 100)}%`, 
                height: "100%", 
                background: publishing.isRecouped ? "var(--sage)" : "var(--amber)",
                borderRadius: 4 
              }}></div>
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
              {publishing.isRecouped ? "✓ Publishing recouped" : "Publishing revenue paying back advance."}
            </div>
            <div style={{ fontSize: 11, marginTop: 8, color: "var(--muted)" }}>
              Artist split: {fmtPercent(publishing.artistSplit)} • Type: {publishing.type}
            </div>
          </div>
        </div>
      )}

      {!label && !publishing && (
        <div className="empty-state">No active contracts. Sign a deal to see recoupment tracking.</div>
      )}
    </div>
  );
}
