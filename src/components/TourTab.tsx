import { CITIES, VENUES, STUDIOS, fmtMoney, fmt, clamp, getBurnoutTier, burnoutCancelChance, StageDesign, STAGE_DESIGNS, getStageDesign } from "@/game/gameLogic";
import { useGameState } from "@/game/useGameState";

interface Props { gs: ReturnType<typeof useGameState>; }

export default function TourTab({ gs }: Props) {
  const { state, doToggleTourCity, doSetVenueTier, doSetTicketMult, doStartTour, doAbortTour, doSetStageDesign } = gs;
  const s = state;

  const tourVenue = VENUES.find(v=>v.tier===s.tourVenue)??VENUES[0];
  const upfrontCost = s.tourQueue.reduce((sum,q)=>sum+q.travelCost+q.venueCost,0);
  const canStartTour = s.tourQueue.length>0 && !s.tourActive;
  const history = s.tourHistory ?? [];

  const PastShows = history.length>0 ? (
    <>
      <div className="sec-div">Past Shows ({history.length})</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        {history.slice(0,15).map((h,i)=>{
          const expenses = h.crew + h.travelCost + h.labelCut;
          const profitColor = h.net>=0 ? "var(--sage)" : "var(--rust)";
          const fillColor = h.attendancePct>=80 ? "var(--sage)" : h.attendancePct>=50 ? "var(--amber)" : "var(--rust)";
          return (
            <div key={i} className="card" style={{padding:"10px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,fontStyle:"italic",fontFamily:"var(--head)"}}>{h.cityName}</div>
                  <div style={{fontSize:10,color:"var(--muted2)",fontFamily:"var(--mono)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    Wk {h.week} · {h.venueName}
                  </div>
                </div>
                <div style={{textAlign:"right",fontFamily:"var(--mono)",fontSize:11}}>
                  <div style={{color:fillColor,fontWeight:600}}>{h.attendancePct}% full</div>
                  <div style={{color:"var(--muted2)",fontSize:10}}>
                    <span style={{ color: fillColor === "var(--sage)" ? "var(--sage)" : fillColor === "var(--rust)" ? "var(--rust)" : "var(--amber)" }}>
                      {h.attendancePct >= 80 ? "Packed" : h.attendancePct >= 50 ? "Good" : "Sparse"}
                    </span>
                    {" · "}{fmt(h.seats)}/{fmt(h.venueCap)}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)"}}>
                <span>Gross {fmtMoney(h.gross)}</span>
                <span>Exp −{fmtMoney(expenses)}</span>
                <span style={{color:profitColor,fontWeight:600}}>{fmtMoney(h.net)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  ) : null;

  const ticketLabel = s.tourTicketMult<=0.7?"Budget":s.tourTicketMult>=1.5?"Premium":s.tourTicketMult<=1.0?"Standard":"Elevated";
  const multColor = s.tourTicketMult>=1.5?"var(--amber)":s.tourTicketMult>=1.0?"var(--sage)":"var(--denim)";

  // Show active tour info
  if (s.tourActive) {
    const remaining = s.tourActive.shows.length - s.tourActive.progress;
    const nextShow = s.tourActive.shows[s.tourActive.progress];
    const burnTier = getBurnoutTier(s.burnout ?? 0);
    const cancelPct = Math.round(burnoutCancelChance(s.burnout ?? 0) * 100);
    return (
      <div style={{padding:"16px 16px 100px"}}>
        <div className="pg-title">On the Road</div>
        <div className="pg-sub">{remaining} show{remaining!==1?"s":""} remaining</div>

        {(s.burnout ?? 0) >= 50 && (
          <div className="card" style={{
            marginBottom: 10,
            borderColor: burnTier.color === "rust" ? "var(--rust)" : "var(--amber)",
            borderLeft: `3px solid ${burnTier.color === "rust" ? "var(--rust)" : "var(--amber)"}`,
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: burnTier.color === "rust" ? "var(--rust)" : "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              ⚠ Burnout — {burnTier.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}>
              {burnTier.desc}{cancelPct > 0 && <> Each show has a <span style={{ color: "var(--rust)", fontWeight: 700 }}>{cancelPct}% cancel risk</span>.</>}
            </div>
          </div>
        )}

        <div className="card" style={{marginBottom:10}}>
          <div className="card-title">Tour Progress</div>
          <div style={{height:6,background:"var(--bg4)",borderRadius:3,overflow:"hidden",marginBottom:12}}>
            <div style={{height:"100%",background:"var(--amber)",borderRadius:3,transition:"width .6s",
              width:(s.tourActive.progress/s.tourActive.shows.length*100)+"%"}}/>
          </div>
          <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted2)"}}>
            {s.tourActive.progress} of {s.tourActive.shows.length} shows complete
          </div>
        </div>

        {nextShow && (
          <div className="card" style={{marginBottom:10,borderColor:"var(--amber)"}}>
            <div className="card-title" style={{color:"var(--amber)"}}>Next Show</div>
            <div style={{fontFamily:"var(--head)",fontSize:18,fontWeight:900,fontStyle:"italic"}}>{nextShow.cityName}</div>
            <div style={{fontSize:12,color:"var(--muted2)",marginTop:2,fontFamily:"var(--mono)"}}>{nextShow.venueName} · Cap {fmt(nextShow.venueCap)}</div>
            <div style={{fontSize:11,color:"var(--muted2)",marginTop:6}}>Advance a week to play.</div>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {s.tourActive.shows.map((sh,i)=>{
            const done = i<s.tourActive!.progress;
            const current = i===s.tourActive!.progress;
            return (
              <div key={i} className="city-row" style={{opacity:done?0.4:1,borderColor:current?"var(--amber)":"var(--border)",cursor:"default"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:current?"var(--amber)":"var(--text)"}}>{sh.cityName}</div>
                  <div style={{fontSize:10,color:"var(--muted2)",fontFamily:"var(--mono)"}}>{sh.venueName}</div>
                </div>
                <span className={`tag ${done?"t-gray":current?"t-lime":"t-purple"}`}>{done?"Done":current?"Next":"Upcoming"}</span>
              </div>
            );
          })}
        </div>

        {s.tourFatigue>0 && (
          <div style={{marginTop:14,padding:"9px 12px",background:"var(--rust-d)",borderRadius:7,border:"1px solid rgba(192,68,44,0.2)",fontSize:11,color:"var(--rust)"}}>
            Tour fatigue: {Math.floor(s.tourFatigue)}% — reduces show demand
          </div>
        )}

        {/* Abort Tour — always available as an escape hatch; rep cost scales with remaining shows */}
        <div className="card" style={{marginTop:14,borderColor:"var(--border)"}}>
          <div style={{fontSize:12,color:"var(--muted2)",lineHeight:1.55,marginBottom:8}}>
            Need to get off the road? Aborting costs <span style={{color:"var(--rust)",fontWeight:700}}>2–12 rep</span> depending on how many shows you skip, but you'll recover some burnout and energy.
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{width:"100%",borderColor:"var(--danger)",color:"var(--danger)"}}
            onClick={()=>{
              const rem = s.tourActive ? s.tourActive.shows.length - s.tourActive.progress : 0;
              const pen = Math.min(12, 2 + rem * 2);
              if(window.confirm(`Abort tour? ${rem} show${rem===1?"":"s"} remaining. -${pen} rep. Tour income for those shows lost.`)) doAbortTour();
            }}>
            Pull Off the Road
          </button>
        </div>

        <div style={{marginTop:14}}>{PastShows}</div>
      </div>
    );
  }

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div className="pg-title">Book a Tour</div>
      <div className="pg-sub">Select cities, venue tier, and ticket pricing. Pay upfront to go on the road.</div>

      {/* Venue Tier */}
      <div className="sec-div">Venue Tier</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        {VENUES.map(v=>{
          const locked = s.fame<v.fameReq||s.rep<v.repReq;
          const sel = s.tourVenue===v.tier;
          return (
            <button key={v.tier} onClick={()=>!locked&&doSetVenueTier(v.tier)}
              className={`city-row${sel?" booked":""}`}
              style={{opacity:locked?0.35:1,cursor:locked?"not-allowed":"pointer"}}>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>{v.name}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)"}}>Cap {fmt(v.cap)} · {fmtMoney(v.cost)}/show</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {locked && <span className="tag t-red">Locked</span>}
                {!locked && sel && <span className="tag t-lime">Selected</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Ticket Price */}
      <div className="sec-div">Ticket Price</div>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontFamily:"var(--head)",fontStyle:"italic",fontSize:14}}>{ticketLabel}</span>
          <span style={{fontFamily:"var(--mono)",fontSize:13,color:multColor}}>{s.tourTicketMult.toFixed(1)}× multiplier</span>
        </div>
        <input type="range" min={0.5} max={2.0} step={0.1}
          value={s.tourTicketMult}
          onChange={e=>doSetTicketMult(parseFloat(e.target.value))}
          style={{width:"100%"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:4}}>
          <span>0.5× Budget</span><span>1.0× Standard</span><span>2.0× Premium</span>
        </div>
        <div style={{fontSize:10,color:"var(--muted2)",marginTop:6,fontStyle:"italic"}}>
          Higher price = more revenue, lower fill rate. Budget pricing fills rooms easier.
        </div>
      </div>

      {/* Stage Design */}
      <div className="sec-div">
        Stage Design
        <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginLeft:8, fontWeight:400 }}>
          affects reviews & fan conversion
        </span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
        {STAGE_DESIGNS.map(d => {
          const sel = s.currentStageDesign === d.id;
          const locked = s.fame < d.unlockFame;
          return (
            <div key={d.id}
              onClick={() => !locked && doSetStageDesign(d.id)}
              style={{
                padding:"9px 11px", borderRadius:7, cursor: locked ? "not-allowed" : "pointer",
                border: `1px solid ${sel ? "var(--amber)" : locked ? "var(--border)" : "var(--border")}`,
                background: sel ? "var(--amber-d)" : "var(--bg3)",
                opacity: locked ? 0.4 : 1,
                transition:"all .13s",
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: sel ? "var(--amber)" : locked ? "var(--muted2)" : "var(--text)" }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize:10, color:"var(--muted2)", marginTop:2, lineHeight:1.4 }}>
                    {d.desc}
                  </div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:4, display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span>{d.costPerShow === 0 ? "Free/show" : `${fmtMoney(d.costPerShow)}/show`}</span>
                    <span>×{d.fanMult.toFixed(2)} fans</span>
                    <span>+{d.reviewBonus} review</span>
                    {d.repRisk > 0 && <span style={{ color:"var(--rust)" }}>{d.repRisk}% gimmick risk</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                  {locked && <span className="tag t-red" style={{ fontSize:8 }}>Locked</span>}
                  {sel && <span className="tag t-lime" style={{ fontSize:8 }}>Selected</span>}
                  {s.fame < d.unlockFame && (
                    <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                      Need {d.unlockFame} fame
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cities */}
      <div className="sec-div">Select Cities</div>
      {CITIES.map(city=>{
        const booked = s.tourQueue.some(q=>q.cityName===city.name);
        const cityVenue = city.venues.find(v=>v.tier===s.tourVenue)??city.venues[city.venues.length-1];
        const isHome = city.name===s.city;
        const studioCount = STUDIOS.filter(st=>st.city===city.name).length;
        return (
          <div key={city.name} className={`city-row${booked?" booked":""}`}
            onClick={()=>doToggleTourCity(city.name)}>
            <div>
              <div style={{fontSize:12,fontWeight:600,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                {city.name}
                {isHome && <span className="tag t-lime">Home</span>}
                <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",fontWeight:400}}>{city.region}</span>
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)",display:"flex",gap:8,flexWrap:"wrap"}}>
                <span>{cityVenue.name} · Cap {fmt(cityVenue.cap)}</span>
                {studioCount>0 && <span style={{color:"var(--amber)"}}>🎙 {studioCount} studio{studioCount>1?"s":""}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {city.travelCost>0 && !isHome && <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)"}}>✈ {fmtMoney(city.travelCost)}</span>}
              <span className={`tag ${booked?"t-lime":"t-gray"}`}>{booked?"Booked":"+"}</span>
            </div>
          </div>
        );
      })}

      {/* Queue Summary */}
      {s.tourQueue.length>0 && (
        <>
          <div className="sec-div">Tour Queue ({s.tourQueue.length} shows)</div>
          {s.tourQueue.map(q=>(
            <div key={q.cityName} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
              <span>{q.cityName} — {q.venueName}</span>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)"}}>{fmtMoney(q.venueCost+q.travelCost)}</span>
            </div>
          ))}
          <div style={{marginTop:12,padding:"10px",background:"var(--bg3)",borderRadius:7}}>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--mono)",fontSize:12}}>
              <span style={{color:"var(--muted2)"}}>Upfront total</span>
              <span style={{color:"var(--amber)"}}>{fmtMoney(upfrontCost)}</span>
            </div>
            {upfrontCost>s.money && <div style={{fontSize:10,color:"var(--danger)",marginTop:4,fontStyle:"italic"}}>Not enough money. Need {fmtMoney(upfrontCost-s.money)} more.</div>}
          </div>
          <button className="btn btn-lime btn-block" style={{marginTop:10}}
            disabled={!canStartTour||upfrontCost>s.money}
            onClick={doStartTour}>
            Hit the Road →
          </button>
        </>
      )}

      {s.tourFatigue>30 && (
        <div style={{marginTop:14,padding:"9px 12px",background:"var(--rust-d)",borderRadius:7,border:"1px solid rgba(192,68,44,0.2)",fontSize:11,color:"var(--rust)"}}>
          High tour fatigue ({Math.floor(s.tourFatigue)}%). Rest a few weeks before touring again.
        </div>
      )}

      {PastShows}
    </div>
  );
}
