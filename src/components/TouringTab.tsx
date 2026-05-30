import { useState } from "react";
import {
  CITIES, VENUES, fmtMoney, fmt,
  calculateSetlistSatisfaction,
  getVenuePerkDisplay,
  FESTIVALS,
  type SetlistConfig,
} from "../gameLogic";

export default function TouringTab(game: any) {
  const {
    state, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour,
    doSetSetlist, doAcceptOpeningAct, doDismissOpeningActOffers,
    doAcceptFestival, doDismissFestivalOffers,
  } = game;
  const inQueue = new Set(state.tourQueue.map((q: any) => q.cityName));
  const [activeSubtab, setActiveSubtab] = useState<"tour" | "setlist" | "offers" | "festivals" | "reputation">("tour");

  // Determine if headliner (more than 5 shows = headliner slot count)
  const isHeadliner = state.tourQueue.length > 5;
  const totalSlots = isHeadliner ? 22 : 6;
  const currentTotal = state.setlistConfig?.deepCutCount + state.setlistConfig?.hitCount + state.setlistConfig?.newMaterialCount || 0;
  const setlistValid = currentTotal === totalSlots;

  // Calculate setlist satisfaction preview
  const setlistPreview = state.catalog?.length > 0
    ? calculateSetlistSatisfaction(state.setlistConfig || { deepCutCount: 1, hitCount: 4, newMaterialCount: 1, totalSlots: 6 }, state.catalog, totalSlots)
    : null;

  return (
    <div>
      <div className="pg-hd"><div className="pg-title">Touring</div></div>

      {/* ── Subtab Navigation ── */}
      <div className="g2" style={{ marginBottom: 12 }}>
        <button className={`btn btn-sm ${activeSubtab === "tour" ? "btn-lime" : ""}`} onClick={() => setActiveSubtab("tour")}>Tour</button>
        <button className={`btn btn-sm ${activeSubtab === "setlist" ? "btn-lime" : ""}`} onClick={() => setActiveSubtab("setlist")}>Setlist</button>
        <button className={`btn btn-sm ${activeSubtab === "offers" ? "btn-lime" : ""}`} onClick={() => setActiveSubtab("offers")}>
          Opening Acts {state.pendingOpeningActOffers?.length > 0 ? `(${state.pendingOpeningActOffers.length})` : ""}
        </button>
        <button className={`btn btn-sm ${activeSubtab === "festivals" ? "btn-lime" : ""}`} onClick={() => setActiveSubtab("festivals")}>
          Festivals {state.pendingFestivalOffers?.length > 0 ? `(${state.pendingFestivalOffers.length})` : ""}
        </button>
        <button className={`btn btn-sm ${activeSubtab === "reputation" ? "btn-lime" : ""}`} onClick={() => setActiveSubtab("reputation")}>Venue Rep</button>
      </div>

      {/* ── TOUR SUBTAB ── */}
      {activeSubtab === "tour" && (
        <>
          {state.tourActive ? (
            <div className="card" style={{ borderColor: "var(--amber)" }}>
              <div className="card-title">On The Road</div>
              <div style={{ fontSize: 13 }}>Show {state.tourActive.progress + 1} of {state.tourActive.shows.length}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>
                Next: {state.tourActive.shows[state.tourActive.progress]?.cityName ?? "Finishing up..."}
              </div>
              {/* Tour Morale */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span>Band Morale</span>
                  <span>{state.tourMorale}%</span>
                </div>
                <div style={{ height: 6, background: "var(--track)", borderRadius: 3, marginTop: 4 }}>
                  <div style={{
                    width: `${state.tourMorale}%`,
                    height: "100%",
                    background: state.tourMorale > 70 ? "var(--sage)" : state.tourMorale > 40 ? "var(--amber)" : "var(--rust)",
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
              {/* Setlist preview on tour */}
              {setlistPreview && (
                <div style={{ marginTop: 10, padding: 8, background: "var(--panel)", borderRadius: 6, fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>Tonight's Setlist: {setlistPreview.label} ({setlistPreview.score}/100)</div>
                  <div style={{ color: "var(--muted)", marginTop: 2 }}>{setlistPreview.feedback}</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-title">Venue Tier</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {VENUES.map((v: any) => (
                    <button key={v.tier} className={`btn btn-sm ${state.tourVenue === v.tier ? "btn-lime" : ""}`} onClick={() => doSetVenueTier(v.tier)}>
                      {v.tier}: {v.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title">Ticket Price</div>
                <input type="range" min={0.5} max={2.5} step={0.1} value={state.tourTicketMult} onChange={(e) => doSetTicketMult(parseFloat(e.target.value))} />
                <div style={{ textAlign: "center", fontSize: 12, marginTop: 4 }}>×{state.tourTicketMult.toFixed(1)}</div>
              </div>
              <div className="card">
                <div className="card-title">Cities ({state.tourQueue.length} selected)</div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {CITIES.map((c: any) => {
                    const v = c.venues.find((v: any) => v.tier === state.tourVenue) ?? c.venues[c.venues.length - 1];
                    const isIn = inQueue.has(c.name);
                    return (
                      <div key={c.name} className={`city-row ${isIn ? "booked" : ""}`} onClick={() => doToggleTourCity(c.name)}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted2)" }}>{v.name} • {v.cap} cap • {fmtMoney(v.cost + c.travelCost)}</div>
                        </div>
                        <div style={{ fontSize: 18 }}>{isIn ? "✓" : "+"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button className="btn btn-lime btn-block" disabled={state.tourQueue.length === 0} onClick={doStartTour}>
                Launch Tour ({fmtMoney(state.tourQueue.reduce((s: number, q: any) => s + q.travelCost + q.venueCost, 0))})
              </button>
            </>
          )}
        </>
      )}

      {/* ── SETLIST SUBTAB ── */}
      {activeSubtab === "setlist" && (
        <div>
          <div className="card">
            <div className="card-title">Setlist Builder</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
              {isHeadliner ? "Headliner slot = 22 songs" : "Opening slot = 6 songs"}
              <br />Deep cuts vs hits vs new material affects fan satisfaction
            </div>

            {/* Deep Cuts */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                <span>🎵 Deep Cuts</span>
                <span>{state.setlistConfig?.deepCutCount || 0}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Earns rep with diehard fans</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn btn-sm" onClick={() => doSetSetlist({ ...state.setlistConfig, deepCutCount: Math.max(0, (state.setlistConfig?.deepCutCount || 0) - 1), totalSlots })}>−</button>
                <button className="btn btn-sm" onClick={() => doSetSetlist({ ...state.setlistConfig, deepCutCount: Math.min(totalSlots, (state.setlistConfig?.deepCutCount || 0) + 1), totalSlots })}>+</button>
              </div>
            </div>

            {/* Hits */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                <span>🔥 Hits</span>
                <span>{state.setlistConfig?.hitCount || 0}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Maximizes fan satisfaction & singalongs</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn btn-sm" onClick={() => doSetSetlist({ ...state.setlistConfig, hitCount: Math.max(0, (state.setlistConfig?.hitCount || 0) - 1), totalSlots })}>−</button>
                <button className="btn btn-sm" onClick={() => doSetSetlist({ ...state.setlistConfig, hitCount: Math.min(totalSlots, (state.setlistConfig?.hitCount || 0) + 1), totalSlots })}>+</button>
              </div>
            </div>

            {/* New Material */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                <span>✨ New Material</span>
                <span>{state.setlistConfig?.newMaterialCount || 0}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Builds hype but risks alienating casual fans</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn btn-sm" onClick={() => doSetSetlist({ ...state.setlistConfig, newMaterialCount: Math.max(0, (state.setlistConfig?.newMaterialCount || 0) - 1), totalSlots })}>−</button>
                <button className="btn btn-sm" onClick={() => doSetSetlist({ ...state.setlistConfig, newMaterialCount: Math.min(totalSlots, (state.setlistConfig?.newMaterialCount || 0) + 1), totalSlots })}>+</button>
              </div>
            </div>

            {/* Total & Validation */}
            <div style={{
              padding: 10,
              background: setlistValid ? "rgba(106,141,90,0.15)" : "rgba(192,68,44,0.15)",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              color: setlistValid ? "var(--sage)" : "var(--rust)",
              marginTop: 10,
            }}>
              Total: {currentTotal} / {totalSlots} songs {setlistValid ? "✓" : "⚠"}
            </div>

            {/* Satisfaction Preview */}
            {setlistPreview && (
              <div style={{ marginTop: 12, padding: 10, background: "var(--panel)", borderRadius: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Preview: {setlistPreview.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, margin: "4px 0" }}>{setlistPreview.score}/100</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>"{setlistPreview.feedback}"</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: "var(--sage)" }}>+{setlistPreview.deepCutBonus} rep</span>
                  <span style={{ color: "var(--amber)" }}>+{setlistPreview.hitBonus} fans</span>
                  <span style={{ color: "var(--ink)" }}>{setlistPreview.newMaterialBonus >= 0 ? "+" : ""}{setlistPreview.newMaterialBonus} hype</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── OPENING ACT OFFERS SUBTAB ── */}
      {activeSubtab === "offers" && (
        <div>
          <div className="card">
            <div className="card-title">Opening Act Offers</div>
            {(!state.pendingOpeningActOffers || state.pendingOpeningActOffers.length === 0) && !state.activeOpeningAct && (
              <div className="empty-state">No opening act offers right now. Keep building your rep!</div>
            )}
            {state.activeOpeningAct && (
              <div style={{ padding: 12, background: "rgba(106,141,90,0.15)", borderRadius: 6, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>🎤 Currently Opening For</div>
                <div style={{ fontSize: 16, fontWeight: 700, margin: "4px 0" }}>{state.activeOpeningAct.headlinerName}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {state.activeOpeningAct.showsCount} shows · {fmtMoney(state.activeOpeningAct.payPerShow)}/show
                  <br />Exposure: ×{state.activeOpeningAct.exposureMultiplier.toFixed(1)} fan multiplier
                  <br />Cities: {state.activeOpeningAct.cities.join(", ")}
                </div>
              </div>
            )}
            {state.pendingOpeningActOffers?.map((offer: any) => (
              <div key={offer.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{offer.headlinerName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {offer.showsCount} shows · {fmtMoney(offer.payPerShow)}/show · ×{offer.exposureMultiplier.toFixed(1)} exposure
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>
                      {offer.cities.length} cities · Expires week {offer.expiresWeek}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "var(--ink)" }}>{offer.description}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-sm btn-lime" onClick={() => doAcceptOpeningAct(offer.id)}>Accept</button>
                  <button className="btn btn-sm" onClick={doDismissOpeningActOffers}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FESTIVAL OFFERS SUBTAB ── */}
      {activeSubtab === "festivals" && (
        <div>
          <div className="card">
            <div className="card-title">Festival Bookings</div>

            {/* Upcoming Performances */}
            {state.festivalBookings?.filter((b: any) => !b.completed).length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--sage)" }}>📅 Upcoming</div>
                {state.festivalBookings.filter((b: any) => !b.completed).map((booking: any) => {
                  const fest = FESTIVALS.find(f => f.id === booking.festivalId);
                  return (
                    <div key={booking.festivalId} className="card" style={{ marginBottom: 8, borderColor: "var(--sage)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 600 }}>{fest?.emoji} {booking.festivalName}</div>
                        <span className={`tag ${booking.stage === "main" ? "t-gold" : booking.stage === "secondary" ? "t-lime" : "t-gray"}`}>
                          {booking.stage} stage
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        Week {booking.performanceWeek} · {fmtMoney(booking.pay)} · +{fmt(booking.fanExposure)} fans
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{fest?.description}</div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Pending Offers */}
            {state.pendingFestivalOffers?.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, marginTop: 12, color: "var(--amber)" }}>📨 Offers</div>
                {state.pendingFestivalOffers.map((offer: any) => {
                  const fest = FESTIVALS.find(f => f.id === offer.festivalId);
                  return (
                    <div key={offer.festivalId} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 600 }}>{fest?.emoji} {offer.festivalName}</div>
                        <span className={`tag ${offer.stage === "main" ? "t-gold" : offer.stage === "secondary" ? "t-lime" : "t-gray"}`}>
                          {offer.stage} stage
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        {fmtMoney(offer.pay)} · +{fmt(offer.fanExposure)} fans · Week {offer.performanceWeek}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{fest?.description}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="btn btn-sm btn-lime" onClick={() => doAcceptFestival(offer.festivalId)}>Accept</button>
                        <button className="btn btn-sm" onClick={doDismissFestivalOffers}>Decline All</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Completed Festivals */}
            {state.completedFestivals?.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, marginTop: 12, color: "var(--muted)" }}>✓ Completed</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {state.completedFestivals.map((fid: string) => {
                    const fest = FESTIVALS.find(f => f.id === fid);
                    return (
                      <span key={fid} style={{ padding: "4px 8px", background: "var(--panel)", borderRadius: 4, fontSize: 11 }}>
                        {fest?.emoji} {fest?.name}
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            {(!state.pendingFestivalOffers || state.pendingFestivalOffers.length === 0) &&
             (!state.festivalBookings || state.festivalBookings.filter((b: any) => !b.completed).length === 0) &&
             (!state.completedFestivals || state.completedFestivals.length === 0) && (
              <div className="empty-state">No festival bookings yet. Build your fame and rep to get offers!</div>
            )}
          </div>
        </div>
      )}

      {/* ── VENUE REPUTATION SUBTAB ── */}
      {activeSubtab === "reputation" && (
        <div>
          <div className="card">
            <div className="card-title">Venue Reputation</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
              Play the same venues repeatedly to unlock perks. Dive bars build "authentic" cred. Big rooms build money.
            </div>

            {Object.keys(state.venueReputations || {}).length === 0 && (
              <div className="empty-state">No venue reputation yet. Start touring to build relationships with venues!</div>
            )}

            {Object.values(state.venueReputations || {}).map((rep: any) => {
              const perk = getVenuePerkDisplay(rep.venueName, rep.playCount);
              return (
                <div key={rep.venueName} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rep.venueName}</div>
                    <span className="tag t-lime">{rep.playCount} plays</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {perk.label !== "No perks" && perk.label !== "No perk yet" ? (
                      <span style={{ color: "var(--sage)" }}>🏆 {perk.label}</span>
                    ) : (
                      <span>{perk.nextTier}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>Last played: Week {rep.lastPlayedWeek}</div>
                </div>
              );
            })}

            {/* Legend */}
            <div style={{ marginTop: 12, padding: 10, background: "var(--panel)", borderRadius: 6, fontSize: 11 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Perk Examples:</div>
              <div style={{ color: "var(--muted)" }}>
                • Ryman Auditorium: 5 plays = "Ryman Regular" (+15% tickets, +2 rep)<br />
                • Ryman Auditorium: 15 plays = "Ryman Legend" (+25% tickets, +5 rep)<br />
                • Dive Bars: 10 plays = "Authentic" (+8 rep, -20% cost)<br />
                • Dive Bars: 25 plays = "Dive Bar Legend" (+15 rep, -30% cost)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tour History (always visible) ── */}
      <div className="sec-div">Tour History</div>
      {(!state.tourHistory || state.tourHistory.length === 0) && <div className="empty-state">No shows yet.</div>}
      {state.tourHistory?.slice(0, 10).map((h: any, i: number) => (
        <div className="ev-item" key={i}>
          <div className="ev-wk">W{h.week}</div>
          <div><b>{h.cityName}</b> @ {h.venueName} — {h.attendancePct}% full • {fmtMoney(h.net)} net</div>
        </div>
      ))}
    </div>
  );
}
