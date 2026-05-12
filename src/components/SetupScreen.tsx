import { useState } from "react";
import { ARCHETYPES, CITIES } from "../gameLogic";
import type { Genre } from "../gameLogic";

export default function SetupScreen(game: any) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<Genre>("Country");
  const [city, setCity] = useState("Nashville, TN");
  const [arch, setArch] = useState("outlaw");
  const canStart = name.trim().length > 0;

  return (
    <div style={{ padding: "24px 16px 40px" }}>
      <div className="pg-title" style={{ marginBottom: 16 }}>New Career</div>
      <div className="field">
        <label>Artist Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jolene Cash" />
      </div>
      <div className="field">
        <label>Genre</label>
        <div className="g2">
          {(["Country", "Blues"] as Genre[]).map((g) => (
            <button key={g} className={`btn ${genre === g ? "btn-lime" : ""}`} onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Hometown</label>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {CITIES.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
        </select>
      </div>
      <div className="field">
        <label>Archetype</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.values(ARCHETYPES).filter((a: any) => a.genre === genre).map((a: any) => (
            <div key={a.id} className={`pick-card ${arch === a.id ? "sel" : ""}`} onClick={() => setArch(a.id)}>
              <div>
                <div className="pick-name">{a.name}</div>
                <div className="pick-bio">{a.desc}</div>
                <div className="pick-meta">Bonus: {a.bonus}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn btn-lime btn-block" disabled={!canStart} onClick={() => game.startNewGame(name.trim(), genre, city, arch)} style={{ marginTop: 8 }}>
        Start Career
      </button>
      <button className="btn btn-ghost btn-block" onClick={game.goToMenu} style={{ marginTop: 8 }}>
        Cancel
      </button>
    </div>
  );
}
