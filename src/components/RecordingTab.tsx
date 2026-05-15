import { useState } from "react";
import {
  PRODUCERS, STUDIOS, THEMES, FEATURES, fmtMoney,
  getProducerEffectiveCost, getProducerRelationship,
  getFeatureEffectiveCost, getHook, getLyric,
  computeAlbumWritingMix, genTrackName,
  type ReleaseType, type Genre, type HookStyle, type LyricStyle,
} from "../gameLogic";

export default function RecordingTab(game: any) {
  const s = game.state;
  const [view, setView] = useState<"list" | "new" | "project" | "unreleased">("list");

  if (view === "new") return <NewProjectForm {...game} onBack={() => setView("list")} />;
  if (s.project && view === "project") return <ActiveProject {...game} onBack={() => setView("list")} />;
  if (view === "unreleased") return <UnreleasedList {...game} onBack={() => setView("list")} />;

  return (
    <div>
      <div className="pg-hd"><div className="pg-title">Studio</div></div>
      {!s.project && (
        <button className="btn btn-lime btn-block" onClick={() => setView("new")}>
          Start New Project
        </button>
      )}
      {s.project && (
        <button className="btn btn-lime btn-block" onClick={() => setView("project")}>
          Continue Recording
        </button>
      )}
      {s.unreleased.length > 0 && (
        <button className="btn btn-block" onClick={() => setView("unreleased")}>
          Unreleased ({s.unreleased.length})
        </button>
      )}
      <div className="sec-div">Discography</div>
      {s.discography.length === 0 && (
        <div className="empty-state">No releases yet.</div>
      )}
      {s.discography.slice(0, 12).map((d: any) => (
        <div className="rel-card" key={d.id}>
          <div className="rel-hd">
            <div>
              <div className="rel-title">{d.title}</div>
              <div className="rel-meta">{d.type} • Week {d.releasedWeek}</div>
            </div>
            <span className={`tag ${d.outcome === "Viral" ? "t-gold" : d.outcome === "Hit" ? "t-lime" : d.outcome === "Moderate" ? "t-amber" : "t-rust"}`}>
              {d.outcome}
            </span>
          </div>
          <div className="rel-stats">
            <span>Q{d.avgQuality.toFixed(0)}</span>
            <span>{fmtMoney(d.revenue)}</span>
            <span>+{d.fansGained} fans</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewProjectForm({ doStartProject, onBack }: any) {
  const [type, setType] = useState<ReleaseType>("Single");
  return (
    <div>
      <div className="pg-title" style={{ marginBottom: 12 }}>New Project</div>
      <div className="g2" style={{ marginBottom: 16 }}>
        {(["Single", "EP", "Album", "Live Album"] as ReleaseType[]).map((t) => (
          <button
            key={t}
            className={`btn ${type === t ? "btn-lime" : ""}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <button className="btn btn-lime btn-block" onClick={() => { doStartProject(type); }}>
        Start Recording
      </button>
      <button className="btn btn-ghost btn-block" onClick={onBack}>Back</button>
    </div>
  );
}

function ActiveProject(game: any) {
  const {
    state, doUpdateProject, doAddTrack, doRemoveTrack,
    doFinishProject, doScrubProject, doTakeStudioBreak,
    doPushThrough, doCancelStudioChoice, onBack,
  } = game;

  const p = state.project!;
  const [trackName, setTrackName] = useState("");
  const [featId, setFeatId] = useState("");
  const [cowriterId, setCowriterId] = useState("");
  const [hook, setHook] = useState<HookStyle>("safe");
  const [lyric, setLyric] = useState<LyricStyle>("heartfelt");

  const prod = PRODUCERS.find((pr: any) => pr.id === p.producerId);
  const studio = STUDIOS.find((st: any) => st.id === p.studioId);
  const rel = prod ? getProducerRelationship(prod.id, state.producerWorkCounts) : null;

  const addTrack = () => {
    if (!trackName.trim()) return;
    doAddTrack(trackName.trim(), { featId: featId || undefined, hook, lyric, cowriterId: cowriterId || undefined });
    setTrackName("");
    setFeatId("");
    setCowriterId("");
    setHook("safe");
    setLyric("heartfelt");
  };

  const canFinish = p.tracks.length >= p.minTracks;

  return (
    <div>
      <div className="pg-title" style={{ marginBottom: 4 }}>{p.title}</div>
      <div className="pg-sub" style={{ marginBottom: 12 }}>
        {p.type} • {p.weeksLeft}wk left • {p.tracks.length} track{p.tracks.length !== 1 ? "s" : ""}
      </div>

      {/* Producer */}
      <div className="card">
        <div className="card-title">Producer</div>
        <div className="pick-card sel">
          <div>
            <div className="pick-name">{prod?.name ?? "Self"}</div>
            <div className="pick-bio">{prod?.bio ?? "DIY"}</div>
            {rel && rel.tier > 0 && (
              <div className="pick-meta" style={{ color: "var(--sage)" }}>
                {rel.label} • −{Math.round(rel.discountPct * 100)}% fee
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {PRODUCERS.filter((pr: any) => {
            const cost = getProducerEffectiveCost(pr, state.producerWorkCounts);
            const blocked = state.money < cost && p.producerId !== pr.id;
            return !blocked;
          }).map((pr: any) => (
            <button
              key={pr.id}
              className={`btn btn-sm ${p.producerId === pr.id ? "btn-lime" : ""}`}
              onClick={() => doUpdateProject({ producerId: pr.id })}
            >
              {pr.name} ({fmtMoney(getProducerEffectiveCost(pr, state.producerWorkCounts))})
            </button>
          ))}
        </div>
      </div>

      {/* Studio */}
      <div className="card">
        <div className="card-title">Studio</div>
        <div className="pick-card sel">
          <div>
            <div className="pick-name">{studio?.name ?? "Home Studio"}</div>
            <div className="pick-bio">{studio?.bio ?? "Free, always."}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {STUDIOS.filter((st: any) => st.tier <= 2 || (state.fame >= st.repReq && state.fans >= st.fanReq)).map((st: any) => (
            <button
              key={st.id}
              className={`btn btn-sm ${p.studioId === st.id ? "btn-lime" : ""}`}
              onClick={() => doUpdateProject({ studioId: st.id })}
            >
              {st.name} ({fmtMoney(st.perWeek)}/wk)
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <div className="card-title">Theme</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {THEMES.map((t: any) => (
            <button
              key={t.id}
              className={`btn btn-sm ${p.themeId === t.id ? "btn-lime" : ""}`}
              onClick={() => doUpdateProject({ themeId: t.id })}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="card">
        <div className="card-title">Tracks ({p.tracks.length}/{p.maxTracks})</div>
        {p.tracks.map((t: any, i: number) => (
          <div className="track-row" key={i}>
            <span className="t-num">{i + 1}</span>
            <span className="t-name">{t.name}</span>
            {t.featId && <span className="t-tag">feat. {FEATURES.find((f: any) => f.id === t.featId)?.name}</span>}
            {t.cowriterId && <span className="t-tag">w/ {FEATURES.find((f: any) => f.id === t.cowriterId)?.name}</span>}
            <button className="btn btn-sm btn-danger" onClick={() => doRemoveTrack(i)}>Remove</button>
          </div>
        ))}

        {p.tracks.length < p.maxTracks && (
          <div style={{ marginTop: 10 }}>
            {/* Track name input + random button */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Track name..."
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-sm"
                onClick={() => setTrackName(genTrackName())}
                title="Generate random track name"
              >
                🎲
              </button>
            </div>

            {/* Hook style */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {(["safe", "catchy", "experimental"] as HookStyle[]).map((h) => (
                <button
                  key={h}
                  className={`btn btn-sm ${hook === h ? "btn-lime" : ""}`}
                  onClick={() => setHook(h)}
                >
                  {getHook(h)?.icon} {getHook(h)?.name}
                </button>
              ))}
            </div>

            {/* Lyric style */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {(["party", "heartfelt", "literary"] as LyricStyle[]).map((l) => (
                <button
                  key={l}
                  className={`btn btn-sm ${lyric === l ? "btn-lime" : ""}`}
                  onClick={() => setLyric(l)}
                >
                  {getLyric(l)?.icon} {getLyric(l)?.name}
                </button>
              ))}
            </div>

            {/* Feature */}
            <select
              value={featId}
              onChange={(e) => { setFeatId(e.target.value); setCowriterId(""); }}
              style={{ marginBottom: 6, width: "100%" }}
            >
              <option value="">No feature</option>
              {FEATURES.filter((f: any) => f.genres.includes(state.genre) && state.fame >= f.fameR && state.rep >= f.repR && state.fans >= f.fanR).map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({fmtMoney(getFeatureEffectiveCost(f, state.featureWorkCounts))})
                </option>
              ))}
            </select>

            {/* Co-writer */}
            <select
              value={cowriterId}
              onChange={(e) => { setCowriterId(e.target.value); setFeatId(""); }}
              style={{ marginBottom: 6, width: "100%" }}
            >
              <option value="">No co-writer</option>
              {FEATURES.filter((f: any) => f.genres.includes(state.genre)).map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.name} (FREE — builds relationship)
                </option>
              ))}
            </select>

            <button className="btn btn-sm btn-lime" onClick={addTrack}>Add Track</button>
          </div>
        )}
      </div>

      {/* Album Mix */}
      {p.tracks.length > 0 && (
        <div className="card-sm" style={{ marginBottom: 10 }}>
          <div className="card-title">Album Mix</div>
          {(() => {
            const mix = computeAlbumWritingMix(p.tracks);
            return (
              <div style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.6 }}>
                Dominant hook: <b>{mix.dominantHook ?? "—"}</b> • Dominant lyric: <b>{mix.dominantLyric ?? "—"}</b><br />
                Stream mult: {(mix.streamMult * 100).toFixed(0)}% • Fan mult: {(mix.fanMult * 100).toFixed(0)}%<br />
                Critic bias: {mix.critRepBonus > 0 ? "+" : ""}{mix.critRepBonus}
              </div>
            );
          })()}
        </div>
      )}

      {/* This Week */}
      <div className="card">
        <div className="card-title">This Week</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={doTakeStudioBreak}>Take Break</button>
          <button className="btn btn-sm" onClick={doPushThrough}>Push Through</button>
          <button className="btn btn-sm btn-ghost" onClick={doCancelStudioChoice}>Cancel Choice</button>
        </div>
        <div className="tip-text" style={{ marginTop: 6 }}>
          Break = recover energy, no progress. Push = record if exhausted (burnout penalty).
        </div>
      </div>

      <button className="btn btn-lime btn-block" disabled={!canFinish} onClick={doFinishProject}>
        Finish Recording
      </button>
      <button className="btn btn-danger btn-block" onClick={doScrubProject} style={{ marginTop: 6 }}>
        Scrub Project
      </button>
      <button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 6 }}>
        Back
      </button>
    </div>
  );
}

function UnreleasedList(game: any) {
  const { state, doReleaseProject, doDeleteUnreleased, onBack } = game;
  return (
    <div>
      <div className="pg-title" style={{ marginBottom: 12 }}>Unreleased</div>
      {state.unreleased.length === 0 && (
        <div className="empty-state">Nothing in the vault.</div>
      )}
      {state.unreleased.map((p: any) => (
        <div className="rel-card" key={p.id}>
          <div className="rel-hd">
            <div>
              <div className="rel-title">{p.title}</div>
              <div className="rel-meta">{p.type} • Q{p.avgQuality.toFixed(0)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-sm btn-lime" onClick={() => doReleaseProject(p.id)}>
              Release
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => doDeleteUnreleased(p.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
      <button className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 12 }}>
        Back
      </button>
    </div>
  );
}
