import { useState } from "react";
import { type AlbumCampaignAction, type GameState } from "../gameLogic";
import { campaignActionUnavailable, getCampaignPhase, getListenerFavorites } from "../gameSystems/albumCampaign";

export default function AlbumCampaignPanel({ state, onAction }: { state: GameState; onAction: (action: AlbumCampaignAction, trackIndex?: number) => void }) {
  const [selected, setSelected] = useState(-1);
  const campaign = state.activeAlbumCampaign;
  const release = state.catalog.find(item => item.id === campaign?.releaseId);
  if (!campaign || !release) return null;
  const duration = campaign.endWeek - campaign.startWeek;
  const favorites = getListenerFavorites(state);
  const moves: Array<{ action: AlbumCampaignAction; label: string }> = [
    { action: "radio_push", label: "Radio · $1,000" },
    { action: "music_video", label: "Video · $1,200" },
    { action: "live_appearance", label: "Live appearance · 15 energy" },
    { action: "acoustic_session", label: "Acoustic session · $400 / 10 energy" },
    { action: "hold_steady", label: "Hold steady" },
  ];
  return <section className="card" style={{ marginTop: 14, borderColor: "var(--lime)" }} aria-label="Album campaign">
    <div className="card-title">Album campaign · {release.title}</div>
    <p className="tip-text">{getCampaignPhase(state)} · Week {Math.min(duration, state.week - campaign.startWeek + 1)} of {duration}. {campaign.pendingAction ? "Move locked in — end the week to resolve it." : "Choose one move, or hold steady to recover burnout."}</p>
    <p className="tip-text">{favorites.length ? `Listener favorite: ${favorites[0].name}. Following listener demand gives a follow-up single 15% more new fans. Feedback reflects hooks, loyal listeners, and your live schedule.` : "Listener feedback arrives after two weeks."}</p>
    <div className="music-release-actions" style={{ marginTop: 10 }}>
      <label>Follow-up single <select aria-label="Follow-up single" style={{ maxWidth: "100%" }} value={selected} onChange={event => setSelected(Number(event.target.value))} disabled={!!campaignActionUnavailable(state, "follow_up_single")}>
        <option value={-1}>Choose an album track</option>
        {release.tracks.map((track, index) => index !== release.leadTrackIndex && <option key={index} value={index}>{track.name}</option>)}
      </select></label>
      <button className="btn btn-sm btn-lime" disabled={!!campaignActionUnavailable(state, "follow_up_single") || selected < 0} onClick={() => onAction("follow_up_single", selected)}>Choose follow-up</button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 10, marginTop: 12 }}>
      {moves.map(({ action, label }) => {
        const reason = campaignActionUnavailable(state, action);
        return <div key={action}><button className="btn btn-sm btn-block" disabled={!!reason} onClick={() => onAction(action)}>{label}</button>{reason && <small className="text-muted">{reason}</small>}</div>;
      })}
    </div>
    <p className="tip-text">Radio and live appearances can repeat after three weeks. Acoustic sessions unlock after week four and help lyrics find lasting listeners.</p>
    {campaign.followUpTrackIndex !== null && <p className="text-sage">Follow-up: {release.tracks[campaign.followUpTrackIndex]?.name}</p>}
    {campaign.actionHistory.length > 0 && <p className="tip-text">Last move: {campaign.actionHistory[campaign.actionHistory.length - 1].outcome}</p>}
  </section>;
}
