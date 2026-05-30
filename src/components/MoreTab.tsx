import { useState } from "react";
import { BRAND_DEALS, AWARDS, FEATURES, RIVALS, fmtMoney, fmt, getTheme, Genre, getBurnoutTier, WardrobeStyle, WARDROBE_STYLES, getWardrobe } from "@/game/gameLogic";
import { useGameState } from "@/game/useGameState";
import type { NewspaperIssue } from "@/game/nashvilleTimes";

interface Props { gs: ReturnType<typeof useGameState>; }

interface ArchivedSummary { json: string; week: number; volume: number; issue: number; lead: string; }

function summarizeArchive(jsonList: string[]): ArchivedSummary[] {
  const out: ArchivedSummary[] = [];
  for (const json of jsonList) {
    try {
      const iss = JSON.parse(json) as NewspaperIssue;
      out.push({
        json,
        week: iss.week,
        volume: iss.volume,
        issue: iss.issue,
        lead: iss.stories?.[0]?.headline ?? "—",
      });
    } catch { /* skip malformed */ }
  }
  return out;
}

interface TabState {
  networking: boolean;
  brandDeals: boolean;
  awards: boolean;
  archive: boolean;
  collabs: boolean;
  press: boolean;
  stats: boolean;
  wellbeing: boolean;
  scene: boolean;
}

const SectionButton = ({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      padding: "10px 14px",
      marginBottom: "10px",
      background: "var(--bg3)",
      border: "1px solid var(--border2)",
      borderRadius: "8px",
      color: "var(--amber)",
      fontFamily: "var(--mono)",
      fontSize: "11px",
      fontWeight: 700,
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "all .13s",
    }}>
    {label}
    <span style={{ marginLeft: "8px" }}>{open ? "▼" : "▶"}</span>
  </button>
);

