import { ReleasePresentation, fmt, fmtMoney, getArtworkTier, getWardrobe } from "@/game/gameLogic";

interface Props {
  data: ReleasePresentation;
  onClose: () => void;
}

const OUTCOME_COLOR: Record<string, string> = {
  Viral: "var(--gold)", Hit: "var(--amber)", Moderate: "var(--denim)", Flop: "var(--rust)",
};
const OUTCOME_BG: Record<string, string> = {
  Viral: "rgba(212,168,32,0.10)", Hit: "rgba(212,149,42,0.10)", Moderate: "rgba(74,127,165,0.10)", Flop: "rgba(192,68,44,0.10)",
};
const OUTCOME_HEADLINE: Record<string, string> = {
  Viral: "🔥 Went Viral", Hit: "⭐ It's a Hit", Moderate: "📻 Decent Reception", Flop: "💀 It Flopped",
};
const LIFECYCLE_INFO: Record<string, { emoji: string; label: string; color: string; desc: string }> = {
  Evergreen: { emoji: "🌲", label: "Evergreen", color: "var(--sage)",   desc: "Will stream for years"      },
  Hit:       { emoji: "⚡", label: "Hit Track", color: "var(--amber)",  desc: "Strong streams for months"  },
  Normal:    { emoji: "📌", label: "Normal",    color: "var(--muted2)", desc: "Standard decay curve"       },
};

export default function ReleaseScreen({ data, onClose }: Props) {
  const color = OUTCOME_COLOR[data.outcome] ?? "var(--amber)";
  const headline = OUTCOME_HEADLINE[data.outcome] ?? data.outcome;
  const lc = LIFECYCLE_INFO[data.lifecycle] ?? LIFECYCLE_INFO.Normal;
  const qColor = data.quality >= 75 ? "var(--sage)" : data.quality >= 50 ? "var(--amber)" : "var(--rust)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9500,
      background: "var(--bg)", display: "flex", flexDirection: "column",
      overflowY: "auto", WebkitOverflowScrolling: "touch" as any,
    }}>
      {/* Outcome stripe */}
      <div style={{ height: 4, background: color, flexShrink: 0 }} />

      {/* Title area */}
      <div style={{ padding: "22px 20px 12px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.22em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>
          New {data.type} · Week {data.week} · {data.genre}
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10, flexWrap: "wrap" }}>
          {data.artworkBudget && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9, color: "var(--amber)",
              border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {getArtworkTier(data.artworkBudget)?.name}
            </span>
          )}
          {data.wardrobeStyle && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9, color: "var(--sage)",
              border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {getWardrobe(data.wardrobeStyle)?.icon} {getWardrobe(data.wardrobeStyle)?.name}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--head)", fontSize: 30, fontWeight: 900, fontStyle: "italic", lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: 18, color: "var(--text)" }}>
          "{data.title}"
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 22px", borderRadius: 30,
          background: OUTCOME_BG[data.outcome], border: `2px solid ${color}50`,
          fontFamily: "var(--head)", fontStyle: "italic", fontSize: 20, fontWeight: 900,
          color,
        }}>
          {headline}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "14px 16px 10px" }}>
        <StatBox label="Revenue"  val={fmtMoney(data.revenue)}   color="var(--sage)" />
        <StatBox label="New Fans" val={"+" + fmt(data.fansGained)} color="var(--amber)" />
        <StatBox label="Fame"     val={(data.fameDelta >= 0 ? "+" : "") + Math.floor(data.fameDelta)}  color={data.fameDelta >= 0 ? "var(--sage)" : "var(--rust)"} />
        <StatBox label="Rep"      val={(data.repDelta >= 0 ? "+" : "") + Math.floor(data.repDelta)}    color={data.repDelta >= 0 ? "var(--sage)" : "var(--rust)"} />
      </div>

      {/* Quality + lifecycle */}
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
        <div style={{ flex: 2, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Quality Score</div>
          <div style={{ height: 6, background: "var(--bg4)", borderRadius: 3, marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${Math.min(100, data.quality)}%`, background: qColor, borderRadius: 3, transition: "width .7s ease" }} />
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: qColor }}>{Math.floor(data.quality)}/100</div>
        </div>
        <div style={{ flex: 1, background: "var(--bg2)", border: `1px solid ${lc.color}40`, borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 3 }}>{lc.emoji}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: lc.color, fontWeight: 700, letterSpacing: "0.05em" }}>{lc.label}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{lc.desc}</div>
        </div>
      </div>

      {/* Track list (EP / Album) */}
      {data.tracks.length > 1 && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Tracklist</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {data.tracks.map((t, i) => (
              <div key={i} style={{ padding: "3px 9px", background: "var(--bg3)", borderRadius: 4, fontSize: 10, color: "var(--text2)", border: "1px solid var(--border)" }}>
                {i + 1}. {t.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ margin: "0 16px 14px", borderTop: "1px solid var(--border)" }} />

      {/* Peak streams */}
      <div style={{ padding: "0 16px 12px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted2)" }}>
          Peak streams: <span style={{ color: "var(--amber)", fontWeight: 700 }}>{fmt(data.peakStreams)}/wk</span>
        </div>
      </div>

      {/* Wardrobe Reaction */}
      {data.wardrobeReaction && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: data.wardrobeReaction.reaction === "selling_out" ? "rgba(192,68,44,0.10)" : "rgba(120,160,110,0.10)",
            border: `1px solid ${data.wardrobeReaction.reaction === "selling_out" ? "var(--rust)" : "var(--sage)"}40`,
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: data.wardrobeReaction.reaction === "selling_out" ? "var(--rust)" : "var(--sage)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              {data.wardrobeReaction.reaction === "selling_out" ? "⚠ Fan Reaction" : data.wardrobeReaction.reaction === "evolution" ? "✦ Fan Reaction" : "✓ Fan Reaction"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.6 }}>
              {data.wardrobeReaction.msg}
            </div>
          </div>
        </div>
      )}

      {/* Press */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Press</div>
        <div style={{ padding: "12px 14px", background: "var(--bg2)", borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontFamily: "var(--head)", fontSize: 15, fontStyle: "italic", lineHeight: 1.6, color: "var(--text)", marginBottom: 5 }}>
            "{data.criticHeadline}"
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>— Industry Press</div>
        </div>
      </div>

      {/* Fan reactions */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Fan Reactions</div>
        {data.fanReviews.map((r, i) => (
          <div key={i} style={{ padding: "10px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", fontWeight: 700 }}>@{r.handle}</div>
              <div style={{ fontSize: 10, letterSpacing: 1 }}>
                <span style={{ color: "var(--gold)" }}>{"★".repeat(r.stars)}</span>
                <span style={{ color: "var(--bg5)" }}>{"★".repeat(5 - r.stars)}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.6 }}>"{r.text}"</div>
          </div>
        ))}
      </div>

      {/* Close */}
      <div style={{ padding: "0 16px", paddingBottom: "max(28px,env(safe-area-inset-bottom))" }}>
        <button
          className="btn btn-lime btn-block"
          style={{ padding: "15px", fontSize: 14, fontFamily: "var(--head)", fontStyle: "italic", fontWeight: 900 }}
          onClick={onClose}
        >
          Back to the Road →
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color }}>{val}</div>
    </div>
  );
}
