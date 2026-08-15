import { useState } from "react";
import {
  FEATURES, PRODUCERS, RECORDING_MODE_CONFIG, SONG_DIRECTION_LABELS, SONG_STAGES, STUDIOS, THEMES,
  fmtMoney, genThemedTrackName, genTrackName, getFeatureEffectiveCost, getFocusedSessionCost,
  getProjectPipelineStage, getProducerEffectiveCost, getTrackDevelopment,
  type RecordingMode, type ReleaseType, type SessionInvestment, type SongDevelopmentStage, type SongDirection, type SongStage,
} from "../../gameLogic";
import { getRecordingSessionForecast } from "../../recordingForecast";

type SettingPicker = "producer" | "studio" | "theme" | null;

export default function StudioDrawer(game: any) {
  const { state, advance, doStartProject, doUpdateProject, doAddTrack, doRemoveTrack, doConfigureTrackStage, doFinishProject, doScrubProject, doTakeStudioBreak, doPushThrough, doCancelStudioChoice, doAutoGenerateTracks, onClose } = game;
  const [view, setView] = useState<"new" | "project" | null>(state.project ? "project" : "new");

  if (view === "new") return <NewProjectForm doStartProject={doStartProject} onBack={() => state.project ? setView("project") : onClose()} onProjectStarted={() => setView("project")} />;
  if (state.project && view === "project") return <ActiveProject state={state} advance={advance} doUpdateProject={doUpdateProject} doAddTrack={doAddTrack} doRemoveTrack={doRemoveTrack} doConfigureTrackStage={doConfigureTrackStage} doFinishProject={doFinishProject} doScrubProject={doScrubProject} doTakeStudioBreak={doTakeStudioBreak} doPushThrough={doPushThrough} doCancelStudioChoice={doCancelStudioChoice} doAutoGenerateTracks={doAutoGenerateTracks} onBack={() => state.unreleased.length ? setView(null) : onClose()} onClose={onClose} />;

  return <div className="drawer-overlay" onClick={onClose}><div className="drawer" onClick={event => event.stopPropagation()}><div className="drawer-handle" /><div className="drawer-title">Studio</div><button className="btn btn-lime btn-block" onClick={() => setView(state.project ? "project" : "new")}>{state.project ? "Continue Recording" : "Start New Project"}</button><button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8 }}>Close</button></div></div>;
}

function NewProjectForm({ doStartProject, onBack, onProjectStarted }: any) {
  const [type, setType] = useState<ReleaseType>("Single");
  const [mode, setMode] = useState<RecordingMode>("standard");
  return <div className="drawer-overlay" onClick={onBack}><div className="drawer" onClick={event => event.stopPropagation()}><div className="drawer-handle" /><div className="drawer-title">New Project</div><p className="tip-text studio-intro">Every song moves through writing, recording, and mixing before the project is finished.</p><div className="studio-choice-grid">{(["Single", "EP", "Album", "Live Album"] as ReleaseType[]).map(option => <button key={option} className={`btn ${type === option ? "btn-lime" : ""}`} onClick={() => setType(option)}>{option}</button>)}</div><div className="studio-section-card"><div className="studio-section-eyebrow">Recording pace</div><div className="studio-choice-grid studio-choice-grid--mode">{(["standard", "rush", "deliberate"] as RecordingMode[]).map(option => <button key={option} className={`btn btn-sm ${mode === option ? "btn-lime" : ""}`} onClick={() => setMode(option)}>{RECORDING_MODE_CONFIG[option].label}</button>)}</div><div className="tip-text">{mode === "rush" ? "Faster sessions, but lower quality and higher burnout." : mode === "deliberate" ? "More time for the work, with a quality lift and extra burnout." : "A balanced production schedule."}</div></div><button className="btn btn-lime btn-block" onClick={() => { doStartProject(type, mode); onProjectStarted(); }}>Start Recording</button><button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 8 }}>Back</button></div></div>;
}

