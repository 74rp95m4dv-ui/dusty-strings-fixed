import { useState } from "react";
import { fmtMoney, fmt, PRODUCERS, FEATURES, STUDIOS, THEMES, getTheme, getSignatureTheme, PRODUCER_THEMES, getProducerRelationship, getProducerEffectiveCost, getFeatureRelationship, getFeatureEffectiveCost, genTrackName, genAlbumName, ReleaseType, clamp, HOOKS, LYRICS, getHook, getLyric, HookStyle, LyricStyle, ArtworkBudget, ARTWORK_TIERS, getArtworkTier } from "@/game/gameLogic";
import { useGameState } from "@/game/useGameState";

function satInfo(sat: number): { label: string; color: string; barColor: string; note: string } {
  if (sat >= 90) return { label:"BURNED OUT",      color:"#c0442c", barColor:"#c0442c", note:"You cannot release. The market needs time to breathe. Lay low or wait." };
  if (sat >= 75) return { label:"Overexposed",     color:"#d4672a", barColor:"#d4672a", note:"Heavy penalty on all releases. No Viral possible. Let demand recover." };
  if (sat >= 60) return { label:"Saturated",       color:"#d4952a", barColor:"#d4952a", note:"Reduced streams, fan gains, and revenue on new releases." };
  if (sat >= 40) return { label:"Gaining Momentum",color:"#b0a060", barColor:"#b0a060", note:"Still healthy — release soon before the market softens." };
  return           { label:"Fresh",               color:"var(--sage)", barColor:"var(--sage)", note:"Market is hungry. Full returns on your next release." };
}

function SaturationMeter({ sat }: { sat: number }) {
  const info = satInfo(sat);
  return (
    <div style={{ marginBottom:14, padding:"10px 12px", background:"var(--bg3)", borderRadius:8, border:`1px solid ${info.color}44` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--muted2)" }}>
          Market Saturation
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, fontWeight:700, color: info.color }}>
            {info.label}
          </span>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--muted2)" }}>
            {Math.round(sat)}/100
          </span>
        </div>
      </div>
      <div style={{ height:6, background:"var(--bg5)", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
        <div style={{ height:"100%", width:`${sat}%`, background: info.barColor, borderRadius:3, transition:"width .4s ease" }} />
      </div>
      <div style={{ fontSize:10, color:"var(--muted2)", lineHeight:1.4 }}>{info.note}</div>
    </div>
  );
}

interface Props { gs: ReturnType<typeof useGameState>; }

const RELEASE_TYPES: { type: ReleaseType; tracks: string; weeks: string; drainPerWk: number }[] = [
  { type:"Single",    tracks:"1 track",     weeks:"~3 wks",  drainPerWk:8  },
  { type:"EP",        tracks:"3–6 tracks",  weeks:"~8 wks",  drainPerWk:10 },
  { type:"Album",     tracks:"8–16 tracks", weeks:"~18 wks", drainPerWk:12 },
  { type:"Live Album",tracks:"4–8 tracks",  weeks:"~6 wks",  drainPerWk:7  },
];

const TIER_LABEL = ["","Indie","Mid-Level","Elite"];

