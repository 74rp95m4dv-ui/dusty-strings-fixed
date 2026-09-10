import { useState } from "react";
import { ARCHETYPES, CITIES, generateRandomName } from "../gameLogic";
import type { Genre } from "../gameLogic";
import ActionCard from "./ui/ActionCard";

export default function SetupScreen(game: any) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<Genre>("Country");
  const [city, setCity] = useState("Nashville, TN");
  const [arch, setArch] = useState("outlaw");
  const [origin, setOrigin] = useState<"standard" | "street_hustle">("standard");

  const canStart = name.trim().length > 0;

  const handleStart = () => {
    if (typeof game?.startNewGame !== "function") {
      console.error("startNewGame is not a function.", game);
      return;
    }
    game.startNewGame(name.trim(), genre, city, arch, origin);
  };

  return (
    <div className="setup-screen">
      <div className="animate-fadeIn">
        <div className="setup-kicker">Start a new chapter</div>
        <div className="pg-title" style={{ marginBottom: 6 }}>Build your act</div>
        <p className="setup-intro">Choose the sound and hometown that shape your first opportunities. You can change direction later, but your origin story stays with you.</p>

        <div className="field">
          <label htmlFor="artist-name">Artist Name</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="artist-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name or roll the dice" style={{ flex: 1 }} />
            <button type="button" className="btn" onClick={() => setName(generateRandomName())} title="Generate random name" aria-label="Generate random artist name">🎲</button>
          </div>
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
          <label htmlFor="hometown">Hometown</label>
          <select id="hometown" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Archetype</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.values(ARCHETYPES)
              .filter((a: any) => a.genre === genre)
              .map((a: any) => (
                <ActionCard key={a.id} className={arch === a.id ? "sel" : ""} onClick={() => setArch(a.id)} aria-pressed={arch === a.id}>
                  <div>
                    <div className="pick-name">{a.name}</div>
                    <div className="pick-bio">{a.desc}</div>
                    <div className="pick-meta">Career edge: {a.bonus}</div>
                  </div>
                </ActionCard>
              ))}
          </div>
        </div>

        <div className="field">
          <label>Career Origin</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ActionCard className={origin === "standard" ? "sel" : ""} onClick={() => setOrigin("standard")} aria-pressed={origin === "standard"}>
              <div><div className="pick-name">Standard Start</div><div className="pick-bio">$1,500 and the normal gentle overhead ramp. Start by recording, playing shows, and building your catalog.</div></div>
            </ActionCard>
            <ActionCard className={origin === "street_hustle" ? "sel" : ""} onClick={() => setOrigin("street_hustle")} aria-pressed={origin === "street_hustle"}>
              <div><div className="pick-name">Street Hustle</div><div className="pick-bio">$750, a legal Street Circuit, weekly lodging choices, a DIY Single unlock, and a contact-backed Micro Route.</div></div>
            </ActionCard>
          </div>
        </div>

        <button className="btn btn-lime btn-block" disabled={!canStart} onClick={handleStart}>
          Start Career
        </button>
        <button className="btn btn-ghost btn-block" onClick={game?.goToMenu} style={{ marginTop: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
