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

type SettingPicker = "producer" | "studio" | "theme" | null;

export default function StudioDrawer(game: any) {
  const {
    state, doStartProject, doUpdateProject, doAddTrack, doRemoveTrack,
    doFinishProject, doScrubProject, doTakeStudioBreak, doPushThrough,
    doCancelStudioChoice, doAutoGenerateTracks, onClose,
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
      onBack={() => { if (state.unreleased.length > 0) setView(null); else onClose(); }}
      onClose={onClose}
    />
  );

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">Studio</div>
        {!state.project && <button className="btn btn-lime btn-block" onClick={() => setView("new")}>Start New Project</button>}
        {state.project && <button className="btn btn-lime btn-block" onClick={() => setView("project")}>Continue Recording</button>}
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

  return (
    <div className="drawer-overlay" onClick={onBack}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">New Project</div>
        <p className="tip-text studio-intro">Choose the shape and pace. Your release title will be generated when recording begins.</p>
        <div className="studio-choice-grid" aria-label="Release type">
          {(["Single", "EP", "Album", "Live Album"] as ReleaseType[]).map((t) => (
            <button key={t} className={`btn ${type === t ? "btn-lime" : ""}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <div className="studio-section-card">
          <div className="studio-section-eyebrow">Recording pace</div>
          <div className="studio-choice-grid studio-choice-grid--mode">
            {(["standard", "rush", "deliberate"] as RecordingMode[]).map((m) => (
              <button key={m} className={`btn btn-sm ${mode === m ? "btn-lime" : ""}`} onClick={() => setMode(m)}>
                {RECORDING_MODE_CONFIG[m].label}
              </button>
            ))}
          </div>
          <div className="tip-text">
            {mode === "standard" && "Normal pace, cost, and quality."}
            {mode === "rush" && "50% faster, 1.5× studio cost, −5 quality, and +8 burnout."}
            {mode === "deliberate" && "50% slower, +4 quality, and +3 burnout per extra week."}
          </div>
        </div>
        <div className="studio-time-preview">
          <span>Estimated studio time</span>
          <strong>{previewWeeks} week{previewWeeks === 1 ? "" : "s"}</strong>
          {mode !== "standard" && <small>Standard pace: {standardWeeks} week{standardWeeks === 1 ? "" : "s"}</small>}
        </div>
        <button className="btn btn-lime btn-block" onClick={() => { doStartProject(type, mode); onProjectStarted(); }}>Start Recording</button>
        <button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 8 }}>Back</button>
      </div>
    </div>
  );
}

function ActiveProject({ state, doUpdateProject, doAddTrack, doRemoveTrack, doFinishProject, doScrubProject, doTakeStudioBreak, doPushThrough, doCancelStudioChoice, doAutoGenerateTracks, onBack, onClose }: any) {
  const p = state.project!;
  const [trackName, setTrackName] = useState("");
  const [featId, setFeatId] = useState("");
  const [cowriterId, setCowriterId] = useState("");
  const [hook, setHook] = useState<HookStyle>("safe");
  const [lyric, setLyric] = useState<LyricStyle>("heartfelt");
  const [picker, setPicker] = useState<SettingPicker>(null);
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const prod = PRODUCERS.find((pr: any) => pr.id === p.producerId);
  const studio = STUDIOS.find((st: any) => st.id === p.studioId);
  const rel = prod ? getProducerRelationship(prod.id, state.producerWorkCounts) : null;
  const modeCfg = RECORDING_MODE_CONFIG[(p.mode ?? "standard") as RecordingMode];
  const canFinish = p.tracks.length >= p.minTracks && p.weeksLeft <= 0;
  const progress = ((p.totalWeeks - p.weeksLeft) / Math.max(1, p.totalWeeks)) * 100;

  const addTrack = () => {
    if (!trackName.trim()) return;
    doAddTrack(trackName.trim(), { featId: featId || undefined, hook, lyric, cowriterId: cowriterId || undefined });
    setTrackName(""); setFeatId(""); setCowriterId(""); setHook("safe"); setLyric("heartfelt");
  };

  const chooseSetting = (change: any) => {
    doUpdateProject(change);
    setPicker(null);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer studio-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <header className="studio-project-hero">
          <div className="studio-project-kicker">Now recording</div>
          <div className="drawer-title">{p.title}</div>
          <div className="studio-project-meta">
            <span>{p.type}</span><span>{p.tracks.length}/{p.maxTracks} tracks</span><span>{p.weeksLeft}wk left</span>
            {p.mode && p.mode !== "standard" && <span className={`studio-mode studio-mode--${p.mode}`}>{modeCfg.label}</span>}
          </div>
          <div className="studio-progress" aria-label={`${Math.round(progress)}% recording progress`}>
            <div className="studio-progress-label"><span>Recording progress</span><span>{p.totalWeeks - p.weeksLeft}/{p.totalWeeks} weeks</span></div>
            <div className="sbar-track"><div className="sbar-fill f-lime" style={{ width: `${progress}%`, background: p.mode === "rush" ? "var(--amber)" : p.mode === "deliberate" ? "var(--sage)" : undefined }} /></div>
          </div>
        </header>

        <section className="studio-section-card">
          <div className="studio-section-heading"><div><div className="studio-section-eyebrow">Project settings</div><div className="studio-section-note">Shape the sound without losing your place.</div></div></div>
          <div className="studio-settings-list">
            <button className={`studio-setting-row ${picker === "producer" ? "active" : ""}`} onClick={() => setPicker(picker === "producer" ? null : "producer")}><span>Producer</span><span>Change</span></button>
            <button className={`studio-setting-row ${picker === "studio" ? "active" : ""}`} onClick={() => setPicker(picker === "studio" ? null : "studio")}><span>Studio</span><span>Change</span></button>
            <button className={`studio-setting-row ${picker === "theme" ? "active" : ""}`} onClick={() => setPicker(picker === "theme" ? null : "theme")}><span>Album theme</span><span>Change</span></button>
          </div>
          {picker === "producer" && <div className="studio-picker" aria-label="Choose producer">
            <div className="studio-picker-title">Choose a producer</div>
            {PRODUCERS.filter((pr: any) => state.money >= getProducerEffectiveCost(pr, state.producerWorkCounts) || p.producerId === pr.id).map((pr: any) => <button key={pr.id} className={`studio-picker-option ${p.producerId === pr.id ? "selected" : ""}`} onClick={() => chooseSetting({ producerId: pr.id })}><span>{pr.name}</span><small>{fmtMoney(getProducerEffectiveCost(pr, state.producerWorkCounts))}</small></button>)}
            {rel && <div className="tip-text studio-picker-hint">Current relationship: {rel.label} · −{Math.round(rel.discountPct * 100)}% fee</div>}
          </div>}
          {picker === "studio" && <div className="studio-picker" aria-label="Choose studio">
            <div className="studio-picker-title">Choose a studio</div>
            {STUDIOS.filter((st: any) => st.tier <= 2 || (state.fame >= st.repReq && state.fans >= st.fanReq)).map((st: any) => <button key={st.id} className={`studio-picker-option ${p.studioId === st.id ? "selected" : ""}`} onClick={() => chooseSetting({ studioId: st.id })}><span>{st.name}</span><small>{fmtMoney(st.perWeek)}/wk · {Math.round((1 - (STUDIO_TIME_MODIFIERS[st.tier] ?? 1)) * 100)}% faster</small></button>)}
          </div>}
          {picker === "theme" && <div className="studio-picker studio-picker--themes" aria-label="Choose album theme">
            <div className="studio-picker-title">Choose an album theme</div>
            {THEMES.map((t: any) => <button key={t.id} className={`studio-picker-option ${p.themeId === t.id ? "selected" : ""}`} onClick={() => chooseSetting({ themeId: t.id })}><span>{t.icon} {t.name}</span></button>)}
          </div>}
        </section>

        <section className="studio-tracks-section">
          <div className="studio-section-heading"><div><div className="studio-section-eyebrow">Tracklist</div><div className="studio-section-note">Titles lead; creative credits stay tucked away.</div></div>{p.tracks.length < p.maxTracks && <button className="btn btn-sm btn-amber" onClick={doAutoGenerateTracks}>Auto-fill</button>}</div>
          {p.tracks.map((t: any, i: number) => <div className="studio-track" key={i}>
            <div className="studio-track-main"><span className="t-num">{i + 1}</span><span className="t-name">{t.name}</span><button className="studio-track-details" aria-expanded={expandedTrack === i} onClick={() => setExpandedTrack(expandedTrack === i ? null : i)}>Details</button><button className="btn btn-sm btn-danger" aria-label={`Remove ${t.name}`} onClick={() => doRemoveTrack(i)}>Remove</button></div>
            {expandedTrack === i && <div className="studio-track-extra"><span>{getHook(t.hook)?.icon} {getHook(t.hook)?.name}</span><span>{getLyric(t.lyric)?.icon} {getLyric(t.lyric)?.name}</span>{t.featId && <span>feat. {FEATURES.find((f: any) => f.id === t.featId)?.name}</span>}{t.cowriterId && <span>w/ {FEATURES.find((f: any) => f.id === t.cowriterId)?.name}</span>}</div>}
          </div>)}
          {p.tracks.length < p.maxTracks && <div className="studio-add-track">
            <div className="studio-add-track-row"><input type="text" placeholder="Track title" value={trackName} onChange={(e) => setTrackName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTrack(); }} /><button className="btn btn-sm" aria-label="Generate track title" title="Generate track title" onClick={() => setTrackName(p.themeId ? genThemedTrackName(p.themeId) : genTrackName())}>🎲</button><button className="btn btn-sm btn-lime" onClick={addTrack}>Add</button></div>
            <details className="studio-song-options"><summary>Song details <span>optional</span></summary><div className="studio-song-options-body">
              <div className="studio-option-label">Hook</div><div className="studio-option-buttons">{(["safe", "catchy", "experimental"] as HookStyle[]).map((h) => <button key={h} className={`btn btn-sm ${hook === h ? "btn-lime" : ""}`} onClick={() => setHook(h)}>{getHook(h)?.icon} {getHook(h)?.name}</button>)}</div>
              <div className="studio-option-label">Lyrics</div><div className="studio-option-buttons">{(["party", "heartfelt", "literary"] as LyricStyle[]).map((l) => <button key={l} className={`btn btn-sm ${lyric === l ? "btn-lime" : ""}`} onClick={() => setLyric(l)}>{getLyric(l)?.icon} {getLyric(l)?.name}</button>)}</div>
              <label className="studio-select-label">Guest artist<select value={featId} onChange={(e) => { setFeatId(e.target.value); setCowriterId(""); }}><option value="">No feature</option>{FEATURES.filter((f: any) => f.genres.includes(state.genre) && state.fame >= f.fameR && state.rep >= f.repR && state.fans >= f.fanR).map((f: any) => <option key={f.id} value={f.id}>{f.name} ({fmtMoney(getFeatureEffectiveCost(f, state.featureWorkCounts))})</option>)}</select></label>
              <label className="studio-select-label">Co-writer<select value={cowriterId} onChange={(e) => { setCowriterId(e.target.value); setFeatId(""); }}><option value="">No co-writer</option>{FEATURES.filter((f: any) => f.genres.includes(state.genre)).map((f: any) => <option key={f.id} value={f.id}>{f.name} (FREE)</option>)}</select></label>
            </div></details>
          </div>}
        </section>

        <details className="studio-session-details">
          <summary>Session details</summary>
          <div className="studio-session-content">
            {p.tracks.length > 0 && <div className="studio-mini-panel"><div className="studio-option-label">Album mix</div>{(() => { const mix = computeAlbumWritingMix(p.tracks); return <div className="tip-text">Dominant hook: <b>{mix.dominantHook ?? "—"}</b> · Dominant lyric: <b>{mix.dominantLyric ?? "—"}</b><br />Stream mult: {(mix.streamMult * 100).toFixed(0)}% · Fan mult: {(mix.fanMult * 100).toFixed(0)}% · Critic bias: {mix.critRepBonus > 0 ? "+" : ""}{mix.critRepBonus}</div>; })()}</div>}
            <div className="studio-mini-panel"><div className="studio-option-label">This week</div><div className="studio-option-buttons"><button className="btn btn-sm" onClick={doTakeStudioBreak}>Take Break</button><button className="btn btn-sm" onClick={doPushThrough}>Push Through</button><button className="btn btn-sm btn-ghost" onClick={doCancelStudioChoice}>Cancel</button></div><div className="tip-text">Break recovers energy without progress. Push records while exhausted with a burnout penalty.</div></div>
            <button className="btn btn-danger btn-block" onClick={doScrubProject}>Scrub Project</button>
          </div>
        </details>
        <button className="btn btn-lime btn-block" disabled={!canFinish} onClick={doFinishProject}>Finish Recording</button>
        <button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 6 }}>Back</button>
      </div>
    </div>
  );
}