export default function StudioTab({ gs }: Props) {
  const { state, doStartProject, doUpdateProject, doAddTrack, doRemoveTrack,
          doFinishProject, doScrubProject, doReleaseProject, doDeleteUnreleased,
          doTakeStudioBreak, doPushThrough, doCancelStudioChoice, doSetArtworkBudget } = gs;
  const s = state;
  const [view, setView]           = useState<"project"|"releases"|"discography"|"roster">("project");
  const [rosterSection, setRosterSection] = useState<"producers"|"features">("producers");
  const [trackInput, setTrackInput] = useState("");
  const [selectedFeatId, setSelectedFeatId] = useState("");
  const [hookChoice, setHookChoice]   = useState<HookStyle>("catchy");
  const [lyricChoice, setLyricChoice] = useState<LyricStyle>("heartfelt");
  // Co-writer is mutually exclusive with feature on the same track. Tracked
  // here in the picker; cleared when a feature is selected.
  const [cowriterId, setCowriterId]   = useState("");

  function resetTrackInputs() {
    setTrackInput(""); setSelectedFeatId(""); setCowriterId("");
    // Hook/lyric persist between tracks so a player can quickly stack a
    // consistent palette across an album without re-clicking every time.
  }
  function buildTrackOpts() {
    return {
      featId: selectedFeatId || undefined,
      cowriterId: selectedFeatId ? undefined : (cowriterId || undefined),
      hook: hookChoice,
      lyric: lyricChoice,
    };
  }

  const prod       = PRODUCERS.find(p => p.id === s.project?.producerId);
  const availProds = PRODUCERS.filter(p => p.genres.includes(s.genre) && s.rep >= p.repReq && s.fans >= p.fanReq);
  const allProds   = PRODUCERS.filter(p => p.genres.includes(s.genre));
  const allFeats   = FEATURES.filter(f => f.genres.includes(s.genre));
  const availFeats = allFeats.filter(f => s.fame >= f.fameR && s.rep >= f.repR && s.fans >= f.fanR);
  const studio     = STUDIOS.find(st => st.id === (s.project?.studioId ?? "home_studio"));
  const availStudios = STUDIOS.filter(st => s.rep >= st.repReq && s.fans >= st.fanReq);
  const projectWeeks = s.project?.totalWeeks ?? 1;

  function canUnlock(f: typeof FEATURES[0]) {
    return s.fame >= f.fameR && s.rep >= f.repR && s.fans >= f.fanR;
  }
  function canUnlockP(p: typeof PRODUCERS[0]) {
    return s.rep >= p.repReq && s.fans >= p.fanReq;
  }

  const VIEWS = [
    { id:"project" as const,     label: s.project ? "● Recording" : "Record" },
    { id:"releases" as const,    label: s.unreleased.length > 0 ? `Release (${s.unreleased.length})` : "Release" },
    { id:"discography" as const, label: "History" },
    { id:"roster" as const,      label: "Producers" },
  ];

  return (
    <div style={{ padding:"16px 16px 100px" }}>

      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:16, background:"var(--bg3)", borderRadius:8, padding:3 }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{ flex:1, padding:"7px 3px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10,
              fontFamily:"var(--mono)", textTransform:"uppercase", letterSpacing:"0.05em",
              background: view===v.id ? "var(--bg2)" : "transparent",
              color: view===v.id ? "var(--amber)" : "var(--muted2)",
              fontWeight: view===v.id ? 700 : 400, transition:"all .13s" }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── STUDIO / PROJECT ── */}
      {view === "project" && (
        <>
          {!s.project ? (
            <>
              <div className="pg-title">Recording Studio</div>
              <div className="pg-sub">Choose what to record next.</div>
              <SaturationMeter sat={s.marketSaturation ?? 0} />
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                {RELEASE_TYPES.map(rt => (
                  <button key={rt.type} className="pick-card" onClick={() => doStartProject(rt.type)}
                    style={{ textAlign:"left" }}>
                    <div className="pick-name" style={{ fontFamily:"var(--head)", fontStyle:"italic" }}>{rt.type}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--muted2)", marginTop:3, display:"flex", gap:10 }}>
                      <span>{rt.tracks}</span><span>·</span><span>{rt.weeks}</span>
                      <span>·</span>
                      <span style={{ color:"var(--amber)" }}>
                        {rt.drainPerWk} energy/wk
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop:14, fontFamily:"var(--mono)", fontSize:10, width:"100%" }}
                onClick={() => setView("roster")}>
                Browse Producers & Feature Artists →
              </button>
            </>
          ) : (
            <>
              <div className="pg-title">Recording: {s.project.title}</div>
              <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                <span className="tag t-lime">{s.project.type}</span>
                <span className="tag t-gray">{s.project.genre}</span>
                <span className="tag t-gray">
                  {s.project.weeksLeft > 0
                    ? `Wk ${(s.project.totalWeeks - s.project.weeksLeft) + 1} of ${s.project.totalWeeks}`
                    : "Ready to finish!"}
                </span>
                {(() => {
                  const th = getTheme(s.project?.themeId);
                  return th ? <span className="tag t-purple">{th.icon} {th.name}</span> : null;
                })()}
              </div>

              {/* Exhaustion warning banner */}
              {(() => {
                if (s.project.weeksLeft <= 0) return null;
                const recEnergy: Record<string, number> = { Single:8, EP:10, Album:12, "Live Album":7 };
                const drain = recEnergy[s.project.type] ?? 10;
                const isExhausted = (s.energy ?? 0) < drain;
                const onBreak = s.project.studioBreakThisWeek;
                const pushing = s.project.pushThroughThisWeek;
                if (!isExhausted && !onBreak && !pushing) return null;
                return (
                  <div style={{
                    marginBottom:12, padding:"10px 12px", borderRadius:8,
                    background: onBreak ? "rgba(100,140,90,0.14)" : pushing ? "rgba(189,98,57,0.14)" : "rgba(180,80,60,0.14)",
                    border: onBreak ? "1px solid var(--sage)" : pushing ? "1px solid var(--rust)" : "1px solid #c0442c88",
                  }}>
                    {onBreak && (
                      <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--sage)", fontWeight:700 }}>
                        ☕ Studio break scheduled — you'll skip this week's session and recover energy.
                      </div>
                    )}
                    {pushing && !onBreak && (
                      <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--rust)", fontWeight:700 }}>
                        ⚡ Pushing through — recording anyway. Expect heavy burnout and a quality hit.
                      </div>
                    )}
                    {!onBreak && !pushing && (
                      <>
                        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#e05050", fontWeight:700, marginBottom:6 }}>
                          ⚠ Too exhausted to record ({s.energy ?? 0}/{drain} energy needed)
                        </div>
                        <div style={{ fontSize:10, color:"var(--muted2)", marginBottom:8, lineHeight:1.4 }}>
                          Without a choice, this week's session will stall automatically. Pick an option:
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button className="btn btn-sm" style={{ flex:1, background:"rgba(100,140,90,0.22)", border:"1px solid var(--sage)", color:"var(--sage)", fontFamily:"var(--mono)", fontSize:10 }}
                            onClick={doTakeStudioBreak}>
                            ☕ Take a Studio Break
                          </button>
                          <button className="btn btn-sm" style={{ flex:1, background:"rgba(189,98,57,0.18)", border:"1px solid var(--rust)", color:"var(--rust)", fontFamily:"var(--mono)", fontSize:10 }}
                            onClick={doPushThrough}>
                            ⚡ Push Through (−quality, +burnout)
                          </button>
                        </div>
                      </>
                    )}
                    {(onBreak || pushing) && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop:6, fontFamily:"var(--mono)", fontSize:9, width:"100%" }}
                        onClick={doCancelStudioChoice}>
                        ← Change choice
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Identity / Trend banner */}
              {(() => {
                const sig = getSignatureTheme(s.themeCounts);
                const trend = getTheme(s.currentTrendTheme);
                if (!sig && !trend) return null;
                return (
                  <div style={{
                    display:"flex", flexDirection:"column", gap:6, marginBottom:12,
                    padding:"9px 11px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8,
                  }}>
                    {sig && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:16 }}>{sig.theme.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"var(--amber)" }}>
                            {sig.label}
                          </div>
                          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                            {sig.count} release{sig.count!==1?"s":""} · matching themes get +{Math.round((sig.scoreMult-1)*100)}% impact, +{Math.round((sig.fanMult-1)*100)}% fans
                          </div>
                        </div>
                      </div>
                    )}
                    {trend && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:16 }}>🔥</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"var(--rust)" }}>
                            Nashville is into {trend.name.toLowerCase()} songs right now
                          </div>
                          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                            On-trend releases get +{Math.round((1.12-1)*100)}% impact, +{Math.round((1.08-1)*100)}% fans
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Title */}
              <div className="field">
                <label>Title</label>
                <input type="text" value={s.project.title}
                  onChange={e => doUpdateProject({ title: e.target.value })} />
                <button className="btn btn-ghost btn-sm" style={{ marginTop:4 }}
                  onClick={() => doUpdateProject({ title: genAlbumName(s.artistName) })}>
                  Generate Title
                </button>
              </div>

              {/* Theme */}
              <div className="sec-div">
                Album Theme
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginLeft:8, fontWeight:400 }}>
                  optional · shapes your identity
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:6 }}>
                {(() => {
                  const sigId = getSignatureTheme(s.themeCounts)?.themeId ?? null;
                  const trendId = s.currentTrendTheme ?? null;
                  const noneSelected = !s.project?.themeId;
                  return (
                    <>
                      <div
                        onClick={() => doUpdateProject({ themeId: undefined })}
                        style={{
                          padding:"8px 10px", borderRadius:7, cursor:"pointer",
                          border:`1px solid ${noneSelected ? "var(--amber)" : "var(--border)"}`,
                          background: noneSelected ? "var(--amber-d)" : "var(--bg3)",
                          transition:"all .13s",
                        }}>
                        <div style={{ fontSize:11, fontWeight:700, color: noneSelected ? "var(--amber)" : "var(--text)" }}>
                          No theme
                        </div>
                        <div style={{ fontSize:9, color:"var(--muted2)", marginTop:2, lineHeight:1.3 }}>
                          A grab-bag — no identity bonus.
                        </div>
                      </div>
                      {THEMES.map(t => {
                        const sel = s.project?.themeId === t.id;
                        const isSig = t.id === sigId;
                        const isTrend = t.id === trendId;
                        const count = s.themeCounts?.[t.id] ?? 0;
                        return (
                          <div key={t.id}
                            onClick={() => doUpdateProject({ themeId: t.id })}
                            style={{
                              padding:"8px 10px", borderRadius:7, cursor:"pointer",
                              border:`1px solid ${sel ? "var(--amber)" : isSig ? "var(--amber)" : isTrend ? "var(--rust)" : "var(--border)"}`,
                              background: sel ? "var(--amber-d)" : "var(--bg3)",
                              transition:"all .13s", position:"relative",
                            }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                              <div style={{ fontSize:11, fontWeight:700, color: sel ? "var(--amber)" : "var(--text)" }}>
                                {t.icon} {t.name}
                              </div>
                              <div style={{ display:"flex", gap:3 }}>
                                {isSig &&   <span style={{ fontFamily:"var(--mono)", fontSize:8, padding:"1px 4px", background:"rgba(212,168,32,0.18)", color:"var(--amber)", borderRadius:3 }}>SIG</span>}
                                {isTrend && <span style={{ fontFamily:"var(--mono)", fontSize:8, padding:"1px 4px", background:"rgba(189,98,57,0.18)", color:"var(--rust)", borderRadius:3 }}>HOT</span>}
                              </div>
                            </div>
                            <div style={{ fontSize:9, color:"var(--muted2)", marginTop:2, lineHeight:1.3 }}>
                              {t.blurb}
                            </div>
                            {count > 0 && (
                              <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--muted2)", marginTop:3 }}>
                                {count} release{count!==1?"s":""}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>

              {/* Producer */}
              <div className="sec-div">
                Producer
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginLeft:8, fontWeight:400 }}>
                  {availProds.length} available
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {availProds.map(p => {
                  const selected = s.project?.producerId === p.id;
                  const rel = getProducerRelationship(p.id, s.producerWorkCounts);
                  const effCost = getProducerEffectiveCost(p, s.producerWorkCounts);
                  const prodThemes = PRODUCER_THEMES[p.id] ?? [];
                  const themeMatch = !!s.project?.themeId && prodThemes.includes(s.project.themeId);
                  return (
                    <div key={p.id}
                      className={`pick-card${selected ? " sel" : ""}`}
                      onClick={() => doUpdateProject({ producerId: p.id })}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="pick-name" style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                            {p.name}
                            {rel.tier > 0 && (
                              <span style={{ fontFamily:"var(--mono)", fontSize:8, padding:"1px 5px", background:"rgba(212,168,32,0.18)", color:"var(--amber)", borderRadius:3, letterSpacing:0.4, textTransform:"uppercase" }}>
                                {rel.tier === 3 ? "★★★" : rel.tier === 2 ? "★★" : "★"}
                              </span>
                            )}
                            {themeMatch && (
                              <span style={{ fontFamily:"var(--mono)", fontSize:8, padding:"1px 5px", background:"rgba(106,141,90,0.22)", color:"var(--sage)", borderRadius:3, letterSpacing:0.4, textTransform:"uppercase" }}>
                                fits theme
                              </span>
                            )}
                          </div>
                          <div className="pick-meta" style={{ marginTop:1 }}>
                            {p.tier > 0 ? `Tier ${p.tier} · ` : ""}{p.specialty} · +{p.qB + (rel.qBonus ?? 0) + (themeMatch ? 4 : 0)} quality
                            {rel.tier > 0 && <span style={{ color:"var(--amber)" }}> · {rel.label.toLowerCase()} ({rel.count} project{rel.count!==1?"s":""})</span>}
                          </div>
                          {prodThemes.length > 0 && (
                            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:2 }}>
                              Best with: {prodThemes.map(tid => {
                                const t = THEMES.find(x => x.id === tid);
                                return t ? `${t.icon} ${t.name.toLowerCase()}` : tid;
                              }).join(" · ")}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                          {effCost < p.cost && p.cost > 0 ? (
                            <>
                              <div style={{ fontFamily:"var(--mono)", fontSize:9, color: selected ? "var(--bg)" : "var(--muted2)", textDecoration:"line-through", opacity:0.7 }}>
                                {fmtMoney(p.cost)}
                              </div>
                              <div style={{ fontFamily:"var(--mono)", fontSize:11, color: selected ? "var(--bg)" : "var(--sage)", fontWeight:700 }}>
                                {fmtMoney(effCost)}
                              </div>
                              <div style={{ fontFamily:"var(--mono)", fontSize:8, color: selected ? "var(--bg)" : "var(--muted2)" }}>
                                −{Math.round(rel.discountPct*100)}% friend
                              </div>
                            </>
                          ) : (
                            <div style={{ fontFamily:"var(--mono)", fontSize:11, color: selected ? "var(--bg)" : "var(--amber)", fontWeight:700 }}>
                              {p.cost > 0 ? fmtMoney(p.cost) : "Free"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pick-bio">{p.bio}</div>
                    </div>
                  );
                })}
                {availProds.length < allProds.length && (
                  <div style={{ fontSize:10, color:"var(--muted)", fontStyle:"italic", textAlign:"center", padding:"6px 0" }}>
                    {allProds.length - availProds.length} more producer{allProds.length - availProds.length > 1 ? "s" : ""} locked — see Roster tab
                  </div>
                )}
              </div>

              {/* Studio */}
              <div className="sec-div">
                Studio
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginLeft:8, fontWeight:400 }}>
                  {availStudios.length} available · {projectWeeks}wk session
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {availStudios.map(st => {
                  const selected = (s.project?.studioId ?? "home_studio") === st.id;
                  const totalFee = st.perWeek * projectWeeks;
                  return (
                    <div key={st.id}
                      className={`pick-card${selected ? " sel" : ""}`}
                      onClick={() => doUpdateProject({ studioId: st.id })}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{flex:1, minWidth:0}}>
                          <div className="pick-name" style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                            {st.name}
                            {st.real && <span style={{fontSize:8, padding:"1px 5px", background:"rgba(212,168,32,0.15)", color:"var(--amber)", borderRadius:3, letterSpacing:0.6, fontFamily:"var(--mono)", textTransform:"uppercase"}}>real</span>}
                          </div>
                          <div className="pick-meta" style={{ marginTop:1 }}>
                            {st.tier > 0 ? `Tier ${st.tier} · ` : ""}{st.city} · {st.vibe} · +{st.qB} quality
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                          <div style={{ fontFamily:"var(--mono)", fontSize:11, color: selected ? "var(--bg)" : "var(--amber)", fontWeight:700 }}>
                            {st.perWeek > 0 ? `${fmtMoney(st.perWeek)}/wk` : "Free"}
                          </div>
                          {st.perWeek > 0 && (
                            <div style={{ fontFamily:"var(--mono)", fontSize:9, color: selected ? "var(--bg)" : "var(--muted2)", opacity:0.8 }}>
                              ≈ {fmtMoney(totalFee)} total
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pick-bio">{st.bio}</div>
                    </div>
                  );
                })}
                {availStudios.length < STUDIOS.length && (
                  <div style={{ fontSize:10, color:"var(--muted)", fontStyle:"italic", textAlign:"center", padding:"6px 0" }}>
                    {STUDIOS.length - availStudios.length} more studio{STUDIOS.length - availStudios.length > 1 ? "s" : ""} locked behind rep/fans
                  </div>
                )}
              </div>

              {/* Tracks */}
              <div className="sec-div">
                Tracks ({s.project.tracks.length}/{s.project.maxTracks})
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginLeft:8, fontWeight:400 }}>
                  min {s.project.minTracks}
                </span>
              </div>
              {s.project.tracks.map((t, i) => {
                const hk = getHook(t.hook);
                const ly = getLyric(t.lyric);
                const cw = t.cowriterId ? FEATURES.find(f=>f.id===t.cowriterId) : null;
                const ft = t.featId ? FEATURES.find(f=>f.id===t.featId) : null;
                return (
                  <div key={i} className="track-row" style={{ flexDirection:"column", alignItems:"stretch", padding:"8px 10px", gap:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div className="t-num">{i + 1}</div>
                      <div className="t-name" style={{ flex:1 }}>
                        {t.name}
                        {ft && <span style={{ fontSize:10, color:"var(--rust)", marginLeft:5 }}>ft. {ft.name}</span>}
                        {cw && <span style={{ fontSize:10, color:"var(--sage)", marginLeft:5 }}>w/ {cw.name}</span>}
                      </div>
                      <button className="t-del" onClick={() => doRemoveTrack(i)}>×</button>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingLeft:28, fontFamily:"var(--mono)", fontSize:9 }}>
                      {hk && (
                        <span title={hk.blurb} style={{ padding:"1px 6px", background:"var(--bg5)", borderRadius:3, color:"var(--muted2)" }}>
                          {hk.icon} {hk.name}
                        </span>
                      )}
                      {ly && (
                        <span title={ly.blurb} style={{ padding:"1px 6px", background:"var(--bg5)", borderRadius:3, color:"var(--muted2)" }}>
                          {ly.icon} {ly.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {s.project.tracks.length < s.project.maxTracks && (
                <>
                  {/* ── SONGWRITING PANEL ──
                      Per-track creative choices: hook style + lyric depth, plus
                      either a paid feature OR a free co-writer (mutually
                      exclusive). Hook/lyric persist between tracks for fast
                      album building; co-writer/feature reset per track. */}
                  <div style={{ marginTop:12, padding:"12px", background:"var(--bg3)", borderRadius:8, border:"1px solid var(--border)" }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--amber)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
                      ✎ Write New Track
                    </div>

                    {/* Track name input */}
                    <div style={{ display:"flex", gap:6 }}>
                      <input type="text" placeholder="Track name…" value={trackInput}
                        onChange={e => setTrackInput(e.target.value)}
                        style={{ flex:1 }}
                        onKeyDown={e => {
                          if (e.key === "Enter" && trackInput.trim()) {
                            doAddTrack(trackInput.trim(), buildTrackOpts());
                            resetTrackInputs();
                          }
                        }}
                      />
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => { doAddTrack(genTrackName(), buildTrackOpts()); resetTrackInputs(); }}>
                        Auto
                      </button>
                      <button className="btn btn-sm btn-lime"
                        onClick={() => { if (trackInput.trim()) { doAddTrack(trackInput.trim(), buildTrackOpts()); resetTrackInputs(); } }}
                        disabled={!trackInput.trim()}>
                        +
                      </button>
                    </div>

                    {/* Hook picker */}
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>
                        Hook
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
                        {HOOKS.map(h => {
                          const sel = hookChoice === h.id;
                          return (
                            <button key={h.id} onClick={() => setHookChoice(h.id)}
                              style={{
                                padding:"7px 4px", borderRadius:6, cursor:"pointer", textAlign:"center",
                                border: `1px solid ${sel ? "var(--amber)" : "var(--border)"}`,
                                background: sel ? "var(--amber-d)" : "var(--bg2)",
                                color: sel ? "var(--amber)" : "var(--text)",
                                fontFamily:"var(--mono)", fontSize:10, transition:"all .12s",
                              }}>
                              <div style={{ fontSize:14 }}>{h.icon}</div>
                              <div style={{ fontWeight:700, marginTop:2 }}>{h.name}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize:10, color:"var(--muted2)", marginTop:5, fontStyle:"italic", lineHeight:1.4 }}>
                        {getHook(hookChoice)?.blurb}
                      </div>
                    </div>

                    {/* Lyric picker */}
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>
                        Lyric Depth
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
                        {LYRICS.map(l => {
                          const sel = lyricChoice === l.id;
                          return (
                            <button key={l.id} onClick={() => setLyricChoice(l.id)}
                              style={{
                                padding:"7px 4px", borderRadius:6, cursor:"pointer", textAlign:"center",
                                border: `1px solid ${sel ? "var(--sage)" : "var(--border)"}`,
                                background: sel ? "rgba(120,160,110,0.18)" : "var(--bg2)",
                                color: sel ? "var(--sage)" : "var(--text)",
                                fontFamily:"var(--mono)", fontSize:10, transition:"all .12s",
                              }}>
                              <div style={{ fontSize:14 }}>{l.icon}</div>
                              <div style={{ fontWeight:700, marginTop:2 }}>{l.name}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize:10, color:"var(--muted2)", marginTop:5, fontStyle:"italic", lineHeight:1.4 }}>
                        {getLyric(lyricChoice)?.blurb}
                      </div>
                    </div>

                    {/* Co-writer picker (free, mutually exclusive with feature) */}
                    {availFeats.length > 0 && !selectedFeatId && (
                      <div style={{ marginTop:12 }}>
                        <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5, display:"flex", justifyContent:"space-between" }}>
                          <span>Co-writer (free)</span>
                          <span style={{ color:"var(--sage)", textTransform:"none", letterSpacing:0, fontStyle:"italic" }}>
                            +1 quality · 15% fan share · builds relationship
                          </span>
                        </div>
                        <select value={cowriterId} onChange={e => setCowriterId(e.target.value)}
                          style={{ width:"100%", padding:"7px 9px", fontFamily:"var(--mono)", fontSize:11, background:"var(--bg2)", color:"var(--text)", border:"1px solid var(--border)", borderRadius:6 }}>
                          <option value="">— No co-writer —</option>
                          {availFeats.map(f => (
                            <option key={f.id} value={f.id}>{f.name} (Tier {f.tier})</option>
                          ))}
                        </select>
                        {cowriterId && (
                          <div style={{ fontSize:10, color:"var(--muted2)", marginTop:5, fontStyle:"italic" }}>
                            Co-writes count toward feature relationship discounts. They don't appear on the recording, but they shape the song.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature artist cards (paid; mutually exclusive with co-writer) */}
                  {availFeats.length > 0 && !cowriterId && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                        Feature Artist (paid · optional)
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        {/* None option */}
                        <div
                          onClick={() => setSelectedFeatId("")}
                          style={{
                            padding:"8px 10px", borderRadius:7, cursor:"pointer",
                            border: `1px solid ${!selectedFeatId ? "var(--amber)" : "var(--border)"}`,
                            background: !selectedFeatId ? "var(--amber-d)" : "var(--bg3)",
                            transition:"all .13s",
                          }}>
                          <div style={{ fontFamily:"var(--mono)", fontSize:10, color: !selectedFeatId ? "var(--amber)" : "var(--muted2)" }}>
                            None — solo track
                          </div>
                        </div>
                        {availFeats.map(f => {
                          const sel = selectedFeatId === f.id;
                          return (
                            <div key={f.id} onClick={() => setSelectedFeatId(sel ? "" : f.id)}
                              style={{
                                padding:"9px 11px", borderRadius:7, cursor:"pointer",
                                border: `1px solid ${sel ? "var(--rust)" : "var(--border)"}`,
                                background: sel ? "var(--rust-d)" : "var(--bg3)",
                                transition:"all .13s",
                              }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <div style={{ fontSize:12, fontWeight:700, color: sel ? "var(--rust)" : "var(--text)" }}>{f.name}</div>
                                <div style={{ fontFamily:"var(--mono)", fontSize:10, color: sel ? "var(--rust)" : "var(--amber)" }}>
                                  {fmtMoney(f.cost)}
                                </div>
                              </div>
                              <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:3 }}>
                                +{f.qB} quality · +{fmt(f.fB)} fans · Tier {f.tier}
                              </div>
                              <div style={{ fontSize:10, color:"var(--muted2)", fontStyle:"italic", marginTop:3, lineHeight:1.4 }}>
                                {f.bio}
                              </div>
                            </div>
                          );
                        })}
                        {allFeats.length > availFeats.length && (
                          <div style={{ fontSize:10, color:"var(--muted)", fontStyle:"italic", textAlign:"center", padding:"4px 0" }}>
                            {allFeats.length - availFeats.length} more artist{allFeats.length - availFeats.length > 1 ? "s" : ""} locked — see Roster tab
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Marketing */}
              <div className="sec-div">Marketing Budget</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input type="range" min={0} max={10000} step={500}
                  value={s.project.marketingBudget}
                  onChange={e => doUpdateProject({ marketingBudget: parseInt(e.target.value) })}
                  style={{ flex:1 }} />
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--amber)", minWidth:52 }}>
                  {fmtMoney(s.project.marketingBudget)}
                </span>
              </div>
              <div style={{ fontSize:10, color:"var(--muted2)", marginTop:4, fontStyle:"italic" }}>
                More marketing = better reach and lifecycle chances.
              </div>

              {/* Artwork Budget */}
              <div className="sec-div">
                Album Artwork
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginLeft:8, fontWeight:400 }}>
                  affects physical sales
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                {ARTWORK_TIERS.map(tier => {
                  const sel = s.project?.artworkBudget === tier.id;
                  const current = getArtworkTier(s.project?.artworkBudget);
                  const delta = tier.cost - (current?.cost ?? 0);
                  const canAfford = delta <= 0 || s.money >= delta;
                  return (
                    <div key={tier.id}
                      onClick={() => canAfford && doSetArtworkBudget(tier.id)}
                      style={{
                        padding:"9px 11px", borderRadius:7, cursor: canAfford ? "pointer" : "not-allowed",
                        border: `1px solid ${sel ? "var(--amber)" : "var(--border")}`,
                        background: sel ? "var(--amber-d)" : "var(--bg3)",
                        opacity: canAfford ? 1 : 0.45,
                        transition:"all .13s",
                      }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color: sel ? "var(--amber)" : "var(--text)" }}>
                            {tier.name}
                          </div>
                          <div style={{ fontSize:10, color:"var(--muted2)", marginTop:2, lineHeight:1.4 }}>
                            {tier.desc}
                          </div>
                          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:4 }}>
                            +{tier.qualityBonus} quality · ×{tier.physicalSalesMult.toFixed(2)} physical · ×{tier.vinylBoost.toFixed(2)} vinyl
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                          <div style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, color: sel ? "var(--amber)" : "var(--text)" }}>
                            {tier.cost === 0 ? "Free" : fmtMoney(tier.cost)}
                          </div>
                          {delta > 0 && !sel && (
                            <div style={{ fontFamily:"var(--mono)", fontSize:9, color: canAfford ? "var(--sage)" : "var(--rust)" }}>
                              {canAfford ? `+${fmtMoney(delta)}` : `Need ${fmtMoney(delta - s.money)}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ marginTop:14, display:"flex", gap:8 }}>
                {s.project.weeksLeft === 0 ? (
                  <button className="btn btn-lime" style={{ flex:1 }}
                    disabled={s.project.tracks.length < s.project.minTracks}
                    onClick={doFinishProject}>
                    Finish Recording
                  </button>
                ) : (
                  <div style={{ flex:1, padding:"10px", background:"var(--bg3)", borderRadius:7, fontSize:12, color:"var(--muted2)", textAlign:"center", fontStyle:"italic" }}>
                    Recording in progress… {s.project.weeksLeft} week{s.project.weeksLeft !== 1 ? "s" : ""} remaining
                  </div>
                )}
                <button className="btn btn-danger btn-sm" onClick={doScrubProject}>Scrap</button>
              </div>
              {s.project.tracks.length < s.project.minTracks && (
                <div style={{ marginTop:6, fontSize:10, color:"var(--muted2)", textAlign:"center" }}>
                  Need at least {s.project.minTracks} track{s.project.minTracks > 1 ? "s" : ""}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── READY TO RELEASE ── */}
      {view === "releases" && (
        <>
          <div className="pg-title">Ready to Release</div>
          <div className="pg-sub">Music recorded and waiting for you.</div>
          <SaturationMeter sat={s.marketSaturation ?? 0} />
          {s.unreleased.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎵</div>Nothing recorded yet. Head to Studio.</div>
          ) : s.unreleased.map(p => {
            const sat = s.marketSaturation ?? 0;
            const blocked = sat >= 90;
            const satWarn = sat >= 75 ? "Overexposed — heavy penalty" : sat >= 60 ? "Saturated — reduced returns" : null;
            const satAdd = ({Single:20,EP:35,Album:55,"Live Album":28} as Record<string,number>)[p.type] ?? 25;
            const satAfter = Math.min(100, sat + satAdd);
            return (
              <div key={p.id} className="rel-card">
                <div className="rel-hd">
                  <div>
                    <div className="rel-title">{p.title}</div>
                    <div className="rel-meta">{p.type} · {p.genre} · Q{Math.floor(p.avgQuality)}</div>
                  </div>
                  <span className="tag t-lime">Ready</span>
                </div>
                {(() => {
                  const th = getTheme(p.themeId);
                  const sig = getSignatureTheme(s.themeCounts);
                  const isSig = th && sig && th.id === sig.themeId;
                  const isTrend = th && s.currentTrendTheme && th.id === s.currentTrendTheme;
                  if (!th) return null;
                  return (
                    <div style={{ display:"flex", gap:5, marginBottom:6, flexWrap:"wrap" }}>
                      <span className="tag t-purple">{th.icon} {th.name}</span>
                      {isSig &&   <span className="tag t-gold" style={{ fontSize:9 }}>signature</span>}
                      {isTrend && <span className="tag t-red"  style={{ fontSize:9 }}>🔥 on-trend</span>}
                    </div>
                  );
                })()}
                <div style={{ fontSize:11, color:"var(--muted2)", marginBottom:6, fontStyle:"italic" }}>
                  {p.tracks.length} track{p.tracks.length !== 1 ? "s" : ""}
                  {p.marketingBudget > 0 ? ` · ${fmtMoney(p.marketingBudget)} marketing` : ""}
                </div>
                {/* Saturation impact preview */}
                <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginBottom:8 }}>
                  Releasing will raise saturation: <span style={{ color: satAfter>=90?"#c0442c":satAfter>=75?"#d4672a":satAfter>=60?"#d4952a":"var(--text2)", fontWeight:700 }}>
                    {Math.round(sat)} → {Math.round(satAfter)}
                  </span>
                  {satWarn && <span style={{ color:"#d4672a", marginLeft:6 }}>· {satWarn}</span>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-lime" style={{ flex:1, opacity: blocked ? 0.4 : 1, cursor: blocked ? "not-allowed" : "pointer" }}
                    onClick={() => !blocked && doReleaseProject(p.id)}>
                    {blocked ? "Market Burned Out — Wait" : "Release Now"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => doDeleteUnreleased(p.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── DISCOGRAPHY ── */}
      {view === "discography" && (
        <>
          <div className="pg-title">Discography</div>
          <div className="pg-sub">{s.totalReleases} release{s.totalReleases !== 1 ? "s" : ""} total</div>
          {s.discography.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📀</div>No releases yet.</div>
          ) : [...s.discography].reverse().map(r => (
            <div key={r.id} className="rel-card">
              <div className="rel-hd">
                <div>
                  <div className="rel-title">{r.title}</div>
                  <div className="rel-meta">
                    {r.type} · {r.genre} · Wk{r.releasedWeek}
                    {(() => { const th = getTheme(r.themeId); return th ? ` · ${th.icon} ${th.name}` : ""; })()}
                  </div>
                </div>
                <span className={`tag ${r.outcome==="Viral"?"t-gold":r.outcome==="Hit"?"t-lime":r.outcome==="Moderate"?"t-blue":"t-red"}`}>
                  {r.outcome}
                </span>
              </div>
              <div style={{ fontSize:10, color:"var(--muted2)", fontStyle:"italic", marginBottom:6 }}>{r.criticHeadline}</div>
              <div className="rel-stats">
                <span>{fmtMoney(r.revenue)}</span>
                <span>·</span><span>+{fmt(r.fansGained)} fans</span>
                <span>·</span>
                <span className={`tag ${r.lifecycle==="Evergreen"?"t-gold":r.lifecycle==="Hit"?"t-lime":"t-gray"}`}>{r.lifecycle}</span>
                {r.hasMusicVideo && <span className="tag t-purple">MV</span>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── ROSTER ── */}
      {view === "roster" && (
        <>
          <div className="pg-title">Roster</div>
          <div className="pg-sub">Everyone you can work with — and what it takes to unlock them.</div>

          {/* Section toggle */}
          <div style={{ display:"flex", gap:0, marginBottom:14, background:"var(--bg3)", borderRadius:8, padding:3 }}>
            {(["producers","features"] as const).map(sec => (
              <button key={sec} onClick={() => setRosterSection(sec)}
                style={{ flex:1, padding:"7px 4px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11,
                  fontFamily:"var(--mono)", textTransform:"uppercase", letterSpacing:"0.06em",
                  background: rosterSection===sec ? "var(--bg2)" : "transparent",
                  color: rosterSection===sec ? "var(--amber)" : "var(--muted2)",
                  fontWeight: rosterSection===sec ? 700 : 400, transition:"all .13s" }}>
                {sec === "producers" ? `Producers (${allProds.length})` : `Feature Artists (${allFeats.length})`}
              </button>
            ))}
          </div>

          {/* Producers roster */}
          {rosterSection === "producers" && (
            <>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginBottom:8 }}>
                {availProds.length} of {allProds.length} available for {s.genre}
              </div>
              {[0,1,2,3].map(tier => {
                const tierProds = allProds.filter(p => p.tier === tier);
                if (!tierProds.length) return null;
                return (
                  <div key={tier} style={{ marginBottom:16 }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--amber)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
                      {tier === 0 ? "Home Studio" : `Tier ${tier} — ${TIER_LABEL[tier]}`}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {tierProds.map(p => {
                        const unlocked = canUnlockP(p);
                        const rel = getProducerRelationship(p.id, s.producerWorkCounts);
                        const prodThemes = PRODUCER_THEMES[p.id] ?? [];
                        return (
                          <div key={p.id} style={{
                            padding:"11px 13px", borderRadius:9,
                            background: unlocked ? "var(--bg2)" : "var(--bg3)",
                            border: `1px solid ${unlocked ? "var(--border2)" : "var(--border)"}`,
                            opacity: unlocked ? 1 : 0.6,
                          }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                              <div style={{ flex:1 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap" }}>
                                  <span style={{ fontSize:13, fontWeight:700, color: unlocked ? "var(--text)" : "var(--muted2)" }}>{p.name}</span>
                                  {unlocked
                                    ? <span className="tag t-green" style={{ fontSize:8 }}>Available</span>
                                    : <span className="tag t-gray" style={{ fontSize:8 }}>🔒 Locked</span>}
                                  {rel.tier > 0 && (
                                    <span style={{ fontFamily:"var(--mono)", fontSize:8, padding:"1px 5px", background:"rgba(212,168,32,0.18)", color:"var(--amber)", borderRadius:3, letterSpacing:0.4 }}>
                                      {rel.tier === 3 ? "★★★" : rel.tier === 2 ? "★★" : "★"} {rel.label.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                                  {p.specialty} · <span style={{ color:"var(--amber)" }}>+{p.qB + rel.qBonus} quality</span>
                                  {rel.qBonus > 0 && <span style={{ color:"var(--amber)" }}> ({rel.count} project{rel.count!==1?"s":""} together)</span>}
                                </div>
                                {prodThemes.length > 0 && (
                                  <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:2 }}>
                                    Best with: {prodThemes.map(tid => {
                                      const t = THEMES.find(x => x.id === tid);
                                      return t ? `${t.icon} ${t.name.toLowerCase()}` : tid;
                                    }).join(" · ")}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                                {rel.discountPct > 0 && p.cost > 0 ? (
                                  <>
                                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", textDecoration:"line-through", opacity:0.7 }}>
                                      {fmtMoney(p.cost)}
                                    </div>
                                    <div style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:"var(--sage)" }}>
                                      {fmtMoney(getProducerEffectiveCost(p, s.producerWorkCounts))}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:"var(--amber)" }}>
                                    {p.cost > 0 ? fmtMoney(p.cost) : "Free"}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ fontSize:11, color:"var(--muted2)", fontStyle:"italic", lineHeight:1.5, marginTop:5 }}>{p.bio}</div>
                            {!unlocked && (
                              <div style={{ marginTop:6, padding:"5px 8px", background:"var(--bg4)", borderRadius:5, fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                                Requires:
                                {p.repReq > 0 && <span style={{ marginLeft:6 }}>Rep {p.repReq}{s.rep < p.repReq ? ` (you: ${Math.floor(s.rep)})` : " ✓"}</span>}
                                {p.fanReq > 0 && <span style={{ marginLeft:6 }}>Fans {fmt(p.fanReq)}{s.fans < p.fanReq ? ` (you: ${fmt(s.fans)})` : " ✓"}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Feature artists roster */}
          {rosterSection === "features" && (
            <>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginBottom:8 }}>
                {availFeats.length} of {allFeats.length} available for {s.genre}
              </div>
              {[1,2,3,4].map(tier => {
                const tierFeats = allFeats.filter(f => f.tier === tier);
                if (!tierFeats.length) return null;
                const tierColor = tier === 4 ? "var(--gold)" : tier === 3 ? "var(--rust)" : tier === 2 ? "var(--amber)" : "var(--sage)";
                return (
                  <div key={tier} style={{ marginBottom:16 }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:tierColor, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
                      Tier {tier} — {tier === 4 ? "Legend" : TIER_LABEL[tier]}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {tierFeats.map(f => {
                        const unlocked = canUnlock(f);
                        const rel = getFeatureRelationship(f.id, s.featureWorkCounts);
                        const effCost = getFeatureEffectiveCost(f, s.featureWorkCounts, 1);
                        return (
                          <div key={f.id} style={{
                            padding:"11px 13px", borderRadius:9,
                            background: unlocked ? "var(--bg2)" : "var(--bg3)",
                            border: `1px solid ${unlocked ? "var(--border2)" : "var(--border)"}`,
                            opacity: unlocked ? 1 : 0.6,
                          }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                              <div style={{ flex:1 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap" }}>
                                  <span style={{ fontSize:13, fontWeight:700, color: unlocked ? "var(--text)" : "var(--muted2)" }}>{f.name}</span>
                                  {unlocked
                                    ? <span className="tag t-green" style={{ fontSize:8 }}>Available</span>
                                    : <span className="tag t-gray" style={{ fontSize:8 }}>🔒 Locked</span>}
                                  {rel.tier > 0 && (
                                    <span style={{ fontFamily:"var(--mono)", fontSize:8, padding:"1px 5px", background:"rgba(212,168,32,0.18)", color:"var(--gold)", borderRadius:3, letterSpacing:0.4 }}>
                                      {rel.tier === 2 ? "★★" : "★"} {rel.label.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                                  {f.city} · +{f.qB} quality · <span style={{ color:"var(--amber)" }}>+{fmt(f.fB)} fans</span>
                                </div>
                                {f.themePrefs.length > 0 && (
                                  <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", marginTop:2 }}>
                                    Best with: {f.themePrefs.slice(0,3).map(tid => {
                                      const t = THEMES.find(x => x.id === tid);
                                      return t ? `${t.icon} ${t.name.toLowerCase()}` : tid;
                                    }).join(" · ")}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                                {rel.discountPct > 0 ? (
                                  <>
                                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)", textDecoration:"line-through", opacity:0.7 }}>
                                      {fmtMoney(f.cost)}
                                    </div>
                                    <div style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:"var(--sage)" }}>
                                      {fmtMoney(effCost)}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:"var(--rust)" }}>
                                    {fmtMoney(f.cost)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ fontSize:11, color:"var(--muted2)", fontStyle:"italic", lineHeight:1.5, marginTop:5 }}>{f.bio}</div>
                            <div style={{ fontSize:10, color:"var(--muted2)", lineHeight:1.4, marginTop:4, fontFamily:"var(--mono)" }}>
                              <span style={{ color:"var(--muted)" }}>Vibe:</span> {f.vibe}
                            </div>
                            {!unlocked && (
                              <div style={{ marginTop:6, padding:"5px 8px", background:"var(--bg4)", borderRadius:5, fontFamily:"var(--mono)", fontSize:9, color:"var(--muted2)" }}>
                                Requires:
                                {f.fameR > 0 && <span style={{ marginLeft:6 }}>Fame {f.fameR}{s.fame < f.fameR ? ` (you: ${Math.floor(s.fame)})` : " ✓"}</span>}
                                {f.repR  > 0 && <span style={{ marginLeft:6 }}>Rep {f.repR}{s.rep < f.repR ? ` (you: ${Math.floor(s.rep)})` : " ✓"}</span>}
                                {f.fanR  > 0 && <span style={{ marginLeft:6 }}>Fans {fmt(f.fanR)}{s.fans < f.fanR ? ` (you: ${fmt(s.fans)})` : " ✓"}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
