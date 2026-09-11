import { useState } from "react";
import { fmt, fmtMoney, getCareerTierIdx, CAREER_TIERS, getBurnoutTier } from "../gameLogic";
import type { DrawerType } from "./GameScreen";
import Dialog from "./ui/Dialog";
import ActionCard from "./ui/ActionCard";

interface DashboardProps {
  state: any;
  advance: () => void;
  onOpenDrawer: (d: DrawerType) => void;
  onSwitchTab: (tab: string) => void;
  doTakeVacation: () => void;
  doAbortTour: () => void;
  doFinishProject: () => void;
  doScrubProject: () => void;
  doDismissLabelOffers: () => void;
  doDismissManagerOffers: () => void;
  doAcceptManagerOffer: (id: string) => void;
  doAcceptFeatureRequest: (id: string) => void;
  doDismissFeatureRequests: () => void;
  doAcceptOpeningAct: (id: string) => void;
  doDismissOpeningActOffers: () => void;
  doAcceptFestival: (id: string) => void;
  doDismissFestivalOffers: () => void;
  doAcceptPublishingOffer: (id: string) => void;
  doDismissPublishingOffers: () => void;
  doAcceptSyncOffer: (id: string) => void;
  doDismissSyncOffers: () => void;
  doStreetCircuit: (id: "tunnel" | "platform" | "patio") => void;
  doSetStreetLodging: (lodging: "couch" | "room" | "motel") => void;
}