function ActiveProject({ state, advance, doUpdateProject, doAddTrack, doRemoveTrack, doConfigureTrackStage, doFinishProject, doScrubProject, doTakeStudioBreak, doPushThrough, doCancelStudioChoice, doAutoGenerateTracks, onBack, onClose }: any) {
  const project = state.project!;
  const [trackName, setTrackName] = useState("");
  const [picker, setPicker] = useState<SettingPicker>(null);
  const stage = getProjectPipelineStage(project);
  const studio = STUDIOS.find(item => item.id === project.studioId);
  const canFinish = project.weeksLeft <= 0 && stage === "complete";
  const stageNumber = stage === "complete" ? 3 : SONG_STAGES.indexOf(stage) + 1;

  const addTrack = () => {
    if (!trackName.trim()) return;
    doAddTrack(trackName.trim());
    setTrackName("");
  };

  return <div className="drawer-overlay" onClick={onClose}><div className="drawer studio-drawer song-studio-drawer" onClick={event => event.stopPropagation()}>
    <div className="drawer-handle" />
    <header className="studio-project-hero"><div className="studio-project-kicker">In development</div><div className="drawer-title">{project.title}</div><div className="studio-project-meta"><span>{project.type}</span><span>{project.weeksLeft}wk left</span><span>{project.tracks.length}/{project.maxTracks} tracks</span></div><div className="song-phase-meter" aria-label={`Song development stage ${stageNumber} of 3`}>{SONG_STAGES.map((item, index) => <span key={item} className={index < stageNumber ? "done" : ""}>{index + 1}. {item}</span>)}</div></header>

    <ProjectSettings state={state} project={project} picker={picker} setPicker={setPicker} doUpdateProject={doUpdateProject} />

    <section className="studio-tracks-section"><div className="studio-section-heading"><div><div className="studio-section-eyebrow">{stage === "complete" ? "Completed tracks" : `${stage[0].toUpperCase() + stage.slice(1)} pass`}</div><div className="studio-section-note">{stage === "complete" ? "Ratings are locked in. Let the remaining studio time finish the record." : "Set every track’s direction before ending the week."}</div></div>{project.tracks.length < project.maxTracks && stage === "writing" && <button className="btn btn-sm btn-amber" onClick={doAutoGenerateTracks}>Auto-fill</button>}</div>
      {project.tracks.map((track: any, index: number) => <TrackDevelopmentCard key={`${track.name}-${index}`} index={index} track={track} stage={stage} state={state} studioTier={studio?.tier ?? 0} doConfigureTrackStage={doConfigureTrackStage} doRemoveTrack={doRemoveTrack} />)}
      {project.tracks.length < project.maxTracks && stage === "writing" && <div className="studio-add-track"><div className="studio-add-track-row"><input aria-label="Track title" value={trackName} placeholder="Track title" onChange={event => setTrackName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") addTrack(); }} /><button className="btn btn-sm" title="Generate track title" aria-label="Generate track title" onClick={() => setTrackName(project.themeId ? genThemedTrackName(project.themeId) : genTrackName())}>🎲</button><button className="btn btn-sm btn-lime" onClick={addTrack}>Add</button></div></div>}
    </section>

    <SessionForecast state={state} />

    <details className="studio-session-details"><summary>Session details</summary><div className="studio-session-content"><div className="studio-mini-panel"><div className="studio-option-label">This week</div><div className="studio-option-buttons"><button className="btn btn-sm" onClick={doTakeStudioBreak}>Take Break</button><button className="btn btn-sm" onClick={doPushThrough}>Push Through</button><button className="btn btn-sm btn-ghost" onClick={doCancelStudioChoice}>Cancel</button></div><div className="tip-text">A focused pass charges when the week ends. Breaks hold progress; pushing through exhaustion hurts every final rating.</div></div><button className="btn btn-danger btn-block" onClick={doScrubProject}>Scrub Project</button></div></details>
    <button className="btn btn-end-week btn-block" onClick={advance}>⏭ End Week</button><button className="btn btn-lime btn-block" disabled={!canFinish} onClick={doFinishProject} style={{ marginTop: 8 }}>Finish Recording</button><button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 6 }}>Back</button>
  </div></div>;
}

