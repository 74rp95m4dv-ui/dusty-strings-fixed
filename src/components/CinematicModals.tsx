import React from "react";

// Release Presentation Cinematic Component - This will be a simple wrapper that shows regular modal content
export function ReleaseCinematic({ 
  state, 
  doCloseReleasePresentation,
  isTourWrap = false
}: any) {
  const pres = isTourWrap ? state.tourWrapPresentation : state.releasePresentation;
  
  if (!pres) return null;

  const handleContinue = () => {
    doCloseReleasePresentation();
  };

  // Determine the title based on type
  const title = isTourWrap ? "Tour Complete" : "Album Released";
  const subtitle = isTourWrap ? pres.tourName || "Tour Wrap" : pres.albumTitle || "New Release";

  return (
    <div className="modal-overlay" onClick={handleContinue}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        
        {/* Main content */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div className="signing-emoji">🎵</div>
          <div className="signing-title">{subtitle}</div>
          
          {isTourWrap ? (
            <>
              <div className="city-name">Tour Statistics</div>
              <div className="venue-name">{pres.completedShows} shows • {pres.cancelledShows > 0 ? `${pres.cancelledShows} cancelled • ` : ""}Week {pres.week}</div>
              
              {/* Tour stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Gross</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatMoney(pres.grossRevenue)}</div>
                </div>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Expenses</div>
                  <div className="text-rust" style={{ fontSize: 16, fontWeight: 700 }}>{formatMoney(pres.totalExpenses)}</div>
                </div>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Net Profit</div>
                  <div className={pres.netProfit >= 0 ? "text-sage" : "text-rust"} style={{ fontSize: 16, fontWeight: 700 }}>
                    {formatMoney(pres.netProfit)}
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
            </>
          ) : (
            <>
              {/* Release stats */}
              <div className="city-name">Album Statistics</div>
              <div className="venue-name">{pres.genre} • {pres.releaseDate}</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Streams</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatNumber(pres.streams)}</div>
                </div>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Peak Chart</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{pres.peakChartPosition}</div>
                </div>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Sales</div>
                  <div className="text-sage" style={{ fontSize: 16, fontWeight: 700 }}>
                    {formatNumber(pres.sales)}
                  </div>
                </div>
                <div className="card-sm" style={{ textAlign: "center" }}>
                  <div className="tip-text">Rating</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{pres.rating}/5 ⭐</div>
                </div>
              </div>
              
              {/* Track listing */}
              <div className="cinematic-marquee">
                <div className="marquee-border">
                  <div className="marquee-light"></div>
                  <div className="marquee-light"></div>
                  <div className="marquee-light"></div>
                  <div className="marquee-light"></div>
                  <div className="marquee-light"></div>
                  <div className="marquee-text">
                    <div className="artist-name">Artist: {state.artistName}</div>
                    <div className="tour-title">{pres.albumTitle}</div>
                    <div className="live-today">Release Date: {pres.releaseDate}</div>
                    <div className="city">Tracks:</div>
                    {pres.tracks && pres.tracks.map((track: any, index: number) => (
                      <div key={index} style={{ fontSize: 12, margin: '4px 0' }}>
                        {index + 1}. {track.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          
          <button 
            className="btn btn-lime btn-block"
            onClick={handleContinue}
            style={{ marginTop: 20 }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function for formatting money
function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

// Helper function for formatting numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return `${num}`;
}