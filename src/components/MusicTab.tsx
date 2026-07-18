import { useState } from "react";
import { buildChart, fmt, fmtMoney, getTrackDevelopment, SPOTIFY_MIN_STREAMS, STREAMING_PLATFORMS, type CampaignAllocation } from "../gameLogic";

const DEFAULT_ALLOCATION: CampaignAllocation = { streaming: 25, radio: 25, press: 25, live: 25 };

export default function MusicTab(game: any) {
  const { state, doPromoteTrack, doShootMusicVideo, doReleaseProject, doSubmitLabelRelease, doReviseLabelSubmission, doDeleteUnreleased } = game;
  const [view, setView] = useState<"releases" | "insights">("releases");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<any | null>(null);
  const weeklyStreams = state.catalog.reduce((sum: number, item: any) => sum + (item.weeklyStreams || 0), 0);
  const weeklyRevenue = state.catalog.reduce((sum: number, item: any) => sum + (item.streamStats?.weeklyRevenue || 0), 0);
  const chart = buildChart(state.catalog, state.week);
  const mySongs = chart.filter((item: any) => item.isMe);
  const label = state.currentLabel;

  const launch = (projectId: string, leadIndex: number, allocation?: CampaignAllocation, override = false) => {
    doReleaseProject(projectId, leadIndex, allocation, override);
    setReleaseTarget(null);
  };

  return <div className="animate-fadeIn music-workspace">
    <header className="music-header"><div><div className="pg-title">Music</div><div className="tip-text">Choose the lead, then decide how a label campaign reaches listeners.</div></div><div className="music-header-stat"><span>This week</span><strong>{fmt(weeklyStreams)}</strong><small>{fmtMoney(weeklyRevenue)}</small></div></header>
    <div className="music-switcher" role="tablist" aria-label="Music views"><button role="tab" aria-selected={view === "releases"} className={view === "releases" ? "active" : ""} onClick={() => setView("releases")}>Releases</button><button role="tab" aria-selected={view === "insights"} className={view === "insights" ? "active" : ""} onClick={() => setView("insights")}>Insights</button></div>

    {view === "releases" && <div className="music-release-shelf stagger-1">
      {state.unreleased.length > 0 && <section className="music-shelf-section"><div className="music-section-heading"><div><div className="music-section-kicker">Ready when you are</div><h2>Unreleased</h2></div></div>{state.unreleased.map((project: any) => {
        const submission = state.pendingLabelSubmission?.projectId === project.id ? state.pendingLabelSubmission : null;
        const isLocked = submission?.status === "under_review";
        return <article className="music-release-card music-release-card--unreleased" key={project.id}><div><div className="rel-title">{project.title}</div><div className="rel-meta">{project.type} · Quality {(project.avgQuality / 10).toFixed(1)} · Appeal {(project.avgAppeal ?? 5).toFixed(1)}</div>{submission && <small className={submission.status === "held" ? "text-rust" : "text-muted"}>{submission.status === "under_review" ? `A&R review returns week ${submission.reviewWeek}` : submission.status === "approved" ? "A&R approved — ready to launch" : submission.status === "revision_requested" ? "A&R requested one revision" : "A&R has put this release on hold"}</small>}</div><div className="music-release-actions">
          {submission?.status === "approved" ? <button className="btn btn-sm btn-lime" onClick={() => launch(project.id, submission.leadTrackIndex, submission.allocation)}>Launch approved release</button>
            : submission?.status === "held" ? <><button className="btn btn-sm btn-danger" onClick={() => launch(project.id, submission.leadTrackIndex, submission.allocation, true)}>Override & release</button><button className="btn btn-sm" onClick={() => setReleaseTarget(project)}>View campaign</button></>
            : <button className="btn btn-sm btn-lime" disabled={isLocked} onClick={() => setReleaseTarget(project)}>{submission?.status === "revision_requested" ? "Revise campaign" : isLocked ? "Under review" : label ? "Release campaign" : "Choose lead"}</button>}
          <button className="btn btn-sm btn-danger" disabled={!!submission} onClick={() => doDeleteUnreleased(project.id)}>Delete</button>
        </div></article>;
      })}</section>}
      <section className="music-shelf-section"><div className="music-section-heading"><div><div className="music-section-kicker">Your story so far</div><h2>Discography</h2></div></div>{state.discography.length === 0 ? <div className="empty-state">No releases yet. Record something!</div> : state.discography.map((release: any) => <article className={`music-release-card ${release.outcome === "Viral" ? "viral" : release.outcome === "Hit" ? "hit" : release.outcome === "Flop" ? "flop" : ""}`} key={release.id}><div><div className="rel-title">{release.title}</div><div className="rel-meta">{release.type} · Quality {(release.avgQuality / 10).toFixed(1)}</div></div><div className="music-release-result"><span className={`tag ${release.outcome === "Viral" ? "t-gold" : release.outcome === "Hit" ? "t-lime" : release.outcome === "Moderate" ? "t-orange" : "t-red"}`}>{release.outcome}</span><small>{fmtMoney(release.revenue)} · +{fmt(release.fansGained)} fans</small></div></article>)}</section>
    </div>}

    {view === "insights" && <div className="music-insights stagger-1"><section className="music-insight-summary"><div><span>Weekly streams</span><strong>{fmt(weeklyStreams)}</strong></div><div><span>Weekly revenue</span><strong className="text-sage">{fmtMoney(weeklyRevenue)}</strong></div><div><span>Charting songs</span><strong>{mySongs.length}</strong></div></section>
      <details className="music-insight-panel"><summary><span>Catalog performance</span><small>{state.catalog.length} active release{state.catalog.length === 1 ? "" : "s"}</small></summary><div className="music-insight-body">{state.catalog.length === 0 ? <div className="empty-state">No releases in catalog.</div> : state.catalog.map((item: any) => { const selected = selectedTrack === item.id; const stats = item.streamStats || {}; const lead = item.leadTrackIndex !== undefined ? item.tracks?.[item.leadTrackIndex] : null; return <article className="music-catalog-item" key={item.id}><button className="music-catalog-main" aria-expanded={selected} onClick={() => setSelectedTrack(selected ? null : item.id)}><span><b>{item.title}</b><small>{item.type} · {item.lifecycle}{lead ? ` · Lead: ${lead.name}` : ""}</small></span><span>{fmt(item.weeklyStreams)} / wk</span></button>{selected && <div className="music-catalog-detail"><div className="music-detail-metrics"><span>Quality {(item.quality / 10).toFixed(1)}</span><span>Appeal {(item.appeal ?? 5).toFixed(1)}</span><span>Peak {fmt(item.peakStreams)}</span><span>{fmtMoney(stats.weeklyRevenue || 0)} this week</span></div>{item.campaign && <div className="text-muted">Campaign: {item.campaign.allocation.streaming}% streaming · {item.campaign.allocation.radio}% radio · {item.campaign.allocation.press}% press · {item.campaign.allocation.live}% live {item.campaign.approvalOverride ? "· overridden label notes" : ""}</div>}{item.totalStreams < SPOTIFY_MIN_STREAMS && <div className="text-rust">{fmt(SPOTIFY_MIN_STREAMS - item.totalStreams)} to streaming threshold</div>}<div className="music-release-actions"><button className="btn btn-sm" disabled={state.money < 350 || item.promoted} onClick={() => doPromoteTrack(item.id)}>Promote ($350)</button><button className="btn btn-sm" disabled={state.money < 1200 || item.hasMusicVideo} onClick={() => doShootMusicVideo(item.id)}>Video ($1.2k)</button></div><details className="music-nested-detail"><summary>Platform and audience breakdown</summary><div className="music-detail-metrics">{STREAMING_PLATFORMS.map((platform: any) => <span key={platform.id}>{platform.name}: {Math.round((item.platformMix?.[platform.id] || 0) * 100)}%</span>)}</div></details></div>}</article>; })}</div></details>
      <details className="music-insight-panel"><summary><span>Charts</span><small>{mySongs.length ? `${mySongs.length} of your songs charting` : "No songs charting"}</small></summary><div className="music-insight-body">{mySongs.map((item: any) => <div key={item.id} className="chart-row me"><div className="chart-pos">#{item.pos}</div><div style={{ flex: 1 }}>{item.title}</div><div>{fmt(item.streams)}</div></div>)}<details className="music-nested-detail"><summary>Top 20 chart</summary>{chart.slice(0, 20).map((item: any) => <div className={`chart-row ${item.isMe ? "me" : ""}`} key={`${item.pos}-${item.title}`}><div className="chart-pos">#{item.pos}</div><div style={{ flex: 1 }}>{item.title}</div><div className="text-muted">{item.artist}</div></div>)}</details></div></details>
    </div>}
    {releaseTarget && <ReleaseCampaignBuilder project={releaseTarget} state={state} onClose={() => setReleaseTarget(null)} onLaunch={(index: number, allocation?: CampaignAllocation, override?: boolean) => launch(releaseTarget.id, index, allocation, override)} onSubmit={(index: number, allocation: CampaignAllocation) => { doSubmitLabelRelease(releaseTarget.id, index, allocation); setReleaseTarget(null); }} onRevise={(index: number, allocation: CampaignAllocation) => { doReviseLabelSubmission(releaseTarget.id, index, allocation); setReleaseTarget(null); }} />}
  </div>;
}

export function ReleaseCampaignBuilder({ project, state, onClose, onLaunch, onSubmit, onRevise }: any) {
  const submission = state.pendingLabelSubmission?.projectId === project.id ? state.pendingLabelSubmission : null;
  const label = state.currentLabel;
  const needsApproval = !!label && (label.approvalRights.includes("singles") || label.approvalRights.includes("release date"));
  const [leadIndex, setLeadIndex] = useState(submission?.leadTrackIndex ?? project.leadTrackIndex ?? 0);
  const [allocation, setAllocation] = useState<CampaignAllocation>(submission?.allocation ?? DEFAULT_ALLOCATION);
  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  const perAlbum = label ? Math.floor(label.marketingCommitment / Math.max(1, label.albumsCommitted)) : 0;
  const setShare = (channel: keyof CampaignAllocation, value: string) => setAllocation(current => ({ ...current, [channel]: Math.max(0, Math.min(100, Number(value) || 0)) }));
  const canSubmit = total === 100 && !submission?.status?.includes("under_review");

  const action = () => {
    if (!label) return onLaunch(leadIndex);
    if (submission?.status === "revision_requested") return onRevise(leadIndex, allocation);
    if (submission?.status === "held") return onLaunch(leadIndex, submission.allocation, true);
    if (submission?.status === "approved") return onLaunch(submission.leadTrackIndex, submission.allocation);
    if (needsApproval) return onSubmit(leadIndex, allocation);
    return onLaunch(leadIndex, allocation);
  };
  const actionLabel = !label ? "Release now" : submission?.status === "revision_requested" ? "Resubmit for final review" : submission?.status === "held" ? "Override & release (55% support)" : submission?.status === "approved" ? "Launch approved release" : needsApproval ? "Submit to A&R" : "Launch campaign";

  return <div className="modal-overlay" onClick={onClose}><div className="modal-box lead-single-picker" onClick={event => event.stopPropagation()}><div className="modal-title">{label ? "Release campaign" : "Choose the lead single"}</div><div className="tip-text">{submission?.reviewNote ?? (label ? `Label allocation: ${fmtMoney(perAlbum)} per committed album.` : "Quality drives critics. Commercial appeal gives the launch its lift.")}</div><div className="lead-single-list">{project.tracks.map((track: any, index: number) => { const development = getTrackDevelopment(track); const quality = development.qualityRating ?? (track.quality ? track.quality / 10 : project.avgQuality / 10); const appeal = development.appealRating ?? project.avgAppeal ?? 5; return <button className={`lead-single-option ${leadIndex === index ? "active" : ""}`} key={`${track.name}-${index}`} onClick={() => setLeadIndex(index)} disabled={submission?.status === "approved" || submission?.status === "held"}><span><b>{index + 1}. {track.name}</b><small>{track.featId ? "Guest feature" : "Original cut"}</small></span><span><i>Q {quality.toFixed(1)}</i><i>A {appeal.toFixed(1)}</i></span></button>; })}</div>
    {label && <div style={{ margin: "14px 0" }}><div className="contract-section-title">Campaign allocation <span className={total === 100 ? "text-sage" : "text-rust"}>({total}/100%)</span></div>{(["streaming", "radio", "press", "live"] as Array<keyof CampaignAllocation>).map(channel => <label key={channel} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, textTransform: "capitalize" }}><span style={{ width: 84 }}>{channel}</span><input type="number" min="0" max="100" value={allocation[channel]} onChange={event => setShare(channel, event.target.value)} disabled={submission?.status === "approved" || submission?.status === "held"} style={{ width: 72 }} /><small>% {channel === "streaming" ? "launch streams" : channel === "radio" ? "fame + radio pitch" : channel === "press" ? "critic reputation" : "fan conversion + tour demand"}</small></label>)}</div>}
    {label?.campaignFrozen && <div className="text-rust">Campaign support is frozen until the next accepted album delivery.</div>}
    {submission?.status === "held" && <div className="text-rust" style={{ marginBottom: 8 }}>Override: release now with 55% campaign support, -2 rep, and one approval strike.</div>}
    <button className="btn btn-lime btn-block" disabled={!canSubmit} onClick={action}>{actionLabel}</button><button className="btn btn-ghost btn-block" onClick={onClose}>Back</button></div></div>;
}
