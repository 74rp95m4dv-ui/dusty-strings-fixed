import { useState } from "react";
import { fmt, fmtMoney, buildChart, STREAMING_PLATFORMS, BASE_STREAMING_RATE, SPOTIFY_MIN_STREAMS, GEO_RATE_MODIFIERS } from "../gameLogic";

export default function StreamingTab(game: any) {
  const { state, doPromoteTrack, doShootMusicVideo } = game;
  const [sub, setSub] = useState<"catalog" | "chart" | "analytics">("catalog");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const totalWeeklyStreams = state.catalog.reduce((s: number, t: any) => s + (t.weeklyStreams || 0), 0);
  const totalWeeklyRevenue = state.catalog.reduce((s: number, t: any) => s + (t.streamStats?.weeklyRevenue || 0), 0);
  const avgRate = totalWeeklyStreams > 0 ? totalWeeklyRevenue / totalWeeklyStreams : 0;

  return (
    <div>
      <div className="pg-hd">
        <div className="pg-title">Music</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          {fmt(totalWeeklyStreams)} streams this week · {fmtMoney(totalWeeklyRevenue)} · ~{avgRate.toFixed(4)}¢/stream
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 12 }}>
        <button className={`btn ${sub === "catalog" ? "btn-lime" : ""}`} onClick={() => setSub("catalog")}>Catalog</button>
        <button className={`btn ${sub === "chart" ? "btn-lime" : ""}`} onClick={() => setSub("chart")}>Charts</button>
        <button className={`btn ${sub === "analytics" ? "btn-lime" : ""}`} onClick={() => setSub("analytics")}>Analytics</button>
      </div>

      {/* ── CATALOG VIEW ── */}
      {sub === "catalog" && (
        <div>
          {state.catalog.length === 0 && (
            <div className="empty-state">No releases in catalog. Record something!</div>
          )}
          {state.catalog.map((c: any) => {
            const stats = c.streamStats || {};
            const fillPct = c.peakStreams > 0 ? Math.min(100, (c.weeklyStreams / c.peakStreams) * 100) : 0;
            const isSelected = selectedTrack === c.id;
            const hitThreshold = c.totalStreams >= SPOTIFY_MIN_STREAMS;
            const spotifyShare = Math.round((c.platformMix?.spotify || 0.52) * 100);
            const appleShare = Math.round((c.platformMix?.apple || 0.22) * 100);

            return (
              <div className="card" key={c.id} style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => setSelectedTrack(isSelected ? null : c.id)}>
                <div className="rel-hd">
                  <div>
                    <div className="rel-title">{c.title}</div>
                    <div className="rel-meta">
                      {c.type} · {c.lifecycle} · W{c.releasedWeek}
                      {!hitThreshold && (
                        <span style={{ color: "var(--rust)", marginLeft: 8 }}>
                          ⚠ {fmt(SPOTIFY_MIN_STREAMS - c.totalStreams)} to Spotify threshold
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`tag ${c.lifecycle === "Evergreen" ? "t-gold" : c.lifecycle === "Hit" ? "t-lime" : "t-gray"}`}>
                    {c.lifecycle}
                  </span>
                </div>

                <div style={{ marginTop: 8 }}>
                  {/* Stream bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--mono)" }}>
                    <span>Weekly: {fmt(c.weeklyStreams)}</span>
                    <span>Peak: {fmt(c.peakStreams)}</span>
                    <span>Total: {fmt(c.totalStreams)}</span>
                  </div>
                  <div className="stream-bar-track">
                    <div className="stream-bar-fill" style={{ width: `${fillPct}%` }} />
                  </div>

                  {/* Revenue & rate */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6, color: "var(--sage)" }}>
                    <span>This week: {fmtMoney(stats.weeklyRevenue || 0)}</span>
                    <span>Lifetime: {fmtMoney(stats.lifetimeRevenue || 0)}</span>
                    <span>Rate: {stats.effectiveRate?.toFixed(4) || BASE_STREAMING_RATE.toFixed(4)}¢/stream</span>
                  </div>

                  {/* Platform mix mini */}
                  <div style={{ display: "flex", gap: 4, marginTop: 6, fontSize: 10 }}>
                    <span style={{ color: "#1DB954" }}>● Spotify {spotifyShare}%</span>
                    <span style={{ color: "#FA243C" }}>● Apple {appleShare}%</span>
                    <span style={{ color: "var(--muted)" }}>● Premium {(Math.round((c.premiumRatio || 0.45) * 100))}%</span>
                  </div>

                  {/* Expanded details */}
                  {isSelected && (
                    <div style={{ marginTop: 10, padding: 8, background: "var(--panel)", borderRadius: 6, fontSize: 11 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Platform Breakdown</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                        {STREAMING_PLATFORMS.map((plat: any) => {
                          const share = Math.round((c.platformMix?.[plat.id] || 0) * 100);
                          const platStreams = Math.floor(c.weeklyStreams * (c.platformMix?.[plat.id] || 0));
                          const platRate = plat.ratePerStream;
                          return (
                            <div key={plat.id} style={{ padding: "4px 6px", background: "var(--card)", borderRadius: 4 }}>
                              <div style={{ fontWeight: 500 }}>{plat.name}</div>
                              <div style={{ color: "var(--muted)", fontSize: 10 }}>{share}% · {fmt(platStreams)} streams</div>
                              <div style={{ color: "var(--sage)", fontSize: 10 }}>{platRate.toFixed(4)}¢/stream</div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: 10, fontWeight: 600, fontSize: 12 }}>Geographic Distribution</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {Object.entries(c.geoDist || {}).map(([country, share]: [string, any]) => (
                          <span key={country} style={{ padding: "2px 6px", background: "var(--card)", borderRadius: 4, fontSize: 10 }}>
                            {country}: {Math.round(share * 100)}%
                          </span>
                        ))}
                      </div>

                      <div style={{ marginTop: 10, fontWeight: 600, fontSize: 12 }}>Revenue History (last 8 weeks)</div>
                      <div style={{ display: "flex", gap: 2, marginTop: 4, alignItems: "flex-end", height: 40 }}>
                        {(stats.revenueHistory || []).slice(-8).map((rh: any, i: number) => {
                          const maxRev = Math.max(...(stats.revenueHistory || []).slice(-8).map((r: any) => r.revenue), 1);
                          const h = Math.max(4, (rh.revenue / maxRev) * 36);
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{ width: "100%", height: h, background: "var(--sage)", borderRadius: "2px 2px 0 0" }} />
                              <div style={{ fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{fmtMoney(rh.revenue)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      className="btn btn-sm"
                      disabled={state.money < 350 || c.promoted}
                      onClick={(e) => { e.stopPropagation(); doPromoteTrack(c.id); }}
                    >
                      Promote ($350)
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={state.money < 1200 || c.hasMusicVideo}
                      onClick={(e) => { e.stopPropagation(); doShootMusicVideo(c.id); }}
                    >
                      Video ($1.2k)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CHART VIEW ── */}
      {sub === "chart" && (
        <div>
          {(() => {
            const chart = buildChart(state.catalog, state.week);
            const mySongs = chart.filter((e: any) => e.isMe);
            return (
              <>
                <div className="card">
                  <div className="card-title">Your Chart Position</div>
                  {mySongs.length === 0 && (
                    <div style={{ fontSize: 12 }}>No charting songs this week.</div>
                  )}
                  {mySongs.map((e: any) => (
                    <div key={e.id} className="chart-row" style={{ borderColor: "var(--amber)" }}>
                      <div className={`chart-pos ${e.pos <= 3 ? "top3" : ""}`}>#{e.pos}</div>
                      <div style={{ flex: 1, fontSize: 13 }}>{e.title}</div>
                      <div style={{ fontSize: 11, fontFamily: "var(--mono)" }}>{fmt(e.streams)}</div>
                    </div>
                  ))}
                </div>
                <div className="sec-div">Top 20</div>
                {chart.slice(0, 20).map((e: any) => (
                  <div className="chart-row" key={`${e.pos}-${e.title}`}>
                    <div className={`chart-pos ${e.pos <= 3 ? "top3" : ""}`}>#{e.pos}</div>
                    <div style={{ flex: 1, fontSize: 13, opacity: e.isMe ? 1 : 0.8 }}>{e.title}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>{e.artist}</div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* ── ANALYTICS VIEW ── */}
      {sub === "analytics" && (
        <div>
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="card-title">Streaming Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginTop: 8 }}>
              <div style={{ padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                <div style={{ color: "var(--muted)", fontSize: 10 }}>Weekly Streams</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)" }}>{fmt(totalWeeklyStreams)}</div>
              </div>
              <div style={{ padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                <div style={{ color: "var(--muted)", fontSize: 10 }}>Weekly Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--sage)" }}>{fmtMoney(totalWeeklyRevenue)}</div>
              </div>
              <div style={{ padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                <div style={{ color: "var(--muted)", fontSize: 10 }}>Avg Rate</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{avgRate.toFixed(4)}¢</div>
                <div style={{ fontSize: 9, color: "var(--muted)" }}>per stream</div>
              </div>
              <div style={{ padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                <div style={{ color: "var(--muted)", fontSize: 10 }}>Lifetime Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--sage)" }}>{fmtMoney(state.totalStreamingRevenue || 0)}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 10 }}>
            <div className="card-title">Platform Mix (Career Average)</div>
            <div style={{ marginTop: 8 }}>
              {STREAMING_PLATFORMS.map((plat: any) => {
                const share = Math.round((state.platformMix?.[plat.id] || 0) * 100);
                return (
                  <div key={plat.id} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ width: 80, fontSize: 11, fontWeight: 500 }}>{plat.name}</div>
                    <div style={{ flex: 1, height: 8, background: "var(--track)", borderRadius: 4, marginRight: 8 }}>
                      <div style={{ width: `${share}%`, height: "100%", background: "var(--sage)", borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 50, fontSize: 11, fontFamily: "var(--mono)", textAlign: "right" }}>{share}%</div>
                    <div style={{ width: 60, fontSize: 10, color: "var(--muted)", textAlign: "right" }}>{plat.ratePerStream.toFixed(4)}¢</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Geographic Distribution</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {Object.entries(state.geoDist || {}).map(([country, share]: [string, any]) => (
                <div key={country} style={{ padding: "4px 10px", background: "var(--panel)", borderRadius: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 500 }}>{country}</span>
                  <span style={{ color: "var(--muted)", marginLeft: 4 }}>{Math.round((share as number) * 100)}%</span>
                  <span style={{ color: "var(--sage)", marginLeft: 4, fontSize: 10 }}>
                    {(BASE_STREAMING_RATE * ((STREAMING_PLATFORMS as any).GEO_RATE_MODIFIERS?.[country] || 0.85)).toFixed(4)}¢
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