function SessionForecast({ state }: { state: any }) {
  const forecast = getRecordingSessionForecast(state);
  if (!forecast) return null;
  const status = forecast.status === "complete" ? "No creative pass remains" : forecast.status === "break" ? "Break selected — progress will hold" : forecast.status === "stalled" ? "Too exhausted to record — progress will stall" : forecast.status === "push_through" ? "Pushing through exhaustion — quality penalty applies" : `${forecast.stage[0].toUpperCase() + forecast.stage.slice(1)} pass will progress`;
  const expenses = [
    forecast.studioCost > 0 ? `${fmtMoney(forecast.studioCost)} studio rent` : null,
    forecast.focusedCost > 0 ? `${fmtMoney(forecast.focusedCost)} focused work` : null,
    forecast.featureCost > 0 ? `${fmtMoney(forecast.featureCost)} feature fee` : null,
  ].filter(Boolean).join(" · ");
  return <section className="studio-section-card" aria-label="Session forecast"><div className="studio-section-heading"><div><div className="studio-section-eyebrow">Session forecast</div><div className="studio-section-note">{status}</div></div></div><div className="music-detail-metrics"><span>Cash {fmtMoney(forecast.cashCost)}</span><span>Label fund {fmtMoney(forecast.labelFundCost)}</span><span>Energy {forecast.energyChange}</span><span>Burnout +{forecast.burnoutChange}</span></div>{forecast.status !== "complete" && <div className="tip-text" style={{ marginTop: 8 }}>{expenses}{forecast.cashCost > state.money && <><br /><strong>Insufficient cash: this pass cannot run.</strong></>}</div>}<details className="song-score-breakdown" style={{ marginTop: 8 }}><summary>Projected final ratings</summary><div className="music-detail-metrics">{forecast.trackRatings.map(track => <span key={track.name}>{track.name}: Q {track.rating.quality.min}–{track.rating.quality.max} · A {track.rating.appeal.min}–{track.rating.appeal.max}{track.rating.hasUnresolvedRisk ? " · risk" : ""}</span>)}</div><div className="tip-text" style={{ marginTop: 6 }}>Ranges reflect the current plan. Artistic passes keep their uncertainty until the session resolves.</div></details></section>;
}

function ProjectSettings({ state, project, picker, setPicker, doUpdateProject }: any) {
  const choose = (change: any) => { doUpdateProject(change); setPicker(null); };
  const labelFundRemaining = Math.max(0, (state.currentLabel?.recordingFund || 0) - (state.currentLabel?.recordingFundUsed || 0));
  const fundLocked = !!state.currentLabel?.fundingFrozen;
  return <section className="studio-section-card"><div className="studio-section-heading"><div><div className="studio-section-eyebrow">Project settings</div><div className="studio-section-note">Your team supports every track in the pass.</div></div></div><div className="studio-settings-list"><button className={`studio-setting-row ${picker === "producer" ? "active" : ""}`} onClick={() => setPicker(picker === "producer" ? null : "producer")}><span>Producer</span><span>Change</span></button><button className={`studio-setting-row ${picker === "studio" ? "active" : ""}`} onClick={() => setPicker(picker === "studio" ? null : "studio")}><span>Studio</span><span>Change</span></button><button className={`studio-setting-row ${picker === "theme" ? "active" : ""}`} onClick={() => setPicker(picker === "theme" ? null : "theme")}><span>Album theme</span><span>Change</span></button></div>
    {state.currentLabel && <div className="studio-mini-panel" style={{ marginTop: 10 }}><div className="studio-option-label">Recording fund</div><div className="tip-text" style={{ marginBottom: 8 }}>{fundLocked ? "Frozen until you deliver a contract album." : `${fmtMoney(labelFundRemaining)} available from ${state.currentLabel.name}. Fund spending is recoupable.`}</div><button className={`btn btn-sm ${project.labelFunding ? "btn-lime" : ""}`} disabled={fundLocked || labelFundRemaining <= 0} onClick={() => doUpdateProject({ labelFunding: !project.labelFunding })}>{project.labelFunding ? "Using Label Fund" : "Use Label Fund"}</button></div>}
    {picker === "producer" && <div className="studio-picker"><div className="studio-picker-title">Choose a producer</div>{PRODUCERS.filter(item => state.money + (project.labelFunding && !fundLocked ? labelFundRemaining : 0) >= getProducerEffectiveCost(item, state.producerWorkCounts) || project.producerId === item.id).map(item => <button key={item.id} className={`studio-picker-option ${project.producerId === item.id ? "selected" : ""}`} onClick={() => choose({ producerId: item.id })}><span>{item.name}</span><small>{fmtMoney(getProducerEffectiveCost(item, state.producerWorkCounts))}</small></button>)}</div>}
    {picker === "studio" && <div className="studio-picker"><div className="studio-picker-title">Choose a studio</div>{STUDIOS.filter(item => item.tier <= 2 || (state.fame >= item.repReq && state.fans >= item.fanReq)).map(item => <button key={item.id} className={`studio-picker-option ${project.studioId === item.id ? "selected" : ""}`} onClick={() => choose({ studioId: item.id })}><span>{item.name}</span><small>{fmtMoney(item.perWeek)}/wk</small></button>)}</div>}
    {picker === "theme" && <div className="studio-picker studio-picker--themes"><div className="studio-picker-title">Choose an album theme</div>{THEMES.map(item => <button key={item.id} className={`studio-picker-option ${project.themeId === item.id ? "selected" : ""}`} onClick={() => choose({ themeId: item.id })}><span>{item.icon} {item.name}</span></button>)}</div>}
  </section>;
}

