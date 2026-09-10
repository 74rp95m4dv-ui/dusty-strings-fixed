import { useState } from "react";
import {
  BRAND_DEALS, AWARDS, CAREER_TIERS, fmtMoney, RIVALS, fmtPercent, fmt,
  recoupProgress, get360Summary, getRiskLabel, getLabel, getManager, getLabelDeliverySummary,
  MANAGERS, CAREER_IDENTITIES, type LabelOffer,
} from "../gameLogic";
import ActionCard from "./ui/ActionCard";
import { forecastRecurringEconomy } from "../weeklyEconomy";

export default function OfficeTab({ onViewLabelOffer, ...game }: any) {
  const {
    state, doSignBrandDeal, doDropLabel, doDropManager, doSwitchGenre,
    doDismissLabelOffers, doDismissManagerOffers, doAcceptLabelOffer,
    doAcceptManagerOffer, doAcceptPublishingOffer,
    doDismissPublishingOffers, doAcceptSyncOffer, doDismissSyncOffers,
    doToggleMerchItem, doRemoveMerchItem, doAddMerchItem,
  } = game;

  const [sub, setSub] = useState<"deals" | "merch" | "awards" | "rivals" | "finances">("deals");
  const recurringForecast = forecastRecurringEconomy(state);

  const totalIncome =
    (state.catalog.reduce((s: number, t: any) => s + (t.streamStats?.weeklyRevenue || 0), 0)) +
    (state.activeBrandDeals.reduce((s: number, d: any) => s + d.weeklyIncome, 0)) +
    (state.merchShop?.reduce((s: number, m: any) => {
      const recent = m.weeklySales.slice(-1)[0] || 0;
      return s + recent * (m.price - m.cost);
    }, 0) || 0);

  return (
    <div className="animate-fadeIn">
      <div className="pg-hd">
        <div className="pg-title">Office</div>
        <div className="tip-text">Business operations & career identity</div>
      </div>

      <div className="subtabs">
        {(["deals", "merch", "awards", "rivals", "finances"] as const).map((t) => (
          <button key={t} className={`subtab-btn ${sub === t ? "active" : ""}`} onClick={() => setSub(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* DEALS */}
      {sub === "deals" && (
        <div className="stagger-1">
          <div className="card"><div className="card-title">Public Identity</div>{state.currentCareerIdentity ? <><div style={{ fontWeight: 700 }}>{CAREER_IDENTITIES[state.currentCareerIdentity as keyof typeof CAREER_IDENTITIES].title}</div><div className="tip-text">{CAREER_IDENTITIES[state.currentCareerIdentity as keyof typeof CAREER_IDENTITIES].perk}</div></> : <div className="tip-text">Still emerging. Consistent creative, commercial, touring, independent, or crossover choices will earn a public identity.</div>}</div>
          {/* Label Contract */}
          <LabelContractCard state={state} onDrop={doDropLabel} onSign={doAcceptLabelOffer} onView={onViewLabelOffer} onDismiss={doDismissLabelOffers} />

          {/* Management */}
          <div className="card">
            <div className="card-title">Management</div>
            {state.currentManager ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{state.currentManager.name}</div>
                <div className="tip-text" style={{ marginTop: 2 }}>
                  {fmtMoney(state.currentManager.weeklyFee)}/wk • +{Math.round(state.currentManager.showRevPct * 100)}% shows
                </div>
                <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={doDropManager}>
                  Part Ways
                </button>
              </div>
            ) : state.pendingManagerOffers?.length > 0 ? (
              <div>
                {state.pendingManagerOffers.map((offer: any) => {
                  const M = getManager(offer.managerId);
                  return (
                    <div className="pick-card" key={offer.managerId}>
                      <div>
                        <div className="pick-name">{M?.name}</div>
                        <div className="pick-meta">{fmtMoney(offer.weeklyFee)}/wk • +{Math.round(offer.showRevPct * 100)}% show bonus</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button className="btn btn-sm btn-lime" onClick={() => doAcceptManagerOffer(offer.managerId)}>Sign</button>
                        <button className="btn btn-sm btn-ghost" onClick={doDismissManagerOffers}>Decline</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tip-text">No manager. Offers appear as you grow.</div>
            )}
          </div>

          {/* Brand Deals */}
          <div className="card">
            <div className="card-title">Brand Deals</div>
            {BRAND_DEALS.filter(
              (b: any) =>
                state.fame >= b.fameReq &&
                state.rep >= b.repReq &&
                !state.activeBrandDeals.find((d: any) => d.id === b.id)
            ).map((b: any) => (
              <ActionCard key={b.id} onClick={() => doSignBrandDeal(b.id)} aria-label={`Sign ${b.name} brand deal`}>
                <div>
                  <div className="pick-name">{b.name}</div>
                  <div className="pick-meta">{fmtMoney(b.weeklyIncome)}/wk • {b.duration}wk • {b.desc}</div>
                </div>
              </ActionCard>
            ))}
            {BRAND_DEALS.filter(
              (b: any) =>
                state.fame >= b.fameReq &&
                state.rep >= b.repReq &&
                !state.activeBrandDeals.find((d: any) => d.id === b.id)
            ).length === 0 && (
              <div className="tip-text">No deals available right now.</div>
            )}
          </div>

          {/* Publishing */}
          {state.pendingPublishingOffers?.length > 0 && (
            <div className="card">
              <div className="card-title">Publishing Offers</div>
              {state.pendingPublishingOffers.map((offer: any) => (
                <div className="pick-card" key={offer.id}>
                  <div>
                    <div className="pick-name">{offer.publisherName}</div>
                    <div className="pick-meta">{offer.type} • {fmtMoney(offer.advance)} advance</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn btn-sm btn-lime" onClick={() => doAcceptPublishingOffer(offer.id)}>Sign</button>
                    <button className="btn btn-sm btn-ghost" onClick={doDismissPublishingOffers}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sync */}
          {state.pendingSyncOffers?.length > 0 && (
            <div className="card">
              <div className="card-title">Sync Licensing</div>
              {state.pendingSyncOffers.map((offer: any) => (
                <div className="pick-card" key={offer.id}>
                  <div>
                    <div className="pick-name">{offer.showName}</div>
                    <div className="pick-meta">"{offer.songTitle}" • {fmtMoney(offer.payout)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn btn-sm btn-lime" onClick={() => doAcceptSyncOffer(offer.id)}>Accept</button>
                    <button className="btn btn-sm btn-ghost" onClick={doDismissSyncOffers}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <div className="card-title">Actions</div>
            <button className="btn btn-block" onClick={() => doSwitchGenre(state.genre === "Country" ? "Blues" : "Country")}>
              Switch Genre (-10rep, lose superfans)
            </button>
          </div>
        </div>
      )}

      {/* MERCH */}
      {sub === "merch" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Merch Shop</div>
            <button className="btn btn-lime btn-block" onClick={() => game.onOpenDrawer?.("merch")} style={{ marginBottom: 12 }}>
              Add Merch Item
            </button>
            {(!state.merchShop || state.merchShop.length === 0) && (
              <div className="empty-state">No merch listed yet.</div>
            )}
            {state.merchShop?.map((item: any) => {
              const tmpl = (game.MERCH_TEMPLATES || []).find((t: any) => t.type === item.type);
              const recentSales = item.weeklySales.slice(-4);
              const avgRecent = recentSales.length ? recentSales.reduce((a: number, b: number) => a + b, 0) / recentSales.length : 0;
              return (
                <div className="card" key={item.id} style={{ marginBottom: 10, opacity: item.active ? 1 : 0.5 }}>
                  <div className="rel-hd">
                    <div>
                      <div className="rel-title">{item.emoji} {item.name}</div>
                      <div className="rel-meta">{fmtMoney(item.price)} • Sold {item.totalSold} • {fmtMoney(item.totalRevenue)} revenue</div>
                    </div>
                    <span className={`tag ${item.active ? "t-lime" : "t-gray"}`}>{item.active ? "Active" : "Paused"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn btn-sm" onClick={() => doToggleMerchItem(item.id)}>
                      {item.active ? "Pause" : "Resume"}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => doRemoveMerchItem(item.id)}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AWARDS */}
      {sub === "awards" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Awards</div>
            {state.awardsWon.length === 0 && <div className="tip-text">None yet. Keep grinding!</div>}
            {state.awardsWon.map((id: string) => {
              const a = AWARDS.find((x: any) => x.id === id)!;
              return (
                <div className="award-card" key={id}>
                  <div className="award-icon">🏆</div>
                  <div className="award-info">
                    <div className="award-name">{a.name}</div>
                    <div className="award-desc">{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-title">Career Tier</div>
            {CAREER_TIERS.map((t: any) => (
              <div key={t.idx} style={{ opacity: state.fame >= t.fameReq ? 1 : 0.35, marginBottom: 6, fontSize: 12 }}>
                <b>{t.icon} {t.name}</b>
                {state.fame >= t.fameReq ? " ✓" : ` (need ${t.fameReq} fame)`}
                <div className="tip-text">{t.flavor}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RIVALS */}
      {sub === "rivals" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Scene Rivals</div>
            {state.rivals.map((r: any) => {
              const def = RIVALS.find((x: any) => x.id === r.id);
              return (
                <div className="card-sm" key={r.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{def?.name ?? r.id}</div>
                  <div className="tip-text">
                    Fame {r.fame.toFixed(0)} • Fans {fmt(r.fans)} • Rel {r.relationship > 0 ? "+" : ""}{r.relationship}
                  </div>
                  {r.lastReleaseTitle && (
                    <div className="tip-text" style={{ marginTop: 2 }}>
                      Last drop: <i>{r.lastReleaseTitle}</i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FINANCES */}
      {sub === "finances" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Expected Recurring Week</div>
            <div className="finance-row">
              <span className="finance-label">Streaming</span>
              <span className="finance-value text-sage">
                {fmtMoney(recurringForecast.market)}
              </span>
            </div>
            <div className="finance-row">
              <span className="finance-label">Brand Deals</span>
              <span className="finance-value text-sage">
                {fmtMoney(recurringForecast.brands)}
              </span>
            </div>
            <div className="finance-row">
              <span className="finance-label">Studio (active project)</span>
              <span className="finance-value text-rust">
                {recurringForecast.studio ? `-${fmtMoney(recurringForecast.studio)}` : "—"}
              </span>
            </div>
            <hr />
            <div className="finance-row">
              <span className="finance-label">Recurring overhead</span>
              <span className="finance-value text-rust">{fmtMoney(recurringForecast.overhead)}</span>
            </div>
            <div className="finance-row">
              <span className="finance-label">Manager Fee</span>
              <span className="finance-value text-rust">
                {fmtMoney(recurringForecast.manager)}
              </span>
            </div>
            <hr />
            <div className="finance-row">
              <span className="finance-label">Expected recurring net</span>
              <span className={`finance-value ${recurringForecast.net >= 0 ? "text-sage" : "text-rust"}`} style={{ fontSize: 16 }}>
                {recurringForecast.net >= 0 ? "+" : ""}{fmtMoney(recurringForecast.net)}
              </span>
            </div>
            <div className="finance-row">
              <span className="finance-label">Total Earned</span>
              <span className="finance-value text-sage">{fmtMoney(state.totalEarned)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Label Contract Card ─── */
function LabelContractCard({ state, onDrop, onSign, onView, onDismiss }: {
  state: any; onDrop: () => void; onSign: (offer: LabelOffer) => void; onView?: (offer: LabelOffer) => void; onDismiss: () => void;
}) {
  const [confirmTermination, setConfirmTermination] = useState(false);
  if (state.currentLabel) {
    const lbl = state.currentLabel;
    const recoup = recoupProgress(lbl);
    const threeSixty = get360Summary(lbl);
    const weeksUsed = lbl.totalWeeks - lbl.weeksLeft;
    const termPct = weeksUsed / lbl.totalWeeks;
    const delivery = getLabelDeliverySummary(lbl, state.week);
    const deliveryColor = delivery.status === "breach" ? "var(--rust)" : delivery.status === "at_risk" ? "var(--amber)" : "var(--sage)";
    const fundRemaining = Math.max(0, lbl.recordingFund - lbl.recordingFundUsed);
    const campaignPerAlbum = Math.floor(lbl.marketingCommitment / Math.max(1, lbl.albumsCommitted));
    const campaignRemaining = Math.max(0, lbl.marketingCommitment - lbl.marketingSpendYTD);
    const trust = lbl.aRTrust ?? 55;
    const relationshipMood = lbl.relationshipMood ?? (trust >= 70 ? "supportive" : trust < 40 ? "strained" : "neutral");

    return (
      <div className="card label-contract-card">
        <div className="contract-header">
          <div className="contract-letterhead">
            <div className="contract-label-name">{lbl.name}</div>
            <div className="contract-exec">{lbl.exec} • {lbl.type} label</div>
          </div>
          <div className="contract-badge" style={{
            background: lbl.isRecouped ? "var(--sage)" : "var(--amber)", color: "#fff",
          }}>
            {lbl.isRecouped ? "✓ RECOUPED" : "RECOUPING"}
          </div>
        </div>

        <div className="contract-section">
          <div className="contract-section-title">A&amp;R Partnership</div>
          <div className="recoup-bar-bg"><div className="recoup-bar-fill" style={{ width: `${trust}%`, background: relationshipMood === "supportive" ? "var(--sage)" : relationshipMood === "strained" ? "var(--rust)" : "var(--amber)" }} /></div>
          <div className="recoup-numbers"><span>{lbl.exec} · {trust}/100 trust</span><span className="text-muted" style={{ textTransform: "capitalize" }}>{relationshipMood}</span></div>
          <div className="tip-text" style={{ marginTop: 7 }}>{relationshipMood === "supportive" ? "Premium label support is available on your next release." : relationshipMood === "strained" ? "The label is honoring the deal, but extra support is harder to win." : "Release-cycle choices will shape how hard the label goes to bat for you."}</div>
          {lbl.relationshipHistory?.[0] && <div className="tip-text" style={{ marginTop: 6 }}>Last A&amp;R decision: {lbl.relationshipHistory[0].outcome}</div>}
        </div>

        <div className="contract-section">
          <div className="contract-section-title">Advance Recoupment</div>
          <div className="recoup-bar-bg">
            <div className="recoup-bar-fill" style={{
              width: `${recoup.pct * 100}%`,
              background: lbl.isRecouped
                ? "linear-gradient(90deg, var(--sage), #5a9e5a)"
                : "linear-gradient(90deg, var(--amber), var(--rust))",
            }} />
          </div>
          <div className="recoup-numbers">
            <span>{recoup.formatted}</span>
            <span className="text-muted">{recoup.status}</span>
          </div>
        </div>

        <div className="contract-section">
          <div className="contract-section-title">Delivery Standing</div>
          <div className="terms-grid">
            <TermRow label="Albums due" value={`${lbl.albumsDelivered}/${lbl.albumsCommitted} delivered`} good={delivery.status === "good"} />
            <TermRow label="Next deadline" value={delivery.albumsRemaining ? `Week ${delivery.deadlineWeek}` : "Commitment met"} good={delivery.status === "good"} />
            <TermRow label="Time remaining" value={delivery.albumsRemaining ? `${Math.max(0, delivery.weeksRemaining)} weeks` : "—"} good={delivery.status === "good"} />
            <TermRow label="Standing" value={delivery.status === "breach" ? "BREACH — cure required" : delivery.status === "at_risk" ? "AT RISK" : "IN GOOD STANDING"} good={delivery.status === "good"} />
          </div>
          {lbl.fundingFrozen && <div className="tip-text" style={{ color: "var(--rust)", marginTop: 8 }}>Label recording fund is frozen until an album is delivered.</div>}
        </div>

        <div className="contract-section">
          <div className="contract-section-title">
            360 Participation <span style={{ color: threeSixty.color, fontWeight: 700 }}>({threeSixty.severity})</span>
          </div>
          <div className="cuts-grid">
            <CutPill label="Streaming" value={lbl.streamingCut} />
            <CutPill label="Tour Gross" value={lbl.tourGrossCut} />
            <CutPill label="Merch" value={lbl.merchCut} />
            <CutPill label="Sync" value={lbl.syncCut} />
            <CutPill label="Publishing" value={lbl.publishingCut} />
          </div>
        </div>

        <div className="contract-section">
          <div className="contract-section-title">Contract Terms</div>
          <div className="terms-grid">
            <TermRow label="Royalty Rate" value={fmtPercent(lbl.royaltyRate)} good={lbl.royaltyRate >= 0.18} />
            <TermRow label="Recording Fund" value={fmtMoney(fundRemaining)} sub={`${fmtMoney(lbl.recordingFundUsed)} drawn of ${fmtMoney(lbl.recordingFund)}`} />
            <TermRow label="Marketing" value={fmtMoney(lbl.marketingCommitment)} sub={`spent ${fmtMoney(lbl.marketingSpendYTD)}`} />
            <TermRow label="Campaign / release" value={fmtMoney(campaignPerAlbum)} sub={`${fmtMoney(campaignRemaining)} commitment remaining`} />
            <TermRow label="Approval strikes" value={`${lbl.approvalStrikes ?? 0} active`} good={(lbl.approvalStrikes ?? 0) === 0} />
            <TermRow label="Marketing Boost" value={`${lbl.marketingBoost.toFixed(2)}x`} />
            <TermRow label="Albums" value={`${lbl.albumsDelivered}/${lbl.albumsCommitted}`} />
            <TermRow label="Options" value={`${lbl.optionsRemaining} remaining`} />
          </div>
        </div>
        {lbl.campaignFrozen && <div className="tip-text" style={{ color: "var(--rust)", marginTop: 8 }}>Campaign support is frozen until the label accepts your next album delivery.</div>}

        <div className="contract-section">
          <div className="contract-section-title">Term Remaining</div>
          <div className="term-bar-bg">
            <div className="term-bar-fill" style={{ width: `${termPct * 100}%`, background: "var(--ink)" }} />
          </div>
          <div className="term-numbers">
            <span>{lbl.weeksLeft} weeks left</span>
            <span className="text-muted">signed week {lbl.signedAtWeek}</span>
          </div>
        </div>

        <button className="btn btn-sm btn-danger" style={{ marginTop: 12 }} onClick={() => setConfirmTermination(true)}>
          Terminate Contract (-5 rep)
        </button>
        {confirmTermination && <div className="modal-overlay"><section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="contract-confirm-title"><div className="modal-title" id="contract-confirm-title">Terminate contract?</div><p className="tip-text">You will lose 5 reputation and cannot receive new label pitches for 26 weeks. Unrecouped advances and undelivered albums remain part of this career story.</p><div className="modal-footer"><button className="btn btn-danger" onClick={() => { onDrop(); setConfirmTermination(false); }}>Terminate</button><button className="btn btn-ghost" onClick={() => setConfirmTermination(false)}>Keep contract</button></div></section></div>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">Record Label</div>
      {state.pendingLabelOffers.length === 0 && (
        <div className="tip-text">Unsigned. Offers appear as you grow. Keep releasing and touring.</div>
      )}
      {state.pendingLabelOffers.map((offer: LabelOffer) => {
        const def = getLabel(offer.labelId);
        const risk = getRiskLabel(offer.riskLevel);
        const threeSixty = get360Summary(offer);
        return (
          <div key={offer.labelId} className="label-offer-card" onClick={() => onView?.(offer)}>
            <div className="offer-header">
              <div>
                <div className="offer-label-name">{def?.name}</div>
                <div className="offer-exec">{def?.exec} • {def?.type}</div>
              </div>
              <div className="offer-badges">
                <span className="badge-risk" style={{ background: risk.color }}>{risk.icon} {risk.text}</span>
                <span className="badge-score">Score {offer.dealScore}/100</span>
              </div>
            </div>
            <div className="offer-quick-stats">
              <QuickStat label="Advance" value={fmtMoney(offer.advance)} />
              <QuickStat label="Rec. Fund" value={fmtMoney(offer.recordingFund)} />
              <QuickStat label="Royalty" value={fmtPercent(offer.royaltyRate)} good={offer.royaltyRate >= 0.18} />
              <QuickStat label="360" value={threeSixty.severity} color={threeSixty.color} />
            </div>
            <div className="offer-fit">{offer.fitNote}</div>
            <div className="offer-actions">
              <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onSign(offer); }}>Sign Deal</button>
              <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onView?.(offer); }}>Review →</button>
            </div>
          </div>
        );
      })}
      {state.pendingLabelOffers.length > 0 && (
        <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={onDismiss}>
          Decline All
        </button>
      )}
    </div>
  );
}

function CutPill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct === 0 ? "var(--sage)" : pct <= 8 ? "var(--ink)" : pct <= 15 ? "var(--amber)" : "var(--rust)";
  return (
    <div className="cut-pill">
      <span className="cut-pill-label">{label}</span>
      <span className="cut-pill-value" style={{ color }}>{pct === 0 ? "FREE" : `${pct}%`}</span>
    </div>
  );
}

function TermRow({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="term-row">
      <span className="term-row-label">{label}</span>
      <span className="term-row-value" style={{ color: good === true ? "var(--sage)" : good === false ? "var(--rust)" : undefined }}>{value}</span>
      {sub && <span className="term-row-sub">{sub}</span>}
    </div>
  );
}

function QuickStat({ label, value, good, color }: { label: string; value: string; good?: boolean; color?: string }) {
  return (
    <div className="quick-stat">
      <div className="quick-stat-label">{label}</div>
      <div className="quick-stat-value" style={{ color: color ?? (good === true ? "var(--sage)" : good === false ? "var(--rust)" : undefined) }}>{value}</div>
    </div>
  );
}
