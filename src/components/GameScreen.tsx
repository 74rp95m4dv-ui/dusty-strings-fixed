import { useState } from "react";
import DashboardTab from "./DashboardTab";
import RecordingTab from "./RecordingTab";
import TouringTab from "./TouringTab";
import StreamingTab from "./StreamingTab";
import GrindTab from "./GrindTab";
import CareerTab from "./CareerTab";
import MerchTab from "./MerchTab";
import {
ReleaseModal, TourWrapModal, SigningModal, AwardModal,
MilestoneModal, ScenarioModal, NewspaperModal, ArcModal,
FeatureModal, ManagerOfferModal, PressingModal,
} from "./Modals";
import LabelOfferModal from "./LabelOfferModal";

const TABS = [
{ id: "dash", label: "Home", icon: "🏠" },
{ id: "record", label: "Studio", icon: "🎙" },
{ id: "tour", label: "Road", icon: "🚐" },
{ id: "stream", label: "Music", icon: "🎵" },
{ id: "grind", label: "Hustle", icon: "⚡" },
{ id: "career", label: "Deals", icon: "📋" },
{ id: "merch", label: "Shop", icon: "👕" },
];

export default function GameScreen(game: any) {
const [tab, setTab] = useState("dash");
const s = game.state;

return (
<div style={{ paddingBottom: 90 }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(–border)" }}>
<div style={{ fontFamily: "var(–head)", fontSize: 16, fontWeight: 900, fontStyle: "italic" }}>{s.artistName}</div>
<div style={{ fontFamily: "var(–mono)", fontSize: 11, color: "var(–muted2)" }}>Wk {s.week} • {s.genre}</div>
</div>
<div style={{ padding: "14px 16px" }}>
{tab === "dash" && <DashboardTab {...game} />}
{tab === "record" && <RecordingTab {...game} />}
{tab === "tour" && <TouringTab {...game} />}
{tab === "stream" && <StreamingTab {...game} />}
{tab === "grind" && <GrindTab {...game} />}
{tab === "career" && <CareerTab {...game} />}
{tab === "merch" && <MerchTab {...game} />}
</div>
<div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "var(–bg2)", borderTop: "1px solid var(–border2)", display: "flex", overflowX: "auto", zIndex: 100, padding: "6px 4px" }}>
{TABS.map((t) => (
<button key={t.id} className={`btn btn-sm ${tab === t.id ? "btn-lime" : "btn-ghost"}`} onClick={() => setTab(t.id)} style={{ minWidth: 56, flexShrink: 0, padding: "6px 4px", fontSize: 10, flexDirection: "column", gap: 2 }}>
<span style={{ fontSize: 16 }}>{t.icon}</span><span>{t.label}</span>
</button>
))}
</div>
{s.pendingEvent && (
<div className="modal-overlay" onClick={game.doDismissEvent}>
<div className="modal-box" onClick={(e) => e.stopPropagation()}>
<div className="modal-handle" />
<div className="modal-title">News</div>
<div style={{ fontSize: 14, lineHeight: 1.6 }}>{s.pendingEvent.msg}</div>
<div className="modal-footer"><button className="btn btn-lime btn-block" onClick={game.doDismissEvent}>Continue</button></div>
</div>
</div>
)}
{s.pendingScenarioId && <ScenarioModal {...game} />}
{s.pendingNewspaperJson && <NewspaperModal {...game} />}
{s.releasePresentation && <ReleaseModal {...game} />}
{s.tourWrapPresentation && <TourWrapModal {...game} />}
{s.signingPresentation && <SigningModal {...game} />}
{s.awardPresentation && <AwardModal {...game} />}
{s.milestonePresentation && <MilestoneModal {...game} />}
{s.pendingArcChoice && <ArcModal {...game} />}
{s.pendingFeatureRequests?.length > 0 && <FeatureModal {...game} />}
{s.pendingLabelOffers?.length > 0 && !game.viewingOffer && <div />}
{game.viewingOffer && (
<LabelOfferModal
offer={game.viewingOffer}
allOffers={s.pendingLabelOffers ?? []}
state={s}
onSign={(offer: any) => { game.doAcceptLabelOffer(offer.labelId); }}
onClose={() => game.doViewLabelOffer(null as any)}
/>
)}
{s.pendingManagerOffers?.length > 0 && <ManagerOfferModal {...game} />}
{s.pendingPressing && <PressingModal {...game} />}
</div>
);
}