export default function MoreTab({ gs }: Props) {
  const { state, doSignBrandDeal, doSwitchGenre, openArchivedNewspaper, clearSave, doDropLabel, doDropManager, doTakeVacation, doAcceptLabelOffer, doDismissLabelOffers, doAcceptManagerOffer, doDismissManagerOffers, doSetWardrobe } = gs;
  const [open, setOpen] = useState<TabState>({
    networking: true,
    brandDeals: true,
    awards: false,
    archive: false,
    collabs: false,
    press: false,
    stats: false,
    wellbeing: true,
    scene: true,
  });

  function handleResetSave() {
    const ok = window.confirm(
      "Reset your save?\n\nThis permanently deletes your current career — every release, fan, dollar, and award. You'll be sent back to the main menu.\n\nThis cannot be undone."
    );
    if (ok) clearSave();
  }

  const s = state;
  const archive = summarizeArchive(s.newspaperArchive ?? []);

  const availableDeals = BRAND_DEALS.filter(b=>
    s.fame>=b.fameReq && s.rep>=b.repReq &&
    !s.activeBrandDeals.some(d=>d.id===b.id)
  );

  return (
    <div style={{padding:"16px 16px 100px"}}>

      {/* ── NETWORKING ── */}
      <SectionButton label="Industry & Networking" open={open.networking} onClick={() => setOpen({ ...open, networking: !open.networking })} />
      {open.networking && (
        <div style={{ marginBottom: 14 }}>
          <div className="card">
            <div className="card-title">Networking</div>

            {s.currentManager ? (
              <div style={{marginBottom:10,padding:"12px 14px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--sage)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Manager</div>
                    <div style={{fontFamily:"var(--head)",fontStyle:"italic",fontSize:15,fontWeight:700,marginTop:1}}>{s.currentManager.name}</div>
                  </div>
                  <span className="tag t-green">Active</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 10px",fontFamily:"var(--mono)",fontSize:10,marginBottom:8}}>
                  <span style={{color:"var(--muted2)"}}>Weekly fee</span>
                  <span style={{textAlign:"right",color:"var(--amber)"}}>{fmtMoney(s.currentManager.weeklyFee)}/wk</span>
                  <span style={{color:"var(--muted2)"}}>Show net</span>
                  <span style={{textAlign:"right",color:"var(--sage)"}}>+{Math.round(s.currentManager.showRevPct*100)}%</span>
                  {s.currentManager.brandDealBoost>1 && <>
                    <span style={{color:"var(--muted2)"}}>Brand deals</span>
                    <span style={{textAlign:"right",color:"var(--sage)"}}>+{Math.round((s.currentManager.brandDealBoost-1)*100)}%</span>
                  </>}
                  {s.currentManager.repPerWeek>0 && <>
                    <span style={{color:"var(--muted2)"}}>Rep/wk</span>
                    <span style={{textAlign:"right",color:"var(--sage)"}}>+{s.currentManager.repPerWeek.toFixed(2)}</span>
                  </>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{width:"100%",fontSize:10}}
                  onClick={()=>{ if(window.confirm(`Part ways with ${s.currentManager?.name}? You'll lose all manager perks immediately.`)) doDropManager(); }}>
                  Part Ways
                </button>
              </div>
            ) : (
              <div style={{marginBottom:10,padding:"10px 12px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:700}}>Manager Offers</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>doDismissManagerOffers()}>Dismiss All</button>
                </div>
                <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic",marginBottom:8}}>
                  Managers will reach out when you're ready. Pick one that fits your style.
                </div>
                {s.pendingManagerOffers.length > 0 ? s.pendingManagerOffers.map(o => {
                  const mgr = s.pendingManagerOffers.find(x => x.managerId === o.managerId);
                  const fit = mgr?.fitNote ?? "A manager wants a meeting.";
                  return (
                    <div key={o.managerId} style={{padding:"10px 12px",background:"var(--bg2)",borderRadius:8,border:"1px solid var(--border)",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700}}>{o.managerId.replace(/_/g," ")}</div>
                          <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic",marginTop:2}}>{fit}</div>
                        </div>
                        <button className="btn btn-sm btn-lime" onClick={()=>doAcceptManagerOffer(o.managerId)}>Accept</button>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic"}}>No manager offers right now. Keep playing and they’ll come to you.</div>
                )}
              </div>
            )}

            {s.currentLabel ? (
              <div style={{marginBottom:10,padding:"12px 14px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--amber)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Record Label</div>
                    <div style={{fontFamily:"var(--head)",fontStyle:"italic",fontSize:15,fontWeight:700,marginTop:1}}>{s.currentLabel.name}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",marginTop:1}}>A&R: {s.currentLabel.exec}</div>
                  </div>
                  <span className="tag t-gold">Signed</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 10px",fontFamily:"var(--mono)",fontSize:10,marginBottom:8}}>
                  <span style={{color:"var(--muted2)"}}>Streaming cut</span>
                  <span style={{textAlign:"right",color:"var(--rust)"}}>{Math.round(s.currentLabel.streamingCut*100)}%</span>
                  <span style={{color:"var(--muted2)"}}>Tour cut</span>
                  <span style={{textAlign:"right",color:"var(--rust)"}}>{Math.round(s.currentLabel.tourCut*100)}%</span>
                  <span style={{color:"var(--muted2)"}}>Marketing boost</span>
                  <span style={{textAlign:"right",color:"var(--sage)"}}>×{s.currentLabel.marketingBoost.toFixed(2)}</span>
                  <span style={{color:"var(--muted2)"}}>Contract left</span>
                  <span style={{textAlign:"right",color:"var(--amber)"}}>{s.currentLabel.weeksLeft}wk</span>
                </div>
                <button className="btn btn-ghost btn-sm" style={{width:"100%",fontSize:10}}
                  onClick={()=>{ if(window.confirm(`Break your contract with ${s.currentLabel?.name}? -5 reputation. The cuts and marketing boost end immediately.`)) doDropLabel(); }}>
                  Break Contract
                </button>
              </div>
            ) : (
              <div style={{marginBottom:10,padding:"10px 12px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:700}}>Label Offers</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>doDismissLabelOffers()}>Dismiss All</button>
                </div>
                <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic",marginBottom:8}}>
                  Labels are watching. When one wants you, it’ll show up here.
                </div>
                {s.pendingLabelOffers.length > 0 ? s.pendingLabelOffers.map(o => (
                  <div key={o.labelId} style={{padding:"10px 12px",background:"var(--bg2)",borderRadius:8,border:"1px solid var(--border)",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700}}>{o.labelId.replace(/_/g," ")}</div>
                        <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic",marginTop:2}}>{o.fitNote}</div>
                      </div>
                      <button className="btn btn-sm btn-lime" onClick={()=>doAcceptLabelOffer(o.labelId)}>Accept</button>
                    </div>
                  </div>
                )) : (
                  <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic"}}>No label offers right now. Keep building and they’ll come to you.</div>
                )}
              </div>
            )}

            <div style={{padding:"10px 12px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Distribution Deal</div>
              <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic"}}>
                Distribution comes attached to label interest now — no separate networking step.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BRAND DEALS ── */}
      <SectionButton label="Brand Deals" open={open.brandDeals} onClick={() => setOpen({ ...open, brandDeals: !open.brandDeals })} />
      {open.brandDeals && (
        <div style={{ marginBottom: 14 }}>
          {s.activeBrandDeals.length>0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted2)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Active</div>
              {s.activeBrandDeals.map(d=>(
                <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"var(--bg3)",border:"1px solid var(--sage)",borderRadius:8,marginBottom:6}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700}}>{d.name}</div>
                    <div style={{fontSize:10,color:"var(--muted2)",fontFamily:"var(--mono)"}}>{fmtMoney(d.weeklyIncome)}/wk · {d.weeksLeft}wk left</div>
                  </div>
                  <span className="tag t-green">Active</span>
                </div>
              ))}
            </div>
          )}

          {availableDeals.length>0 ? (
            <>
              <div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted2)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Available</div>
              {availableDeals.map(b=>(
                <div key={b.id} className="card-sm" style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                    <div style={{fontSize:13,fontWeight:700}}>{b.name}</div>
                    <button className="btn btn-lime btn-sm" onClick={()=>doSignBrandDeal(b.id)}>Sign</button>
                  </div>
                  <div style={{fontSize:11,color:"var(--muted2)",fontStyle:"italic",marginBottom:6}}>{b.desc}</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)"}}>{fmtMoney(b.weeklyIncome)}/wk · {b.duration}wk duration</div>
                </div>
              ))}
            </>
          ) : (
            availableDeals.length===0 && s.activeBrandDeals.length===0 && (
              <div className="empty-state"><div style={{fontSize:22,marginBottom:6}}>🤝</div>Build more fame to unlock brand deals.</div>
            )
          )}
        </div>
      )}

      {/* ── AWARDS ── */}
      <SectionButton label="Awards" open={open.awards} onClick={() => setOpen({ ...open, awards: !open.awards })} />
      {open.awards && (
        <div style={{ marginBottom: 14 }}>
          {AWARDS.map(award=>{
            const won = s.awardsWon.includes(award.id);
            const eligible = s.fame>=award.fameReq && s.rep>=award.repReq;
            return (
              <div key={award.id} className="award-card" style={{opacity:!won&&!eligible?0.4:1,borderColor:won?"var(--gold)":"var(--border)"}}>
                <div className="award-icon">{won?"🏆":eligible?"⭐":"🔒"}</div>
                <div className="award-info">
                  <div className="award-name" style={{color:won?"var(--gold)":eligible?"var(--amber)":"var(--text)"}}>{award.name}</div>
                  <div className="award-desc">{award.desc}</div>
                  {won ? <span className="tag t-gold" style={{marginTop:4,display:"inline-block"}}>Won!</span> :
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",marginTop:4}}>
                      Req: Fame {award.fameReq} · Rep {award.repReq}
                    </div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ARCHIVES, COLLABS, PRESS ── */}
      {archive.length > 0 && (
        <>
          <SectionButton label="The Nashville Times Archive" open={open.archive} onClick={() => setOpen({ ...open, archive: !open.archive })} />
          {open.archive && (
            <div style={{ marginBottom: 14, display:"flex",flexDirection:"column",gap:6 }}>
              {archive.map((a,i)=>(
                <button key={i} onClick={()=>openArchivedNewspaper(a.json)}
                  style={{ textAlign:"left", padding:"10px 12px", background:"#f4ecdb", color:"#2a2419", border:"1px solid #2a2419", borderRadius:4, cursor:"pointer", fontFamily:"var(--font)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline", fontFamily:"var(--mono)",fontSize:9,color:"#6b5a3e", borderBottom:"1px solid #c8b89a",paddingBottom:4,marginBottom:4 }}>
                    <span style={{fontFamily:"var(--head)",fontStyle:"italic",fontSize:12,fontWeight:800,color:"#2a2419"}}>The Nashville Times</span>
                    <span>Wk {a.week} · Vol. {a.volume}, No. {a.issue}</span>
                  </div>
                  <div style={{ fontFamily:"var(--head)",fontWeight:800,fontSize:12,lineHeight:1.25,color:"#2a2419", display:"-webkit-box",WebkitBoxOrient:"vertical" as any,WebkitLineClamp:2 as any, overflow:"hidden" }}>
                    {a.lead}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {(s.guestCredits?.length ?? 0) > 0 && (
        <>
          <SectionButton label="Recent Collaborations" open={open.collabs} onClick={() => setOpen({ ...open, collabs: !open.collabs })} />
          {open.collabs && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginBottom:6, fontStyle:"italic" }}>
                Tracks you guested on. Repeated collabs build a working relationship.
              </div>
              {s.guestCredits.slice(0, 6).map((g, i) => {
                const f = FEATURES.find(x => x.id === g.featureId);
                const theme = getTheme(g.themeId);
                const workCount = s.featureWorkCounts?.[g.featureId] ?? 0;
                return (
                  <div key={i} style={{padding:"9px 12px", marginBottom:6, background:"var(--bg3)", border:"1px solid var(--border)", borderLeft:"3px solid var(--gold)", borderRadius:7 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
                      <div style={{ fontFamily:"var(--head)", fontStyle:"italic", fontSize:13, fontWeight:700, color:"var(--text)", lineHeight:1.2 }}>
                        "{g.trackTitle}"
                      </div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--gold)", fontWeight:700, flexShrink:0 }}>
                        +{fmtMoney(g.fee)}
                      </div>
                    </div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:2 }}>
                      with <span style={{ color:"var(--amber)" }}>{g.artistName}</span>
                      {theme && <> · {theme.icon} {theme.name.toLowerCase()}</>}
                      {f && <> · {f.city}</>}
                      <> · Wk {g.week}</>
                    </div>
                    {workCount >= 2 && (
                      <div style={{ marginTop:4, fontFamily:"var(--mono)", fontSize:8, color:"var(--sage)", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                        ★ {workCount === 2 ? "Worked together" : workCount >= 4 ? "Frequent collaborator" : `${workCount} collabs`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {s.criticReviews.length>0 && (
        <>
          <SectionButton label="Press Coverage" open={open.press} onClick={() => setOpen({ ...open, press: !open.press })} />
          {open.press && (
            <div style={{ marginBottom: 14 }}>
              {[...s.criticReviews].reverse().slice(0,5).map((r,i)=>(
                <div key={i} style={{padding:"9px 12px",background:"var(--bg3)",borderRadius:7,border:"1px solid var(--border)",marginBottom:6}}>
                  <div style={{fontFamily:"var(--head)",fontSize:13,fontStyle:"italic",marginBottom:2}}>"{r.headline}"</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)"}}>— re: {r.title} · Q{r.score} · Wk{r.week}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── STATS ── */}
      <SectionButton label="Career Stats" open={open.stats} onClick={() => setOpen({ ...open, stats: !open.stats })} />
      {open.stats && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"Total Earned", val:fmtMoney(s.totalEarned)},
              {label:"Total Streams",val:fmt(s.totalStreams)},
              {label:"Total Shows",  val:String(s.totalShows)},
              {label:"Releases",     val:String(s.totalReleases)},
              {label:"Superfans",    val:fmt(s.superfans ?? 0)},
              {label:"Casual Fans",  val:fmt(Math.max(0, s.fans - (s.superfans ?? 0)))},
              {label:"Wks Active",   val:String(s.week)},
              {label:"Quality Base", val:Math.floor(s.qualityBase)+"/95"},
            ].map(st=>(
              <div key={st.label} className="bigstat">
                <div className="bigstat-num" style={{fontSize:18}}>{st.val}</div>
                <div className="bigstat-lbl">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GENRE SWITCH ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--amber)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Genre
        </div>
        <div style={{fontSize:12,color:"var(--muted2)",marginBottom:8,lineHeight:1.6}}>
          Currently making <span style={{color:"var(--amber)",fontWeight:700}}>{s.genre}</span> music.
          Switching costs 10 rep.
        </div>
        <div style={{display:"flex",gap:8}}>
          {(["Country","Blues"] as Genre[]).map(g=>(
            <button key={g} className={`btn btn-sm${g===s.genre?" btn-lime":""}`}
              disabled={g===s.genre}
              onClick={()=>doSwitchGenre(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── WARDROBE / ERA ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--amber)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Image & Era
        </div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10, lineHeight: 1.6 }}>
          Your look shapes how fans react when you release. A sudden pivot can feel like growth or a sellout — consistency earns respect.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
          {WARDROBE_STYLES.map(w => {
            const sel = s.currentWardrobe === w.id;
            return (
              <button key={w.id} onClick={() => doSetWardrobe(w.id)}
                style={{
                  padding: "9px 8px", borderRadius: 7, cursor: "pointer", textAlign: "center",
                  border: `1px solid ${sel ? "var(--amber)" : "var(--border")}`,
                  background: sel ? "var(--amber-d)" : "var(--bg3)",
                  color: sel ? "var(--amber)" : "var(--text)",
                  fontFamily: "var(--mono)", fontSize: 10, transition: "all .12s",
                }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{w.icon}</div>
                <div style={{ fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 3, lineHeight: 1.3 }}>
                  {w.desc}
                </div>
              </button>
            );
          })}
        </div>
        {s.wardrobeHistory && s.wardrobeHistory.length > 0 && (
          <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted2)" }}>
            Era history: {s.wardrobeHistory.map(id => getWardrobe(id)?.icon).join(" → ")}
          </div>
        )}
      </div>

      {/* ── WELLBEING ── */}
      <SectionButton label="Wellbeing & Recovery" open={open.wellbeing} onClick={() => setOpen({ ...open, wellbeing: !open.wellbeing })} />
      {open.wellbeing && (
        <div className="card" style={{ marginBottom: 14 }}>
          {(() => {
            const b = s.burnout ?? 0;
            const tier = getBurnoutTier(b);
            const colorVar = tier.color === "sage" ? "var(--sage)" : tier.color === "amber" ? "var(--amber)" : "var(--rust)";
            const cd = s.vacationCooldown ?? 0;
            const canVacation = cd === 0 && s.money >= 3000;
            const reason = cd > 0 ? `${cd}wk cooldown` : s.money < 3000 ? `Need ${fmtMoney(3000)}` : null;
            return (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    Burnout: <span style={{ color: colorVar }}>{Math.floor(b)}</span>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: colorVar, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {tier.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted2)", fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
                  {tier.desc}
                </div>
                <button
                  className="btn btn-sm"
                  style={{ width: "100%" }}
                  disabled={!canVacation}
                  onClick={() => { if (window.confirm(`Take a week off? Costs ${fmtMoney(3000)}, clears most burnout, restores energy. 8wk cooldown.`)) doTakeVacation(); }}>
                  {reason ? `Vacation — ${reason}` : `Take a Vacation · ${fmtMoney(3000)}`}
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* ── RIVALS ── */}
      {(s.rivals?.length ?? 0) > 0 && (
        <>
          <SectionButton label="The Scene (Rivals)" open={open.scene} onClick={() => setOpen({ ...open, scene: !open.scene })} />
          {open.scene && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted2)", fontStyle: "italic", marginBottom: 8 }}>
                Other artists working in your genre. Their fame, fans, and last release — they're competing for the same airplay.
              </div>
              {s.rivals.map(r => {
                const def = RIVALS.find(x => x.id === r.id);
                if (!def) return null;
                const personalityColor = def.personality === "friendly" ? "var(--sage)" : def.personality === "competitive" ? "var(--amber)" : def.personality === "hostile" ? "var(--rust)" : "var(--muted2)";
                const weeksAgo = r.lastReleaseWeek > 0 ? s.week - r.lastReleaseWeek : null;
                return (
                  <div key={r.id} style={{ padding: "10px 12px", marginBottom: 6, background: "var(--bg3)", border: "1px solid var(--border)", borderLeft: `3px solid ${personalityColor}`, borderRadius: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontFamily: "var(--head)", fontStyle: "italic", fontWeight: 700, fontSize: 13 }}>
                          {def.name}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: personalityColor, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
                          {def.archetype} · {def.personality}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted2)" }}>
                        <div>fame {Math.floor(r.fame)}</div>
                        <div>{fmt(r.fans)} fans</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", fontStyle: "italic", lineHeight: 1.5, marginBottom: 4 }}>
                      {def.bio}
                    </div>
                    {r.lastReleaseTitle && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text2)", marginTop: 4 }}>
                        Last drop: <span style={{ color: "var(--amber)" }}>"{r.lastReleaseTitle}"</span>
                        <span style={{ color: "var(--muted2)" }}>
                          {" · "}Q{Math.floor(r.lastReleaseQuality)}
                          {weeksAgo !== null && <> · {weeksAgo}wk ago</>}
                        </span>
                      </div>
                    )}
                    {r.awardsWon > 0 && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--gold)", marginTop: 3 }}>
                        🏆 {r.awardsWon} award{r.awardsWon === 1 ? "" : "s"}
                      </div>
                    )}
                    {r.beefHeat > 30 && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--rust)", marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        ⚠ Beef heat {Math.floor(r.beefHeat)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── DANGER ZONE ── */}
      <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border2)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--danger)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>
          Danger Zone
        </div>
        <div className="card" style={{borderColor:"var(--danger)"}}>
          <div style={{fontSize:12,color:"var(--muted2)",marginBottom:10,lineHeight:1.5}}>
            Wipe your save and start a brand-new career from week one. Your current run will be permanently deleted.
          </div>
          <button
            className="btn btn-danger btn-sm"
            style={{width:"100%"}}
            onClick={handleResetSave}
          >
            Reset Save & Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
