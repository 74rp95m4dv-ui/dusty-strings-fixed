import { useState } from "react";
import { type AlbumCampaignAction, type GameState } from "../gameLogic";
import { campaignActionUnavailable, getCampaignPhase, getListenerFavorites } from "../gameSystems/albumCampaign";

const CAMPAIGN_MOVES: Array<{ action: AlbumCampaignAction; title: string; detail: string }> = [
  { action: "radio_push", title: "Radio push", detail: "$1,000 · Build reach through radio" },
  { action: "music_video", title: "Music video", detail: "$1,200 · Give the follow-up a visual moment" },
  { action: "live_appearance", title: "Live appearance", detail: "15 energy · Turn attention into tour demand" },
  { action: "acoustic_session", title: "Acoustic session", detail: "$400 · Give the record a lasting second life" },
  { action: "hold_steady", title: "Hold steady", detail: "Recover burnout and let the record breathe" },
];

function moveTitle(action: AlbumCampaignAction | null) {
  return CAMPAIGN_MOVES.find(move => move.action === action)?.title ?? "Campaign move";
}

export default function AlbumCampaignPanel({ state, onAction }: { state: GameState; onAction: (action: AlbumCampaignAction, trackIndex?: number) => void }) {
  const [isChoosing, setIsChoosing] = useState(false);
  const [followUpIndex, setFollowUpIndex] = useState(-1);
  const campaign = state.activeAlbumCampaign;
  const release = state.catalog.find(item => item.id === campaign?.releaseId);
  if (!campaign || !release) return null;

  const duration = campaign.endWeek - campaign.startWeek;
  const favorites = getListenerFavorites(state);
  const currentWeek = Math.min(duration, state.week - campaign.startWeek + 1);
  const lockFollowUp = () => {
    if (followUpIndex < 0) return;
    onAction("follow_up_single", followUpIndex);
    setIsChoosing(false);
  };
  const chooseMove = (action: AlbumCampaignAction) => {
    onAction(action);
    setIsChoosing(false);
  };

  return <section className="campaign-panel" aria-label="Album campaign">
    <header className="campaign-panel__header">
      <div><span className="campaign-panel__eyebrow">Album campaign</span><h2>{release.title}</h2></div>
      <span className="campaign-panel__week">{getCampaignPhase(state)} · {currentWeek}/{duration}</span>
    </header>
    <div className="campaign-panel__brief">
      <span>{favorites.length ? <>Listener favorite: <b>{favorites[0].name}</b></> : "Listener feedback arrives after two weeks."}</span>
      {campaign.followUpTrackIndex !== null && <span>Follow-up: <b>{release.tracks[campaign.followUpTrackIndex]?.name}</b></span>}
      {campaign.actionHistory.length > 0 && <span>Last result: {campaign.actionHistory[campaign.actionHistory.length - 1].outcome}</span>}
    </div>

    {campaign.pendingAction ? <div className="campaign-panel__locked"><span>Planned this week</span><strong>{moveTitle(campaign.pendingAction)}</strong><small>End the week to resolve it.</small></div> : <button className="btn btn-lime btn-block" onClick={() => setIsChoosing(open => !open)} aria-expanded={isChoosing}>{isChoosing ? "Close campaign moves" : "Choose this week’s move"}</button>}

    {isChoosing && !campaign.pendingAction && <section className="campaign-picker" aria-label="Campaign move picker">
      <div className="campaign-picker__heading"><div><span>Choose one move</span><small>Only the actions available today are ready to lock in.</small></div><button className="btn btn-sm btn-ghost" onClick={() => setIsChoosing(false)}>Close</button></div>
      <div className="campaign-picker__follow-up">
        <label htmlFor="campaign-follow-up">Follow-up single</label>
        <div><select id="campaign-follow-up" value={followUpIndex} onChange={event => setFollowUpIndex(Number(event.target.value))} disabled={!!campaignActionUnavailable(state, "follow_up_single")}><option value={-1}>Choose an album track</option>{release.tracks.map((track, index) => index !== release.leadTrackIndex && <option key={index} value={index}>{track.name}</option>)}</select><button className="btn btn-sm btn-lime" disabled={!!campaignActionUnavailable(state, "follow_up_single") || followUpIndex < 0} onClick={lockFollowUp}>Lock follow-up</button></div>
      </div>
      <div className="campaign-picker__moves">{CAMPAIGN_MOVES.map(move => {
        const unavailable = campaignActionUnavailable(state, move.action);
        return <button className="campaign-move" key={move.action} disabled={!!unavailable} onClick={() => chooseMove(move.action)}><span><b>{move.title}</b><small>{move.detail}</small></span><em>{unavailable ?? "Choose"}</em></button>;
      })}</div>
    </section>}
  </section>;
}
