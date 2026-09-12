import { useState } from "react";
import {
  CITIES, VENUES, fmtMoney, fmt,
  calculateSetlistSatisfaction,
  getVenuePerkDisplay,
  FESTIVALS,
  type SetlistConfig,
} from "../gameLogic";
import Dialog from "./ui/Dialog";
import { regionalDemandLabel } from "../gameSystems/careerDepth";
import type { GameController } from "../useGameState";

type LiveTabProps = Pick<GameController,
  "state" | "doToggleTourCity" | "doSetVenueTier" | "doSetTicketMult" |
  "doStartTour" | "doSetSetlist" | "doAcceptOpeningAct" |
  "doDismissOpeningActOffers" | "doAcceptFestival" | "doDismissFestivalOffers"
>;

export default function LiveTab(game: LiveTabProps) {
  const {
    state, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour,
    doSetSetlist, doAcceptOpeningAct, doDismissOpeningActOffers,
    doAcceptFestival, doDismissFestivalOffers,
  } = game;
  const [sub, setSub] = useState<"tour" | "setlist" | "offers" | "festivals" | "reputation">("tour");
  const [confirmTour, setConfirmTour] = useState(false);

  const inQueue = new Set(state.tourQueue.map((q) => q.cityName));
  const isHeadliner = state.tourQueue.length > 5;
  const totalSlots = isHeadliner ? 22 : 6;
  const currentTotal = state.setlistConfig?.deepCutCount + state.setlistConfig?.hitCount + state.setlistConfig?.newMaterialCount || 0;
  const setlistValid = currentTotal === totalSlots;
  const setlistPreview = state.catalog?.length > 0
    ? calculateSetlistSatisfaction(state.setlistConfig || { deepCutCount: 1, hitCount: 4, newMaterialCount: 1, totalSlots: 6 }, state.catalog, totalSlots)
    : null;

  return (
    <div className="animate-fadeIn">
      <div className="pg-hd">
        <div className="pg-title">Live</div>
        <div className="tip-text">Touring, festivals & performance</div>
      </div>

      <div className="subtabs">
        {(["tour", "setlist", "offers", "festivals", "reputation"] as const).map((t) => (
          <button key={t} className={`subtab-btn ${sub === t ? "active" : ""}`} onClick={() => setSub(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* TOUR */}
      {sub === "tour" && (
        <div className="stagger-1">
          {state.tourActive ? (
            <div className="card card-active">
              <div className="card-title">🚐 On The Road</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Show {state.tourActive.progress + 1} of {state.tourActive.shows.length}
              </div>
              <div className="tip-text" style={{ marginTop: 4 }}>
                Next: {state.tourActive.shows[state.tourActive.progress]?.cityName ?? "Finishing up..."}
              </div>
              {state.pendingTourAftercare && <div className="card-sm" style={{ marginTop: 10, color: "var(--amber)" }}>🌃 Choose your after-show move before the next stop.</div>}
              <div className="sbar-track" style={{ marginTop: 10 }}>
                <div className="sbar-fill f-gold" style={{
                  width: `${(state.tourActive.progress / Math.max(1, state.tourActive.shows.length)) * 100}%`,
                }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span>Band Morale</span>
                  <span>{state.tourMorale}%</span>
                </div>
                <div className="sbar-track" style={{ marginTop: 4 }}>
                  <div className="sbar-fill" style={{
                    width: `${state.tourMorale}%`,
                    background: state.tourMorale > 70 ? "var(--sage)" : state.tourMorale > 40 ? "var(--amber)" : "var(--rust)",
                  }} />
                </div>
              </div>
              {setlistPreview && (
                <div className="card-sm" style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600 }}>Setlist: {setlistPreview.label} ({setlistPreview.score}/100)</div>
                  <div className="tip-text">{setlistPreview.feedback}</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-title">Venue Tier</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {VENUES.map((v) => (
                    <button key={v.tier} className={`btn btn-sm ${state.tourVenue === v.tier ? "btn-lime" : ""}`} onClick={() => doSetVenueTier(v.tier)}>
                      {v.tier}: {v.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title">Ticket Price</div>
                <input aria-label="Ticket price multiplier" type="range" min={0.5} max={2.5} step={0.1} value={state.tourTicketMult} onChange={(e) => doSetTicketMult(parseFloat(e.target.value))} />
                <div style={{ textAlign: "center", fontSize: 12, marginTop: 4 }}>×{state.tourTicketMult.toFixed(1)}</div>
              </div>
              <div className="card">
                <div className="card-title">Cities ({state.tourQueue.length} selected)</div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {CITIES.map((c) => {
                    const v = c.venues.find((v) => v.tier === state.tourVenue) ?? c.venues[c.venues.length - 1];
                    const isIn = inQueue.has(c.name);
                    return (
                      <button key={c.name} type="button" className={`city-row ${isIn ? "booked" : ""}`} onClick={() => doToggleTourCity(c.name)} aria-pressed={isIn}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                          <div className="tip-text">{v.name} • {v.cap} cap • {fmtMoney(v.cost + c.travelCost)}</div>
                          <div className="tip-text">{regionalDemandLabel(state, c.name)}</div>
                        </div>
                        <div style={{ fontSize: 18 }}>{isIn ? "✓" : "+"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="tip-text" style={{ marginBottom: 8 }}>Upfront route cost: {fmtMoney(state.tourQueue.reduce((s, q) => s + q.travelCost + q.venueCost, 0))}. One stop resolves per week and builds fatigue.</div>
              {state.streetHustle?.microRouteReady && !state.streetHustle.microRouteUsed && <div className="tip-text" style={{ marginBottom: 8 }}>Street Hustle Micro Route ready: choose up to 3 stops and your street contacts cover the crew advance.</div>}
              <button className="btn btn-lime btn-block" disabled={state.tourQueue.length === 0} onClick={() => setConfirmTour(true)}>
                Launch Tour ({fmtMoney(state.tourQueue.reduce((s, q) => s + q.travelCost + q.venueCost, 0))})
              </button>
              {confirmTour && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmTour(false); }}><Dialog titleId="live-tour-confirm" onClose={() => setConfirmTour(false)}><div className="modal-title" id="live-tour-confirm">Launch this tour?</div><p className="tip-text">You will pay the route cost now and commit to {state.tourQueue.length} stop{state.tourQueue.length === 1 ? "" : "s"}. You can still abort later at a reputation cost.</p><div className="modal-footer"><button data-dialog-initial className="btn btn-lime" onClick={() => { doStartTour(); setConfirmTour(false); }}>Launch tour</button><button className="btn btn-ghost" onClick={() => setConfirmTour(false)}>Review route</button></div></Dialog></div>}
            </>
          )}
        </div>
      )}

      {/* SETLIST */}
      {sub === "setlist" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Setlist Builder</div>
            <div className="tip-text" style={{ marginBottom: 10 }}>
              {isHeadliner ? "Headliner slot = 22 songs" : "Opening slot = 6 songs"}
              <br />Deep cuts vs hits vs new material affects fan satisfaction
            </div>

            <SetlistSlider
              label="🎵 Deep Cuts"
              desc="Earns rep with diehard fans"
              value={state.setlistConfig?.deepCutCount || 0}
              onChange={(v) => doSetSetlist({ ...state.setlistConfig, deepCutCount: v, totalSlots })}
              max={totalSlots}
            />
            <SetlistSlider
              label="🔥 Hits"
              desc="Maximizes fan satisfaction"
              value={state.setlistConfig?.hitCount || 0}
              onChange={(v) => doSetSetlist({ ...state.setlistConfig, hitCount: v, totalSlots })}
              max={totalSlots}
            />
            <SetlistSlider
              label="✨ New Material"
              desc="Builds hype but risks alienating casuals"
              value={state.setlistConfig?.newMaterialCount || 0}
              onChange={(v) => doSetSetlist({ ...state.setlistConfig, newMaterialCount: v, totalSlots })}
              max={totalSlots}
            />

            <div style={{
              padding: 10,
              background: setlistValid ? "var(--sage-d)" : "var(--rust-d)",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              color: setlistValid ? "var(--sage)" : "var(--rust)",
              marginTop: 10,
            }}>
              Total: {currentTotal} / {totalSlots} songs {setlistValid ? "✓" : "⚠"}
            </div>

            {setlistPreview && (
              <div className="card-sm" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Preview: {setlistPreview.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, margin: "4px 0" }}>{setlistPreview.score}/100</div>
                <div className="tip-text" style={{ fontStyle: "italic" }}>"{setlistPreview.feedback}"</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 11 }}>
                  <span className="text-sage">+{setlistPreview.deepCutBonus} rep</span>
                  <span style={{ color: "var(--amber)" }}>+{setlistPreview.hitBonus} fans</span>
                  <span className="text-muted">{setlistPreview.newMaterialBonus >= 0 ? "+" : ""}{setlistPreview.newMaterialBonus} hype</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPENING ACTS */}
      {sub === "offers" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Opening Act Offers</div>
            {(!state.pendingOpeningActOffers || state.pendingOpeningActOffers.length === 0) && !state.activeOpeningAct && (
              <div className="empty-state">No offers. Keep building your rep!</div>
            )}
            {state.activeOpeningAct && (
              <div className="card-sm" style={{ background: "var(--sage-d)", marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>🎤 Currently Opening For</div>
                <div style={{ fontSize: 16, fontWeight: 700, margin: "4px 0" }}>{state.activeOpeningAct.headlinerName}</div>
                <div className="tip-text">
                  {state.activeOpeningAct.showsCount} shows · {fmtMoney(state.activeOpeningAct.payPerShow)}/show
                  <br />Exposure: ×{state.activeOpeningAct.exposureMultiplier.toFixed(1)} fan multiplier
                </div>
              </div>
            )}
            {state.pendingOpeningActOffers?.map((offer) => (
              <div key={offer.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{offer.headlinerName}</div>
                <div className="tip-text">
                  {offer.showsCount} shows · {fmtMoney(offer.payPerShow)}/show · ×{offer.exposureMultiplier.toFixed(1)} exposure
                </div>
                <div className="tip-text">{offer.description}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-sm btn-lime" onClick={() => doAcceptOpeningAct(offer.id)}>Accept</button>
                  <button className="btn btn-sm" onClick={doDismissOpeningActOffers}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FESTIVALS */}
      {sub === "festivals" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Festival Bookings</div>

            {state.festivalBookings?.filter((b) => !b.completed).length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--sage)" }}>📅 Upcoming</div>
                {state.festivalBookings.filter((b) => !b.completed).map((booking) => {
                  const fest = FESTIVALS.find((f) => f.id === booking.festivalId);
                  return (
                    <div key={booking.festivalId} className="card" style={{ marginBottom: 8, borderColor: "var(--sage)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 600 }}>{fest?.emoji} {booking.festivalName}</div>
                        <span className={`tag ${booking.stage === "main" ? "t-gold" : booking.stage === "secondary" ? "t-lime" : "t-gray"}`}>
                          {booking.stage} stage
                        </span>
                      </div>
                      <div className="tip-text" style={{ marginTop: 4 }}>
                        Week {booking.performanceWeek} · {fmtMoney(booking.pay)} · +{fmt(booking.fanExposure)} fans
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {state.pendingFestivalOffers?.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, marginTop: 12, color: "var(--amber)" }}>📨 Offers</div>
                {state.pendingFestivalOffers.map((offer) => {
                  const fest = FESTIVALS.find((f) => f.id === offer.festivalId);
                  return (
                    <div key={offer.festivalId} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 600 }}>{fest?.emoji} {offer.festivalName}</div>
                        <span className={`tag ${offer.stage === "main" ? "t-gold" : offer.stage === "secondary" ? "t-lime" : "t-gray"}`}>
                          {offer.stage} stage
                        </span>
                      </div>
                      <div className="tip-text" style={{ marginTop: 4 }}>
                        {fmtMoney(offer.pay)} · +{fmt(offer.fanExposure)} fans · Week {offer.performanceWeek}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="btn btn-sm btn-lime" onClick={() => doAcceptFestival(offer.festivalId)}>Accept</button>
                        <button className="btn btn-sm" onClick={doDismissFestivalOffers}>Decline All</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {state.completedFestivals?.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, marginTop: 12, color: "var(--muted)" }}>✓ Completed</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {state.completedFestivals.map((fid: string) => {
                    const fest = FESTIVALS.find((f) => f.id === fid);
                    return (
                      <span key={fid} className="tag t-gray">{fest?.emoji} {fest?.name}</span>
                    );
                  })}
                </div>
              </>
            )}

            {(!state.pendingFestivalOffers || state.pendingFestivalOffers.length === 0) &&
             (!state.festivalBookings || state.festivalBookings.filter((b) => !b.completed).length === 0) &&
             (!state.completedFestivals || state.completedFestivals.length === 0) && (
              <div className="empty-state">No festival bookings yet. Build fame and rep!</div>
            )}
          </div>
        </div>
      )}

      {/* VENUE REPUTATION */}
      {sub === "reputation" && (
        <div className="stagger-1">
          <div className="card">
            <div className="card-title">Venue Reputation</div>
            <div className="tip-text" style={{ marginBottom: 10 }}>
              Play the same venues repeatedly to unlock perks.
            </div>
            {Object.keys(state.venueReputations || {}).length === 0 && (
              <div className="empty-state">No venue reputation yet. Start touring!</div>
            )}
            {Object.values(state.venueReputations || {}).map((rep) => {
              const perk = getVenuePerkDisplay(rep.venueName, rep.playCount);
              return (
                <div key={rep.venueName} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rep.venueName}</div>
                    <span className="tag t-lime">{rep.playCount} plays</span>
                  </div>
                  <div className="tip-text" style={{ marginTop: 4 }}>
                    {perk.label !== "No perks" && perk.label !== "No perk yet" ? (
                      <span className="text-sage">🏆 {perk.label}</span>
                    ) : (
                      <span>{perk.nextTier}</span>
                    )}
                  </div>
                  <div className="tip-text">Last played: Week {rep.lastPlayedWeek}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tour History (always visible at bottom) */}
      <div className="sec-div">Tour History</div>
      {(!state.tourHistory || state.tourHistory.length === 0) && <div className="empty-state">No shows yet.</div>}
      {state.tourHistory?.slice(0, 10).map((h, i: number) => (
        <div className="news-item" key={i}>
          <div className="news-week">W{h.week}</div>
          <div><b>{h.cityName}</b> @ {h.venueName} — {h.attendancePct}% full • {fmtMoney(h.net)} net</div>
        </div>
      ))}
    </div>
  );
}

function SetlistSlider({ label, desc, value, onChange, max }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; max: number;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="tip-text" style={{ marginBottom: 4 }}>{desc}</div>
      <div style={{ display: "flex", gap: 4 }}>
        <button className="btn btn-sm" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <button className="btn btn-sm" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}