function TrackDevelopmentCard({ index, track, stage, state, studioTier, doConfigureTrackStage, doRemoveTrack }: any) {
  const development = getTrackDevelopment(track);
  const activeStage = stage === "complete" ? null : stage as SongDevelopmentStage;
  const active = activeStage ? development[activeStage] : null;
  const configure = (direction: SongDirection, investment: SessionInvestment, collaborator?: { featId?: string; cowriterId?: string }) => {
    if (activeStage) doConfigureTrackStage(index, activeStage, direction, investment, collaborator);
  };
  const focusedCost = getFocusedSessionCost(studioTier);
  const quality = development.qualityRating ?? (track.quality ? track.quality / 10 : null);
  const appeal = development.appealRating ?? null;
  return <article className="song-development-card"><div className="song-development-heading"><div><span className="t-num">{index + 1}</span><strong>{track.name}</strong></div>{stage === "writing" && <button className="btn btn-sm btn-danger" onClick={() => doRemoveTrack(index)}>Remove</button>}{stage === "complete" && quality !== null && <div className="song-score-pair"><span>Q {quality.toFixed(1)}</span><span>A {(appeal ?? 5).toFixed(1)}</span></div>}</div>
    {active && activeStage && <div className="song-development-controls"><div className="song-option-label">Creative direction</div><div className="studio-option-buttons">{(["commercial", "balanced", "artistic"] as SongDirection[]).map(direction => <button key={direction} className={`btn btn-sm ${active.direction === direction ? "btn-lime" : ""}`} onClick={() => configure(direction, active.investment)}>{SONG_DIRECTION_LABELS[activeStage][direction]}{direction === "artistic" ? " · Risk" : ""}</button>)}</div><div className="song-option-label">Execution</div><div className="studio-option-buttons">{(["standard", "focused"] as SessionInvestment[]).map(investment => <button key={investment} className={`btn btn-sm ${active.investment === investment ? "btn-lime" : ""}`} onClick={() => configure(active.direction, investment)}>{investment === "focused" ? `Focused (${fmtMoney(focusedCost)})` : "Standard"}</button>)}</div>{stage === "writing" && <details className="song-collaborator"><summary>Collaborator</summary><div className="studio-song-options-body"><label className="studio-select-label">Guest artist<select value={track.featId ?? ""} onChange={event => configure(active.direction, active.investment, { featId: event.target.value })}><option value="">No feature</option>{FEATURES.filter(item => item.genres.includes(state.genre) && state.fame >= item.fameR && state.rep >= item.repR && state.fans >= item.fanR).map(item => <option key={item.id} value={item.id}>{item.name} ({fmtMoney(getFeatureEffectiveCost(item, state.featureWorkCounts))})</option>)}</select></label><label className="studio-select-label">Co-writer<select value={track.cowriterId ?? ""} onChange={event => configure(active.direction, active.investment, { cowriterId: event.target.value })}><option value="">No co-writer</option>{FEATURES.filter(item => item.genres.includes(state.genre)).map(item => <option key={item.id} value={item.id}>{item.name} (FREE)</option>)}</select></label></div></details>}</div>}
    {stage === "complete" && <details className="song-score-breakdown"><summary>Rating breakdown</summary><div className="music-detail-metrics"><span>Craft {development.qualityBreakdown?.craft ?? "—"}</span><span>Team {development.qualityBreakdown?.team ?? "—"}</span><span>Choices {development.qualityBreakdown?.choices ?? "—"}</span><span>Direction {development.appealBreakdown?.direction ?? "—"}</span></div></details>}
  </article>;
}
