import React from "react";
import { fmt, fmtMoney, getTrackDevelopment } from "../gameLogic";

export function ReleaseCinematic({ state, doCloseReleasePresentation, doCloseTourWrapPresentation, isTourWrap = false }: any) {
  const presentation = isTourWrap ? state.tourWrapPresentation : state.releasePresentation;
  const onClose = isTourWrap ? doCloseTourWrapPresentation : doCloseReleasePresentation;
  if (!presentation) return null;
  if (isTourWrap) return <div className="modal-overlay" onClick={onClose}><div className="modal-box" onClick={event => event.stopPropagation()}><div className="modal-title">Tour Complete</div><div className="signing-title">{presentation.tourName}</div><div className="release-result-grid"><ResultStat label="Shows" value={String(presentation.completedShows)} /><ResultStat label="Net" value={fmtMoney(presentation.netProfit)} /></div><button className="btn btn-lime btn-block" onClick={onClose}>Continue</button></div></div>;

  const lead = presentation.leadTrackIndex !== undefined ? presentation.tracks?.[presentation.leadTrackIndex] : null;
  const leadDevelopment = lead ? getTrackDevelopment(lead) : null;
  const leadQuality = leadDevelopment?.qualityRating ?? (lead?.quality !== undefined ? lead.quality / 10 : 0);
  const leadAppeal = leadDevelopment?.appealRating ?? presentation.appeal ?? 5;
  return <div className="modal-overlay" onClick={doCloseReleasePresentation}><div className="modal-box release-results-modal" onClick={event => event.stopPropagation()}><div className="modal-title">Release Results</div><div className="signing-emoji">{presentation.outcome === "Viral" ? "🔥" : presentation.outcome === "Hit" ? "🎵" : presentation.outcome === "Flop" ? "💔" : "🎶"}</div><div className="signing-title">{presentation.title}</div><div className="tip-text">{presentation.type} · {presentation.genre} · Week {presentation.week}</div><div className="release-result-grid"><ResultStat label="Outcome" value={presentation.outcome} /><ResultStat label="Avg quality" value={`${(presentation.quality / 10).toFixed(1)} / 10`} /><ResultStat label="Revenue" value={fmtMoney(presentation.revenue)} /><ResultStat label="Fans" value={`+${fmt(presentation.fansGained)}`} /></div>{lead && <div className="lead-single-result"><span>Lead single</span><b>{lead.name}</b><small>Quality {leadQuality.toFixed(1)} · Appeal {leadAppeal.toFixed(1)}</small></div>}{presentation.criticHeadline && <div className="card-sm"><div className="tip-text">Critic review</div><div style={{ fontStyle: "italic" }}>“{presentation.criticHeadline}”</div></div>}<button className="btn btn-lime btn-block" onClick={doCloseReleasePresentation} style={{ marginTop: 14 }}>Continue</button></div></div>;
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return <div className="card-sm"><div className="tip-text">{label}</div><strong>{value}</strong></div>;
}
