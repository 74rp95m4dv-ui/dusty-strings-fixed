import { useState } from "react";
import { getCareerTierIdx, CAREER_TIERS, RANDOM_SCENARIOS } from "../gameLogic";
import DashboardTab from "./DashboardTab";
import MusicTab from "./MusicTab";
import OfficeTab from "./OfficeTab";
import LiveTab from "./LiveTab";
import {
  ReleaseModal, TourWrapModal, SigningModal, AwardModal,
  MilestoneModal, ScenarioModal, NewspaperModal, ArcModal,
  FeatureModal, ManagerOfferModal, PressingModal, SignComponent,
} from "./Modals";
import LabelOfferModal from "./LabelOfferModal";
import StudioDrawer from "./drawers/StudioDrawer";
import GrindDrawer from "./drawers/GrindDrawer";
import MerchDrawer from "./drawers/MerchDrawer";
import OffersDrawer from "./drawers/OffersDrawer";
import CatalogDrawer from "./drawers/CatalogDrawer";
import UnreleasedDrawer from "./drawers/UnreleasedDrawer";
import TourPlannerDrawer from "./drawers/TourPlannerDrawer";
import { IntroCinematic } from "./IntroCinematic";

const TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "office", label: "Office", icon: "💼" },
  { id: "live", label: "Live", icon: "🚐" },
];

export type DrawerType =
  | "studio"
  | "grind"
  | "merch"
  | "offers"
  | "catalog"
  | "unreleased"
  | "tour"
  | null;

export default function GameScreen(game: any) {
const [tab, setTab] = useState("home");
const [drawer, setDrawer] = useState<DrawerType>(null);
const [viewingOffer, setViewingOffer] = useState<any>(null);
const [inTourIntro, setInTourIntro] = useState(false);
const s = game.state;

  const openDrawer = (d: DrawerType) => setDrawer(d);
  const closeDrawer = () => setDrawer(null);

  const handleViewLabelOffer = (offer: any) => {
    setViewingOffer(offer);
  };

  const handleSignLabel = (offer: any) => {
    if (game.doAcceptLabelOffer) {
      game.doAcceptLabelOffer(offer.labelId);
    }
    setViewingOffer(null);
  };

  const activeOffer = game.viewingOffer || viewingOffer;

  return (
    <div className="app-shell">
      {/* Sticky Header */}
      <header className="app-header">
        <div className="header-artist">{s.artistName}</div>
        <div className="header-meta">
          Wk {s.week} • {s.genre}
          {s.currentLabel && (
            <span style={{ marginLeft: 8, color: "var(--amber)" }}>
              • {s.currentLabel.name}
            </span>
          )}
        </div>
        <div className="header-tier">
          <span>⭐</span>
          <span>{CAREER_TIERS[getCareerTierIdx(s.fame)]?.name || "Unknown"}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {tab === "home" && (
          <DashboardTab
            {...game}
            onOpenDrawer={openDrawer}
            onSwitchTab={setTab}
          />
        )}
        {tab === "music" && <MusicTab {...game} />}
        {tab === "office" && (
          <OfficeTab
            {...game}
            onOpenDrawer={openDrawer}
            
          />
        )}
        {tab === "live" && <LiveTab {...game} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
            {t.id === "office" &&
              (s.pendingLabelOffers?.length > 0 || s.pendingManagerOffers?.length > 0) && (
                <span className="badge-dot" />
              )}
          </button>
        ))}
      </nav>

      {/* Drawers */}
      {drawer === "studio" && <StudioDrawer {...game} onClose={closeDrawer} />}
      {drawer === "grind" && <GrindDrawer {...game} onClose={closeDrawer} />}
      {drawer === "merch" && <MerchDrawer {...game} onClose={closeDrawer} />}
      {drawer === "offers" && <OffersDrawer {...game} onClose={closeDrawer} />}
      {drawer === "catalog" && <CatalogDrawer {...game} onClose={closeDrawer} />}
      {drawer === "unreleased" && <UnreleasedDrawer {...game} onClose={closeDrawer} />}
      {drawer === "tour" && <TourPlannerDrawer {...game} onClose={closeDrawer} onSwitchTab={setTab} />}

      {/* Modal Stack */}
      {s.pendingEvent && (
        <div className="modal-overlay" onClick={game.doDismissEvent}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">News</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{s.pendingEvent.msg}</div>
            <div className="modal-footer">
              <button className="btn btn-lime btn-block" onClick={game.doDismissEvent}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {s.pendingScenarioId && <ScenarioModal {...game} scenario={RANDOM_SCENARIOS.find(sc => sc.id === s.pendingScenarioId)} />}
      {s.pendingNewspaperJson && <NewspaperModal {...game} />}
      {s.releasePresentation && <ReleaseModal {...game} />}
      {s.tourWrapPresentation && <TourWrapModal {...game} />}
      {s.signingPresentation && <SigningModal {...game} />}
      {s.awardPresentation && <AwardModal {...game} />}
      {s.milestonePresentation && <MilestoneModal {...game} />}
      {s.pendingArcChoice && <ArcModal {...game} />}
      {s.pendingFeatureRequests?.length > 0 && <FeatureModal {...game} />}
      {activeOffer && (
        <LabelOfferModal
          offer={activeOffer}
          allOffers={s.pendingLabelOffers ?? []}
          state={s}
          onSign={handleSignLabel}
          onClose={() => {
            setViewingOffer(null);
          }}
        />
      )}
      {s.pendingManagerOffers?.length > 0 && <ManagerOfferModal {...game} />}
      {s.pendingPressing && <PressingModal {...game} />}
      
      {/* Tour Intro Cinematic */}
      {inTourIntro && (
        <IntroCinematic 
          onStart={() => {}}
          onEnd={() => setInTourIntro(false)} 
          isTourIntro={true}
        />
      )}
      
      {/* Debug: Tour intro trigger */}
      <button 
        onClick={() => setInTourIntro(true)}
        style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 2000 }}
      >
        Show Tour Intro
      </button>
    </div>
  );
}
