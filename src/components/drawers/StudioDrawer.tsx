import { useState } from "react";
import {
  PRODUCERS, STUDIOS, THEMES, FEATURES, fmtMoney,
  getProducerEffectiveCost, getProducerRelationship,
  getFeatureEffectiveCost, getHook, getLyric,
  computeAlbumWritingMix, genTrackName, genThemedTrackName,
  type ReleaseType, type HookStyle, type LyricStyle,
  calculateRecordingWeeks, getStandardRecordingWeeks,
  RECORDING_MODE_CONFIG, STUDIO_TIME_MODIFIERS,
  type RecordingMode,
} from "../../gameLogic";

export default function StudioDrawer(game: any) {
  const {
    state, doStartProject, doUpdateProject, doAddTrack, doRemoveTrack,
    doFinishProject, doScrubProject, doTakeStudioBreak, doPushThrough,
    doCancelStudioChoice, doAutoGenerateTracks, advance, onClose,
  } = game;

  const [view, setView] = useState<"new" | "project" | null>(state.project ? "project" : "new");

  if (view === "new") return (
    <NewProjectForm
      state={state}
      doStartProject={doStartProject}
      onBack={() => { if (!state.project) onClose(); else setView("project"); }}
      onProjectStarted={() => setView("project")}
    />
  );

  if (state.project && view === "project") return (
    <ActiveProject
      state={state}
      doUpdateProject={doUpdateProject}
      doAddTrack={doAddTrack}
      doRemoveTrack={doRemoveTrack}
      doFinishProject={doFinishProject}
      doScrubProject={doScrubProject}
      doTakeStudioBreak={doTakeStudioBreak}
      doPushThrough={doPushThrough}
      doCancelStudioChoice={doCancelStudioChoice}
      doAutoGenerateTracks={doAutoGenerateTracks}
      advance={advance}
      onBack={() => { if (state.unreleased.length > 0) setView(null); else onClose(); }}
      onClose={onClose}
    />
  );

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Studio</div>
        {!state.project && (
          <button className="btn btn-lime btn-block" onClick={() => setView("new")}>Start New Project</button>
        )}
        {state.project && (
          <button className="btn btn-lime btn-block" onClick={() => setView("project")}>Continue Recording</button>
        )}
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8 }}>Close</button>
      </div>
    </div>
  );
}

