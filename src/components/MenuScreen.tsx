import type { useGameState } from "../useGameState";

export default function MenuScreen(game: ReturnType<typeof useGameState>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: "100dvh", padding: "40px 20px" }}>
      <div className="animate-fadeInUp">
        <div style={{ fontFamily: "var(--head)", fontSize: 42, fontWeight: 900, fontStyle: "italic", color: "var(--amber)", marginBottom: 8, textShadow: "0 0 40px var(--amber-glow)" }}>
          Dusty Strings
        </div>
        <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 40, fontStyle: "italic" }}>
          A country & blues career simulation
        </div>
        {game.hasSave && (
          <button className="btn btn-lime btn-block" onClick={game.loadGame} style={{ marginBottom: 12, maxWidth: 280 }}>
            Continue Career
          </button>
        )}
        <button className="btn btn-block" onClick={game.goToSetup} style={{ marginBottom: 12, maxWidth: 280 }}>
          New Career
        </button>
        {game.hasSave && (
          <button className="btn btn-ghost btn-block" onClick={game.clearSave} style={{ maxWidth: 280 }}>
            Clear Save
          </button>
        )}
        <div style={{ marginTop: 40, fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
          v2.0 • Mobile-first • Save is local
        </div>
      </div>
    </div>
  );
}