export default function DashboardTab(props: DashboardProps) {
  const s = props.state;
  const [confirmation, setConfirmation] = useState<"scrub" | "abort" | null>(null);
  const tier = CAREER_TIERS[getCareerTierIdx(s.fame)];
  const burn = getBurnoutTier(s.burnout ?? 0);
  const street = s.streetHustle && !s.streetHustle.graduated ? s.streetHustle : null;
  const streetSetBooked = !!street?.pendingPerformance || street?.lastCircuitWeek === s.week;
  const focusStreetHustle = () => document.getElementById("street-hustle-command")?.scrollIntoView({ behavior: "smooth", block: "center" });

  const quickActions: { id: DrawerType; icon: string; label: string; highlight?: boolean }[] = [
    { id: "studio", icon: "🎙", label: "Record" },
    { id: "unreleased", icon: "📀", label: "Release" },
    { id: "tour", icon: "🚐", label: "Tour" },
    { id: "catalog", icon: "📢", label: "Promote" },
    { id: "grind", icon: "⚡", label: "Hustle" },
    { id: "offers", icon: "📋", label: "Deals" },
    { id: "merch", icon: "👕", label: "Merch" },
  ];

  const totalPending =
    (s.pendingLabelOffers?.length || 0) +
    (s.pendingManagerOffers?.length || 0) +
    (s.pendingFeatureRequests?.length || 0) +
    (s.pendingOpeningActOffers?.length || 0) +
    (s.pendingFestivalOffers?.length || 0) +
    (s.pendingPublishingOffers?.length || 0) +
    (s.pendingSyncOffers?.length || 0);
  const primaryAction = s.project
    ? { label: "Continue recording", detail: `${s.project.title} has ${s.project.weeksLeft} week${s.project.weeksLeft === 1 ? "" : "s"} left.`, action: () => props.onOpenDrawer("studio") }
    : s.tourActive
      ? { label: "Play the next show", detail: `${s.tourActive.shows[s.tourActive.progress]?.cityName ?? "Your final stop"} resolves when you end the week.`, action: props.advance }
      : totalPending > 0
        ? { label: `Review ${totalPending} offer${totalPending === 1 ? "" : "s"}`, detail: "Respond before the next week brings new opportunities.", action: () => props.onSwitchTab("office") }
        : street && !streetSetBooked
          ? { label: "Play the Street Circuit", detail: "Book one legal set this week to earn tips, listeners, and Street Credibility.", action: focusStreetHustle }
        : { label: "Choose this week's move", detail: "Record, release, book a route, or build your name.", action: () => props.onOpenDrawer("studio") };

  return (
    <div className="animate-fadeIn">
      <section className="home-hero">
        <div>
          <div className="home-eyebrow">Career dashboard</div>
          <h1>{tier?.name || "Independent Artist"}</h1>
          <p>{burn.desc}</p>
        </div>
        <button className="btn btn-end-week home-advance" onClick={props.advance}>
          End week
        </button>
      </section>

      <section className="next-move" aria-label="Recommended next move">
        <div>
          <span className="next-move-kicker">Recommended next move</span>
          <strong>{primaryAction.label}</strong>
          <p>{primaryAction.detail}</p>
        </div>
        <button className="btn btn-lime btn-sm" onClick={primaryAction.action}>Go</button>
      </section>

      {/* Big Stats */}
      <div className="bigstat-row stagger-1">
        <div className="bigstat">
          <div className="bigstat-num">{fmtMoney(s.money)}</div>
          <div className="bigstat-lbl">Cash</div>
        </div>
        <div className="bigstat">
          <div className="bigstat-num sage">{fmt(s.fans)}</div>
          <div className="bigstat-lbl">Fans</div>
        </div>
        <div className="bigstat">
          <div className="bigstat-num gold">{fmt(s.superfans ?? 0)}</div>
          <div className="bigstat-lbl">Superfans</div>
        </div>
      </div>

      <section className="week-summary" aria-label="This week summary">
        <div className="card-title">This week</div>
        <ul>
          {s.project && <li><b>Studio:</b> {s.project.pipelineStage ?? "writing"} pass for <i>{s.project.title}</i> · {s.project.weeksLeft} week{s.project.weeksLeft === 1 ? "" : "s"} remaining.</li>}
          {s.tourActive && <li><b>Live:</b> {s.tourActive.shows[s.tourActive.progress]?.cityName ?? "tour wrap"} is next · show {s.tourActive.progress + 1} of {s.tourActive.shows.length}.</li>}
          {s.activeAlbumCampaign && <li><b>Campaign:</b> {s.activeAlbumCampaign.pendingAction ? "a campaign move is locked in" : "choose a campaign move or hold steady"} before ending the week.</li>}
          {!s.project && !s.tourActive && !s.activeAlbumCampaign && <li><b>Open week:</b> choose a recording, release, live, or business action before advancing.</li>}
          <li><b>End week:</b> pays recurring income and expenses, advances active work, and may trigger industry events.</li>
        </ul>
      </section>

      {street && <section id="street-hustle-command" className="street-hustle-command animate-fadeInUp" tabIndex={-1} aria-label="Street Hustle command center">
        <div className="street-hustle-heading">
          <div><span className="next-move-kicker">Street Hustle</span><h2>Make this week count.</h2></div>
          <div className="street-cred"><strong>{street.credibility}</strong><span>Street Cred</span></div>
        </div>
        <p className="street-hustle-copy">{street.pendingPerformance ? `${street.pendingPerformance.name} is booked. Tips and listeners settle when you end the week.` : street.lastCircuitWeek === s.week ? "You already played a Street Circuit set this week. Take care of your lodging and settle up at week’s end." : "Pick one legal set. Each crowd builds cash, listeners, and your name."}</p>
        <span className="street-section-label">Tonight's set</span>
        <div className="street-set-grid">
          {([
            ["tunnel", "Park Tunnel", "$55", "+18 listeners", "-10 energy"],
            ["platform", "Subway Platform", "$80", "+25 listeners", "-18 energy"],
            ["patio", "Late-night Patio", "$115", "+30 listeners", "-25 energy · burnout"],
          ] as const).map(([id, name, cash, listeners, cost]) => <button key={id} className="street-set" disabled={streetSetBooked} onClick={() => props.doStreetCircuit(id)}><strong>{name}</strong><span>{cash} · {listeners}</span><small>{cost}</small></button>)}
        </div>
        <span className="street-section-label">This week's lodging</span>
        <div className="street-lodging-grid">
          {([
            ["couch", "Couch", "$0 · -8 energy"],
            ["room", "Weekly room", "$75 · -2 energy"],
            ["motel", "Cheap motel", "$160 · rested"],
          ] as const).map(([id, name, terms]) => <button key={id} className={`street-lodging ${street.lodging === id ? "selected" : ""}`} onClick={() => props.doSetStreetLodging(id)}><strong>{name}</strong><span>{terms}</span></button>)}
        </div>
        <div className="street-next-unlock">
          {!street.diyReleased ? street.credibility >= 3 ? <><strong>DIY Single unlocked.</strong> Self-produce one track for $150 in <button onClick={() => props.onOpenDrawer("studio")}>Studio</button>.</> : <>Next unlock: earn <strong>{3 - street.credibility} more Street Cred</strong> for a $150 DIY Single.</> : !street.microRouteUsed && street.credibility >= 4 ? <><strong>Micro Route ready.</strong> Your street contacts cover the crew advance for a three-stop route in <button onClick={() => props.onSwitchTab("live")}>Live</button>.</> : !street.microRouteUsed ? <>Next unlock: earn <strong>{4 - street.credibility} more Street Cred</strong> for a contact-backed Micro Route.</> : <>Keep building toward graduation: 3 releases, 4 shows, and 500 fans ends survival lodging.</>}
        </div>
      </section>}

      {/* Quick Actions */}
      <div className="quick-actions quick-actions-primary">
        {quickActions.map((a) => (
          <button
            key={a.id}
            className={`quick-action-btn ${a.highlight ? "highlight" : ""}`}
            onClick={() => a.id && props.onOpenDrawer(a.id)}
          >
            <span className="qa-icon">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
        <button
          className="quick-action-btn"
          onClick={props.doTakeVacation}
          disabled={(s.vacationCooldown ?? 0) > 0 || s.money < 2200}
        >
          <span className="qa-icon">🏖</span>
          <span>Vacation</span>
        </button>
      </div>

      <details className="home-more-actions">
        <summary>More actions <span>Hustle, deals, merch, rest</span></summary>
        <div className="quick-actions quick-actions-secondary">
          <button className="quick-action-btn" onClick={() => props.onOpenDrawer("grind")}><span>Hustle</span></button>
          <button className="quick-action-btn" onClick={() => props.onOpenDrawer("offers")}><span>Deals</span></button>
          <button className="quick-action-btn" onClick={() => props.onOpenDrawer("merch")}><span>Merch</span></button>
          <button className="quick-action-btn" onClick={props.doTakeVacation} disabled={(s.vacationCooldown ?? 0) > 0 || s.money < 2200}><span>Vacation</span></button>
        </div>
      </details>

      {/* Active Situation Cards */}
      <div className="stagger-1 dashboard-flow">
        {/* In Studio */}
        {s.project && (
          <div className="card card-active animate-fadeInUp">
            <div className="card-title">🎙 In Studio</div>
            <div className="rel-title" style={{ marginBottom: 4 }}>{s.project.title}</div>
            <div className="rel-meta">
              {s.project.type} • {s.project.tracks.length} track{s.project.tracks.length === 1 ? "" : "s"} • {s.project.weeksLeft}wk left
              {s.project.mode && s.project.mode !== "standard" && (
                <span style={{ marginLeft: 8, color: "var(--amber)" }}>
                  • {s.project.mode}
                </span>
              )}
            </div>
            <div className="sbar-track" style={{ marginTop: 10 }}>
              <div
                className="sbar-fill f-lime"
                style={{
                  width: `${((s.project.totalWeeks - s.project.weeksLeft) / Math.max(1, s.project.totalWeeks)) * 100}%`,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm btn-lime" onClick={props.doFinishProject}>
                Finish
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => setConfirmation("scrub")}>
                Scrub
              </button>
            </div>
          </div>
        )}

        {/* On Tour */}
        {s.tourActive && (
          <div className="card card-active animate-fadeInUp">
            <div className="card-title">🚐 On Tour</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Show {s.tourActive.progress + 1} of {s.tourActive.shows.length}
            </div>
            <div className="tip-text" style={{ marginTop: 4 }}>
              Next: {s.tourActive.shows[s.tourActive.progress]?.cityName ?? "Wrapping up..."}
            </div>
            <div className="sbar-track" style={{ marginTop: 10 }}>
              <div
                className="sbar-fill f-gold"
                style={{
                  width: `${(s.tourActive.progress / Math.max(1, s.tourActive.shows.length)) * 100}%`,
                }}
              />
            </div>
            <button className="btn btn-sm btn-danger" style={{ marginTop: 12 }} onClick={() => setConfirmation("abort")}>
              Abort Tour
            </button>
          </div>
        )}

        {/* Pending Offers */}
        {totalPending > 0 && (
          <div className="card animate-fadeInUp">
            <div className="card-title">📋 Pending Offers ({totalPending})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.pendingLabelOffers?.length > 0 && (
                <ActionCard onClick={() => props.onSwitchTab("office")}>
                  <div>
                    <div className="pick-name">🏢 {s.pendingLabelOffers.length} Label Offer{s.pendingLabelOffers.length > 1 ? "s" : ""}</div>
                    <div className="pick-meta">Tap to review in Office</div>
                  </div>
                </ActionCard>
              )}
              {s.pendingManagerOffers?.length > 0 && (
                <ActionCard onClick={() => props.onSwitchTab("office")}>
                  <div>
                    <div className="pick-name">👔 {s.pendingManagerOffers.length} Manager Offer{s.pendingManagerOffers.length > 1 ? "s" : ""}</div>
                    <div className="pick-meta">Tap to review in Office</div>
                  </div>
                </ActionCard>
              )}
              {s.pendingFeatureRequests?.length > 0 && (
                <ActionCard onClick={() => props.onOpenDrawer("offers")}>
                  <div>
                    <div className="pick-name">🎤 Feature Request</div>
                    <div className="pick-meta">From {s.pendingFeatureRequests[0]?.featureName || "an artist"}</div>
                  </div>
                </ActionCard>
              )}
              {s.pendingOpeningActOffers?.length > 0 && (
                <ActionCard onClick={() => props.onSwitchTab("live")}>
                  <div>
                    <div className="pick-name">🎤 Opening Act Offer</div>
                    <div className="pick-meta">{s.pendingOpeningActOffers[0]?.headlinerName}</div>
                  </div>
                </ActionCard>
              )}
              {s.pendingFestivalOffers?.length > 0 && (
                <ActionCard onClick={() => props.onSwitchTab("live")}>
                  <div>
                    <div className="pick-name">🎪 Festival Offer</div>
                    <div className="pick-meta">{s.pendingFestivalOffers[0]?.festivalName}</div>
                  </div>
                </ActionCard>
              )}
              {s.pendingPublishingOffers?.length > 0 && (
                <ActionCard onClick={() => props.onSwitchTab("office")}>
                  <div>
                    <div className="pick-name">📚 Publishing Offer</div>
                    <div className="pick-meta">{s.pendingPublishingOffers[0]?.publisherName}</div>
                  </div>
                </ActionCard>
              )}
              {s.pendingSyncOffers?.length > 0 && (
                <ActionCard onClick={() => props.onSwitchTab("office")}>
                  <div>
                    <div className="pick-name">📺 Sync Offer</div>
                    <div className="pick-meta">{s.pendingSyncOffers[0]?.showName}</div>
                  </div>
                </ActionCard>
              )}
            </div>
          </div>
        )}

        {/* Festival Reminder */}
        {s.festivalBookings?.filter((b: any) => !b.completed).length > 0 && (
          <div className="card animate-fadeInUp">
            <div className="card-title">🎪 Upcoming Festivals</div>
            {s.festivalBookings.filter((b: any) => !b.completed).map((b: any) => (
              <div key={b.festivalId} className="tip-text" style={{ marginBottom: 4 }}>
                {b.festivalName} — Week {b.performanceWeek} • {b.stage} stage
              </div>
            ))}
          </div>
        )}

        {/* Vitals */}
        <div className="card">
          <div className="card-title">Vitals</div>
          <StatBar name="Fame" val={s.fame} max={100} color="f-lime" />
          <StatBar name="Rep" val={s.rep} max={100} color="f-green" />
          <StatBar name="Energy" val={s.energy} max={100} color="f-blue" />
          <StatBar name="Hype" val={s.hype} max={100} color="f-purple" />
          <StatBar name="Burnout" val={s.burnout ?? 0} max={100} color="f-orange" />
          <div className="tip-text" style={{ marginTop: 6, fontStyle: "italic" }}>
            {burn.desc}
          </div>
        </div>

        {/* Active Deals Summary */}
        <div className="card">
          <div className="card-title">Active Deals</div>
          {s.activeBrandDeals.length === 0 && s.currentLabel == null && s.currentManager == null && (
            <div className="tip-text">No active deals. Build your rep to get offers.</div>
          )}
          {s.activeBrandDeals.map((d: any) => (
            <div key={d.id} style={{ fontSize: 12, marginBottom: 4 }}>
              <span className="tag t-lime">{d.name}</span>
              <span className="tip-text" style={{ marginLeft: 8 }}>
                {d.weeksLeft}wk left • {fmtMoney(d.weeklyIncome)}/wk
              </span>
            </div>
          ))}
          {s.currentLabel && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <span className="tag t-gold">Label</span>
              <span className="tip-text" style={{ marginLeft: 8 }}>
                {s.currentLabel.name} • {s.currentLabel.weeksLeft}wk left
              </span>
            </div>
          )}
          {s.currentManager && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <span className="tag t-blue">Manager</span>
              <span className="tip-text" style={{ marginLeft: 8 }}>
                {s.currentManager.name}
              </span>
            </div>
          )}
          {s.currentPublishing && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <span className="tag t-purple">Publishing</span>
              <span className="tip-text" style={{ marginLeft: 8 }}>
                {s.currentPublishing.publisherName}
              </span>
            </div>
          )}
        </div>

        {/* End Week */}
        <button className="btn btn-end-week btn-block" onClick={props.advance}>
          ⏭ End Week
        </button>

        {/* News Feed */}
        <div className="sec-div">Recent News</div>
        <div className="news-feed">
          {s.log.slice(0, 8).map((entry: any, i: number) => (
            <div className={`news-item type-${entry.type || "neutral"}`} key={i}>
              <div className="news-week">W{entry.week}</div>
              <div className="news-text">{entry.msg}</div>
            </div>
          ))}
          {s.log.length === 0 && (
            <div className="empty-state">No events yet. Start your career!</div>
          )}
        </div>

        <details className="career-ledger">
          <summary><span>Career ledger</span><small>Why recent weeks moved</small></summary>
          <div className="career-ledger-list">
            <div className="career-ledger-context">
              <span>Recurring pressure: {fmtMoney(s.weeklyExpenses)}/wk</span>
              <span>Burnout: {Math.round(s.burnout ?? 0)}/100</span>
              {s.currentLabel && <span>Label term: {s.currentLabel.weeksLeft}wk</span>}
              {s.tourActive && <span>On tour: fatigue {Math.round(s.tourFatigue ?? 0)}</span>}
            </div>
            {(s.weeklyLedger ?? []).length === 0 && <div className="empty-state">End a week to start your career ledger.</div>}
            {(s.weeklyLedger ?? []).slice(0, 6).map((entry: any) => (
              <article className="career-ledger-entry" key={entry.week}>
                <div className="career-ledger-topline"><b>Week {entry.week}</b><span>{entry.rolls} career roll{entry.rolls === 1 ? "" : "s"}</span></div>
                <div className="career-ledger-deltas">
                  <span className={entry.cashDelta >= 0 ? "text-sage" : "text-rust"}>{entry.cashDelta >= 0 ? "+" : ""}{fmtMoney(entry.cashDelta)}</span>
                  <span className={entry.fanDelta >= 0 ? "text-sage" : "text-rust"}>{entry.fanDelta >= 0 ? "+" : ""}{fmt(entry.fanDelta)} fans</span>
                  <span>Fame {entry.fameDelta >= 0 ? "+" : ""}{entry.fameDelta}</span>
                  <span>Rep {entry.repDelta >= 0 ? "+" : ""}{entry.repDelta}</span>
                </div>
                {(entry.incomeByCategory || entry.costByCategory) && <details className="career-ledger-breakdown">
                  <summary>Money breakdown</summary>
                  <div className="career-ledger-deltas">
                    {Object.entries(entry.incomeByCategory ?? {}).map(([label, amount]: [string, any]) => <span className="text-sage" key={`in-${label}`}>+{fmtMoney(amount)} {label}</span>)}
                    {Object.entries(entry.costByCategory ?? {}).map(([label, amount]: [string, any]) => <span className="text-rust" key={`out-${label}`}>-{fmtMoney(amount)} {label}</span>)}
                  </div>
                  <p>Cash: {fmtMoney(entry.openingCash)} → {fmtMoney(entry.closingCash)}</p>
                </details>}
                {entry.highlights?.length > 0 && <p>{entry.highlights.join(" · ")}</p>}
              </article>
            ))}
          </div>
        </details>
      </div>
      {confirmation && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmation(null); }}>
        <Dialog titleId="confirm-action-title" onClose={() => setConfirmation(null)}>
          <div className="modal-title" id="confirm-action-title">{confirmation === "scrub" ? "Scrub this project?" : "Abort this tour?"}</div>
          <p className="tip-text">{confirmation === "scrub"
            ? "This permanently deletes the current recording project and all of its unfinished tracks. No cash is refunded."
            : `This cancels the remaining ${Math.max(0, s.tourActive.shows.length - s.tourActive.progress)} show(s). You will lose reputation but recover energy and burnout.`}</p>
          <div className="modal-footer">
            <button data-dialog-initial className="btn btn-danger" onClick={() => { if (confirmation === "scrub") props.doScrubProject(); else props.doAbortTour(); setConfirmation(null); }}>Confirm</button>
            <button className="btn btn-ghost" onClick={() => setConfirmation(null)}>Keep playing</button>
          </div>
        </Dialog>
      </div>}
    </div>
  );
}

function StatBar({ name, val, max, color }: { name: string; val: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (val / max) * 100));
  return (
    <div className="sbar">
      <div className="sbar-row">
        <span className="sbar-name">{name}</span>
        <span className="sbar-val">{val.toFixed(0)}</span>
      </div>
      <div className="sbar-track" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(val)}>
        <div className={`sbar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