function NewProjectForm({ state, doStartProject, onBack, onProjectStarted }: any) {
  const [type, setType] = useState<ReleaseType>("Single");
  const [mode, setMode] = useState<RecordingMode>("standard");
  const mint: Record<string, number> = { Single: 1, EP: 3, Album: 8, "Live Album": 4 };
  const trackCount = mint[type] ?? 1;
  const previewWeeks = calculateRecordingWeeks(type, trackCount, "home_studio", "self", mode);
  const standardWeeks = getStandardRecordingWeeks(type, trackCount, "home_studio", "self");
  const modeCfg = RECORDING_MODE_CONFIG[mode];

  return (
    <div className="drawer-overlay" onClick={onBack}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">New Project</div>
        <div className="g2" style={{ marginBottom: 16 }}>
          {(["Single", "EP", "Album", "Live Album"] as ReleaseType[]).map((t) => (
            <button key={t} className={`btn ${type === t ? "btn-lime" : ""}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Recording Mode</div>
          <div className="g2" style={{ marginBottom: 8 }}>
            {(["standard", "rush", "deliberate"] as RecordingMode[]).map((m) => (
              <button key={m} className={`btn btn-sm ${mode === m ? "btn-lime" : ""}`} onClick={() => setMode(m)}>
                {RECORDING_MODE_CONFIG[m].label}
              </button>
            ))}
          </div>
          <div className="tip-text">
            {mode === "standard" && "Normal pace. Normal cost. Normal quality."}
            {mode === "rush" && "⚡ 50% faster. 1.5× studio cost. −5 quality. +8 burnout."}
            {mode === "deliberate" && "🎯 50% slower. Normal cost. +4 quality. +3 burnout per extra week."}
          </div>
        </div>
        <div className="card-sm" style={{ marginBottom: 16, background: "var(--panel2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="tip-text">Estimated studio time</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--lime)" }}>
              {previewWeeks} week{previewWeeks === 1 ? "" : "s"}
            </span>
          </div>
          {mode !== "standard" && (
            <div className="tip-text" style={{ marginTop: 4 }}>Standard pace: {standardWeeks} week{standardWeeks === 1 ? "" : "s"}</div>
          )}
        </div>
        <button className="btn btn-lime btn-block" onClick={() => { doStartProject(type, mode); onProjectStarted(); }}>
          Start Recording
        </button>
        <button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 8 }}>Back</button>
      </div>
    </div>
  );
}

function ActiveProject({ state, doUpdateProject, doAddTrack, doRemoveTrack, doFinishProject, doScrubProject, doTakeStudioBreak, doPushThrough, doCancelStudioChoice, doAutoGenerateTracks, advance, onBack, onClose }: any) {
  const p = state.project!;
  const [trackName, setTrackName] = useState("");
  const [featId, setFeatId] = useState("");
  const [cowriterId, setCowriterId] = useState("");
  const [hook, setHook] = useState<HookStyle>("safe");
  const [lyric, setLyric] = useState<LyricStyle>("heartfelt");
  const prod = PRODUCERS.find((pr: any) => pr.id === p.producerId);
  const studio = STUDIOS.find((st: any) => st.id === p.studioId);
  const rel = prod ? getProducerRelationship(prod.id, state.producerWorkCounts) : null;
  const modeCfg = RECORDING_MODE_CONFIG[(p.mode ?? "standard") as RecordingMode];
  const canFinish = p.tracks.length >= p.minTracks && p.weeksLeft <= 0;

  const addTrack = () => {
    if (!trackName.trim()) return;
    doAddTrack(trackName.trim(), { featId: featId || undefined, hook, lyric, cowriterId: cowriterId || undefined });
    setTrackName(""); setFeatId(""); setCowriterId(""); setHook("safe"); setLyric("heartfelt");
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">{p.title}</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>
          {p.type} • {p.weeksLeft}wk left • {p.tracks.length} track{p.tracks.length !== 1 ? "s" : ""}
          {p.mode && p.mode !== "standard" && <span style={{ marginLeft: 8, color: p.mode === "rush" ? "var(--amber)" : "var(--sage)" }}>• {modeCfg.label}</span>}
        </div>

        {/* Progress */}
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted2)", marginBottom: 4 }}>
            <span>Progress</span>
            <span>{p.totalWeeks - p.weeksLeft} / {p.totalWeeks} weeks</span>
          </div>
          <div className="sbar-track">
            <div className="sbar-fill f-lime" style={{
              width: `${((p.totalWeeks - p.weeksLeft) / Math.max(1, p.totalWeeks)) * 100}%`,
              background: p.mode === "rush" ? "var(--amber)" : p.mode === "deliberate" ? "var(--sage)" : undefined,
            }} />
          </div>
        </div>

        {/* Producer */}
        <div className="card">
          <div className="card-title">Producer</div>
          <div className="pick-card sel">
            <div>
              <div className="pick-name">{prod?.name ?? "Self"}</div>
              <div className="pick-bio">{prod?.bio ?? "DIY"}</div>
              {rel && rel.tier > 0 && <div className="pick-meta" style={{ color: "var(--sage)" }}>{rel.label} • −{Math.round(rel.discountPct * 100)}% fee</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {PRODUCERS.filter((pr: any) => {
              const cost = getProducerEffectiveCost(pr, state.producerWorkCounts);
              return !(state.money < cost && p.producerId !== pr.id);
            }).map((pr: any) => (
              <button key={pr.id} className={`btn btn-sm ${p.producerId === pr.id ? "btn-lime" : ""}`} onClick={() => doUpdateProject({ producerId: pr.id })}>
                {pr.name} ({fmtMoney(getProducerEffectiveCost(pr, state.producerWorkCounts))})
              </button>
            ))}
          </div>
        </div>

        {/* Studio */}
        <div className="card">
          <div className="card-title">Studio</div>
          <div className="pick-card sel">
            <div>
              <div className="pick-name">{studio?.name ?? "Home Studio"}</div>
              <div className="pick-bio">{studio?.bio ?? "Free, always."}</div>
              {studio && studio.tier > 0 && <div className="pick-meta" style={{ color: "var(--sage)", fontSize: 11 }}>{Math.round((1 - (STUDIO_TIME_MODIFIERS[studio.tier] ?? 1)) * 100)}% faster</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {STUDIOS.filter((st: any) => st.tier <= 2 || (state.fame >= st.repReq && state.fans >= st.fanReq)).map((st: any) => (
              <button key={st.id} className={`btn btn-sm ${p.studioId === st.id ? "btn-lime" : ""}`} onClick={() => doUpdateProject({ studioId: st.id })}>
                {st.name} ({fmtMoney(st.perWeek)}/wk)
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="card">
          <div className="card-title">Album Theme</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {THEMES.map((t: any) => (
              <button key={t.id} className={`btn btn-sm ${p.themeId === t.id ? "btn-lime" : ""}`} onClick={() => doUpdateProject({ themeId: t.id })}>
                {t.icon} {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div className="card-title" style={{ margin: 0 }}>Tracks ({p.tracks.length}/{p.maxTracks})</div>
            {p.tracks.length < p.maxTracks && <button className="btn btn-sm btn-amber" onClick={doAutoGenerateTracks}>✨ Auto-Generate</button>}
          </div>
          {p.tracks.map((t: any, i: number) => (
            <div className="track-row" key={i}>
              <span className="t-num">{i + 1}</span>
              <span className="t-name">{t.name}</span>
              <span className="tip-text">{t.hook} • {t.lyric}</span>
              {t.featId && <span className="t-tag">feat. {FEATURES.find((f: any) => f.id === t.featId)?.name}</span>}
              {t.cowriterId && <span className="t-tag">w/ {FEATURES.find((f: any) => f.id === t.cowriterId)?.name}</span>}
              <button className="btn btn-sm btn-danger" onClick={() => doRemoveTrack(i)}>Remove</button>
            </div>
          ))}
          {p.tracks.length < p.maxTracks && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input type="text" placeholder="Track name..." value={trackName} onChange={(e) => setTrackName(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-sm" onClick={() => setTrackName(p.themeId ? genThemedTrackName(p.themeId) : genTrackName())}>🎲</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {(["safe", "catchy", "experimental"] as HookStyle[]).map((h) => (
                  <button key={h} className={`btn btn-sm ${hook === h ? "btn-lime" : ""}`} onClick={() => setHook(h)}>
                    {getHook(h)?.icon} {getHook(h)?.name}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {(["party", "heartfelt", "literary"] as LyricStyle[]).map((l) => (
                  <button key={l} className={`btn btn-sm ${lyric === l ? "btn-lime" : ""}`} onClick={() => setLyric(l)}>
                    {getLyric(l)?.icon} {getLyric(l)?.name}
                  </button>
                ))}
              </div>
              <select value={featId} onChange={(e) => { setFeatId(e.target.value); setCowriterId(""); }} style={{ marginBottom: 6, width: "100%" }}>
                <option value="">No feature</option>
                {FEATURES.filter((f: any) => f.genres.includes(state.genre) && state.fame >= f.fameR && state.rep >= f.repR && state.fans >= f.fanR).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({fmtMoney(getFeatureEffectiveCost(f, state.featureWorkCounts))})</option>
                ))}
              </select>
              <select value={cowriterId} onChange={(e) => { setCowriterId(e.target.value); setFeatId(""); }} style={{ marginBottom: 6, width: "100%" }}>
                <option value="">No co-writer</option>
                {FEATURES.filter((f: any) => f.genres.includes(state.genre)).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} (FREE)</option>
                ))}
              </select>
              <button className="btn btn-sm btn-lime" onClick={addTrack}>Add Track</button>
            </div>
          )}
        </div>

        {/* Album Mix */}
        {p.tracks.length > 0 && (
          <div className="card-sm" style={{ marginBottom: 10 }}>
            <div className="card-title">Album Mix</div>
            {(() => {
              const mix = computeAlbumWritingMix(p.tracks);
              return (
                <div className="tip-text">
                  Dominant hook: <b>{mix.dominantHook ?? "—"}</b> • Dominant lyric: <b>{mix.dominantLyric ?? "—"}</b><br />
                  Stream mult: {(mix.streamMult * 100).toFixed(0)}% • Fan mult: {(mix.fanMult * 100).toFixed(0)}%<br />
                  Critic bias: {mix.critRepBonus > 0 ? "+" : ""}{mix.critRepBonus}
                </div>
              );
            })()}
          </div>
        )}

        {/* This Week */}
        <div className="card">
          <div className="card-title">This Week</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-sm" onClick={doTakeStudioBreak}>Take Break</button>
            <button className="btn btn-sm" onClick={doPushThrough}>Push Through</button>
            <button className="btn btn-sm btn-ghost" onClick={doCancelStudioChoice}>Cancel</button>
          </div>
          <div className="tip-text" style={{ marginTop: 6 }}>Break = recover energy, no progress. Push = record if exhausted (burnout penalty).</div>
        </div>

        <button className="btn btn-lime btn-block" disabled={!canFinish} onClick={doFinishProject}>Finish Recording</button>
        <button className="btn btn-danger btn-block" onClick={doScrubProject} style={{ marginTop: 6 }}>Scrub Project</button>
        <button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 6 }}>Back</button>
      </div>
    </div>
  );
}
