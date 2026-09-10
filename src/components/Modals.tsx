import { fmt, fmtMoney, RANDOM_SCENARIOS, STORY_ARCS } from "../gameLogic";
import SignComponent from "./SignComponent";
import { ReleaseCinematic } from "./CinematicModals";

export function LabelMomentModal({ state, doResolveLabelMoment }: any) {
  const moment = state.pendingLabelMoment;
  const label = state.currentLabel;
  if (!moment || !label) return null;
  return (
    <div className="modal-overlay">
      <section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="label-moment-title">
        <div className="label-moment-kicker">{moment.supportLabel}</div>
        <div className="signing-emoji">{moment.emoji}</div>
        <div className="modal-title" id="label-moment-title">{moment.title}</div>
        <div className="signing-title" style={{ fontSize: 17 }}>{label.name}</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, margin: "12px 0 16px" }}>{moment.description}</p>
        <div className="label-moment-trust">A&amp;R trust <b>{label.aRTrust ?? 55}/100</b> · {label.relationshipMood ?? "neutral"}</div>
        <div className="label-moment-choices">
          {moment.choices.map((choice: any, index: number) => (
            <button className="label-moment-choice" key={choice.label} onClick={() => doResolveLabelMoment(index)}>
              <span><b>{choice.label}</b><small>{choice.sub}</small></span>
              <em>{choice.trustDelta >= 0 ? "+" : ""}{choice.trustDelta} trust</em>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ReleaseModal({ state, doCloseReleasePresentation }: any) {
  const pres = state.releasePresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseReleasePresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🎉 Release Results</div>
        <div className="signing-emoji">{pres.outcome === "Viral" ? "🔥" : pres.outcome === "Hit" ? "🎵" : pres.outcome === "Flop" ? "💔" : "🎶"}</div>
        <div className="signing-title">"{pres.title}"</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          {pres.type} • {pres.genre} • Week {pres.week}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Outcome</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: pres.outcome === "Viral" ? "var(--gold)" : pres.outcome === "Hit" ? "var(--sage)" : pres.outcome === "Flop" ? "var(--rust)" : "var(--text)" }}>
              {pres.outcome}
            </div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Quality</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{pres.quality?.toFixed(0)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Revenue</div>
            <div className="text-sage" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(pres.revenue)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Fans</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>+{fmt(pres.fansGained)}</div>
          </div>
        </div>
        {pres.criticHeadline && (
          <div className="card-sm" style={{ marginBottom: 12, borderLeft: "3px solid var(--amber)" }}>
            <div className="tip-text">Critic Review</div>
            <div style={{ fontStyle: "italic", fontSize: 13 }}>"{pres.criticHeadline}"</div>
          </div>
        )}
        {pres.fanReviews && pres.fanReviews.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="tip-text" style={{ marginBottom: 4 }}>Fan Reviews</div>
            {pres.fanReviews.slice(0, 3).map((review: string, i: number) => (
              <div key={i} style={{ fontSize: 12, fontStyle: "italic", color: "var(--muted2)", marginBottom: 2 }}>
                "{review}"
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseReleasePresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function TourWrapModal({ state, doCloseTourWrapPresentation }: any) {
  const pres = state.tourWrapPresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseTourWrapPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🚐 Tour Complete</div>
        <div className="signing-emoji">🎤</div>
        <div className="signing-title">{pres.tourName || "Tour Wrap"}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          {pres.completedShows} shows • {pres.cancelledShows > 0 ? `${pres.cancelledShows} cancelled • ` : ""}Week {pres.week}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Gross</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtMoney(pres.grossRevenue)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Expenses</div>
            <div className="text-rust" style={{ fontSize: 16, fontWeight: 700 }}>{fmtMoney(pres.totalExpenses)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Net Profit</div>
            <div className={pres.netProfit >= 0 ? "text-sage" : "text-rust"} style={{ fontSize: 16, fontWeight: 700 }}>
              {fmtMoney(pres.netProfit)}
            </div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Avg Fill</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{pres.avgFill}%</div>
          </div>
        </div>
        {pres.bestShow && (
          <div className="card-sm" style={{ marginBottom: 8, borderColor: "var(--sage)" }}>
            <div className="tip-text">🏆 Best Show</div>
            <div style={{ fontSize: 13 }}>{pres.bestShow.city} @ {pres.bestShow.venue} -- {pres.bestShow.attendancePct}% full</div>
          </div>
        )}
        {pres.worstShow && (
          <div className="card-sm" style={{ marginBottom: 12, borderColor: "var(--rust)" }}>
            <div className="tip-text">💀 Worst Show</div>
            <div style={{ fontSize: 13 }}>{pres.worstShow.city} @ {pres.worstShow.venue} -- {pres.worstShow.attendancePct}% full</div>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseTourWrapPresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function SigningModal({ state, doCloseSigningPresentation }: any) {
  const pres = state.signingPresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseSigningPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">📝 {pres.kind === "label" ? "Label Signed" : "Manager Signed"}</div>
        <div className="signing-emoji">✍️</div>
        <div className="signing-title">{pres.name}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          {pres.exec || pres.city || ""} • Week {pres.week}
        </div>
        {pres.advance !== undefined && pres.advance > 0 && (
          <div className="signing-money-block" style={{ marginBottom: 12 }}>
            <div className="signing-money-label">Advance</div>
            <div className="signing-money-amount">{fmtMoney(pres.advance)}</div>
          </div>
        )}
        {pres.weeklyFee !== undefined && pres.weeklyFee > 0 && (
          <div className="signing-money-block" style={{ marginBottom: 12 }}>
            <div className="signing-money-label">Weekly Fee</div>
            <div className="signing-money-amount">{fmtMoney(pres.weeklyFee)}/wk</div>
          </div>
        )}
        {pres.terms && pres.terms.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title">Terms</div>
            {pres.terms.map((term: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: i < pres.terms.length - 1 ? "1px dashed var(--border)" : "none" }}>
                <span className="tip-text">{term.label}</span>
                <span style={{ color: term.isGood ? "var(--sage)" : term.isGood === false ? "var(--rust)" : "var(--text)", fontWeight: 600 }}>
                  {term.value}
                </span>
              </div>
            ))}
          </div>
        )}
        {pres.perks && pres.perks.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title">Perks</div>
            {pres.perks.map((perk: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: "var(--sage)", marginBottom: 2 }}>✓ {perk}</div>
            ))}
          </div>
        )}
        {pres.quote && (
          <div className="card-sm" style={{ marginBottom: 12, fontStyle: "italic" }}>
            "{pres.quote}"
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseSigningPresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function AwardModal({ state, doCloseAwardPresentation }: any) {
  const pres = state.awardPresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseAwardPresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🏆 Award Won</div>
        <div className="signing-emoji">🏆</div>
        <div className="signing-title">{pres.name}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, fontStyle: "italic" }}>
          {pres.desc}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Cash Prize</div>
            <div className="text-sage" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(pres.money)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Fame Boost</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--amber)" }}>+{pres.famePerk}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseAwardPresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function MilestoneModal({ state, doCloseMilestonePresentation }: any) {
  const pres = state.milestonePresentation;
  if (!pres) return null;
  return (
    <div className="modal-overlay" onClick={doCloseMilestonePresentation}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">⭐ Career Milestone</div>
        <div className="signing-emoji">⭐</div>
        <div className="signing-title">{pres.tier?.name || "New Tier"}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          {pres.tier?.tagline || ""}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Fans</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(pres.fans)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Fame</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{pres.fame?.toFixed(0)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: "center" }}>
            <div className="tip-text">Rep</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{pres.rep?.toFixed(0)}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime btn-block" onClick={doCloseMilestonePresentation}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export function ScenarioModal({ state, doResolveScenario }: any) {
  const id = state.pendingScenarioId;
  if (!id) return null;
  const scenario = RANDOM_SCENARIOS.find((s) => s.id === id);
  if (!scenario) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">{scenario.emoji} {scenario.title}</div>
        <div className="tip-text" style={{ marginBottom: 12, lineHeight: 1.6 }}>
          {scenario.body}
        </div>
        <div className="modal-footer">
          {scenario.choices.map((choice, i) => (
            <button
              key={i}
              className={i === 0 ? "btn btn-lime btn-block" : "btn btn-ghost btn-block"}
              onClick={() => doResolveScenario(id, i)}
            >
              <div>{choice.label}</div>
              {choice.sub && (
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>{choice.sub}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

 export function NewspaperModal({ state, dismissNewspaper, doResolveNewspaperResponse }: any) {
   if (!state.pendingNewspaperJson) return null;
   let news: any = {};
   try {
     news = JSON.parse(state.pendingNewspaperJson);
   } catch {
     return null;
   }

   const stories: any[] = news.stories || [];
   const letters: any[] = news.letters || [];
   const week = news.week || news.issueWeek || state.week;

   return (
     <div className="modal-overlay" onClick={dismissNewspaper}>
       <div className="modal-box newspaper-modal" onClick={(e) => e.stopPropagation()}>
         <div className="modal-title">📰 Nashville Times</div>
         <div className="newspaper-header">
           <div className="newspaper-issue">Issue {news.issue || 1}, Week {week}</div>
           <div className="newspaper-date">{news.weather || "No weather report"}</div>
         </div>
         {stories.length > 0 ? (
           <div className="newspaper-stories">
             {stories.map((story: any, i: number) => (
               <div key={i} className="newspaper-story">
                 <div className="newspaper-section">
                   {story.section}
                 </div>
                 <div className="newspaper-headline">
                   {story.headline}
                 </div>
                 <div className="newspaper-byline">
                   {story.byline}
                 </div>
                 <div className="newspaper-body">
                   {story.body}
                 </div>
                 {story.reputation?.type === "automatic" && story.reputation.repDelta ? (
                   <div className="tip-text" style={{ marginTop: 6, color: story.reputation.repDelta > 0 ? "var(--lime)" : "var(--red)" }}>
                     Reputation {story.reputation.repDelta > 0 ? "+" : ""}{story.reputation.repDelta}
                   </div>
                 ) : null}
                 {story.reputation?.type === "choice" && (
                   <div className="newspaper-response" style={{ marginTop: 10, display: "grid", gap: 6 }}>
                     {Number.isInteger(story.reputation.resolvedChoice) ? (
                       <div className="tip-text" style={{ color: "var(--lime)" }}>
                         Response sent: {story.reputation.choices?.[story.reputation.resolvedChoice]?.detail}
                       </div>
                     ) : (
                       story.reputation.choices?.map((choice: any, choiceIndex: number) => (
                         <button key={choice.label} className={choiceIndex === 0 ? "btn btn-lime btn-block" : "btn btn-ghost btn-block"} onClick={() => doResolveNewspaperResponse(i, choiceIndex)}>
                           <div>{choice.label}</div>
                           <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 400, marginTop: 2 }}>{choice.detail} ({choice.repDelta > 0 ? "+" : ""}{choice.repDelta} rep)</div>
                         </button>
                       ))
                     )}
                   </div>
                 )}
               </div>
             ))}
           </div>
         ) : (
           <div className="tip-text">No article content available.</div>
         )}
         {letters.length > 0 && (
           <div className="newspaper-letters-section">
             <div className="newspaper-section-divider">Letters to the Editor</div>
             {letters.map((letter: any, i: number) => (
               <div key={i} className="newspaper-letter">
                 <div className="newspaper-letter-body">
                   {letter.body}
                 </div>
                 <div className="newspaper-letter-signature">
                   -- {letter.signature}, {letter.city}
                 </div>
               </div>
             ))}
           </div>
         )}
         <div className="modal-footer">
           <button className="btn btn-lime btn-block" onClick={dismissNewspaper}>Continue</button>
         </div>
       </div>
     </div>
   );
 }

export function ArcModal({ state, doResolveArcChoice }: any) {
  if (!state.pendingArcChoice) return null;
  const { arcId, stepIndex } = state.pendingArcChoice;
  const arc = STORY_ARCS.find((a) => a.id === arcId);
  if (!arc) return null;
  const step = arc.steps[stepIndex];
  if (!step) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">{arc.emoji} {step.title}</div>
        <div style={{ fontSize: 11, color: "var(--amber)", fontFamily: "var(--mono)", marginBottom: 8 }}>
          {arc.title}
        </div>
        <div className="tip-text" style={{ marginBottom: 12, lineHeight: 1.6 }}>
          {step.body}
        </div>
        <div className="modal-footer">
          {step.choices.map((choice, i) => (
            <button
              key={i}
              className={i === 0 ? "btn btn-lime btn-block" : "btn btn-ghost btn-block"}
              onClick={() => doResolveArcChoice(arcId, i)}
            >
              <div>{choice.label}</div>
              {choice.sub && (
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>{choice.sub}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureModal({ state, doAcceptFeatureRequest, doDismissFeatureRequests }: any) {
  if (!state.pendingFeatureRequests?.length) return null;
  const req = state.pendingFeatureRequests[0];
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Feature Request</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <b>{req.featureName || req.artistName || "An artist"}</b> wants to feature on <b>"{req.trackTitle || "your track"}"</b>
          <div className="tip-text" style={{ marginTop: 8 }}>
            Fee: {fmtMoney(req.fee || 0)} • {req.weeksToRespond || 3} weeks to respond
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={() => doAcceptFeatureRequest(req.featureId)}>Accept</button>
          <button className="btn btn-ghost" onClick={doDismissFeatureRequests}>Decline</button>
        </div>
      </div>
    </div>
  );
}

export function ManagerOfferModal({ state, doAcceptManagerOffer, doDismissManagerOffers }: any) {
  if (!state.pendingManagerOffers?.length) return null;
  const offer = state.pendingManagerOffers[0];
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Manager Offer</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <b>{offer.name || offer.managerName || "A manager"}</b> wants to manage you.
          <div className="tip-text" style={{ marginTop: 8 }}>
            {fmtMoney(offer.weeklyFee || 0)}/wk • +{Math.round((offer.showRevPct || 0) * 100)}% show bonus
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={() => doAcceptManagerOffer(offer.managerId || offer.id)}>Sign</button>
          <button className="btn btn-ghost" onClick={doDismissManagerOffers}>Decline</button>
        </div>
      </div>
    </div>
  );
}

export function PressingModal({ state, doDismissPressing }: any) {
  if (!state.pendingPressing) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Pressing Opportunity</div>
        <div className="tip-text" style={{ marginBottom: 12 }}>
          A pressing opportunity awaits for "{state.pendingPressing.releaseTitle || "your release"}".
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={doDismissPressing}>Got It</button>
        </div>
      </div>
    </div>
  );
}

export { SignComponent, ReleaseCinematic };
