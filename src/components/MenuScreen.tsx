import type { useGameState } from "../useGameState";

export default function MenuScreen(game: ReturnType<typeof useGameState>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: "100dvh", padding: "40px 20px 100px", overflowY: "auto" }}>
      <div className="animate-fadeInUp">
        <div style={{ fontFamily: "var(--head)", fontSize: 42, fontWeight: 900, fontStyle: "italic", color: "var(--amber)", marginBottom: 8, textShadow: "0 0 40px var(--amber-glow)" }}>
          Dusty Strings
        </div>
        <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 40, fontStyle: "italic" }}>
          A country & blues career simulation
        </div>
        {game.saveIssue && (
          <section className="save-notice" role="alert" aria-live="assertive">
            <strong>Save recovery</strong>
            <p>{game.saveIssue}</p>
            <div className="save-notice-actions">
              <button className="btn btn-sm" onClick={game.restoreBackup}>Restore backup</button>
              <button className="btn btn-sm btn-ghost" onClick={game.dismissSaveIssue}>Dismiss</button>
            </div>
          </section>
        )}
        {game.hasSave && (
          <button className="btn btn-lime btn-block" onClick={game.loadGame} style={{ marginBottom: 12, maxWidth: 280 }}>
            Continue Career
          </button>
        )}
        <button className="btn btn-block" onClick={game.goToSetup} style={{ marginBottom: 12, maxWidth: 280 }}>
          New Career
        </button>
        {(game.hasSave || game.saveIssue) && (
          <button className="btn btn-ghost btn-block" onClick={game.clearSave} style={{ maxWidth: 280 }}>
            Reset Local Save
          </button>
        )}
        <section className="save-help" aria-label="How saves work">
          <strong>How saves work</strong>
          <p>Your career is stored only in this browser. Dusty Strings keeps a recent backup before every save; clearing browser data also removes both copies.</p>
        </section>
        <div style={{ marginTop: 40, fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
          v2.0 • Mobile-first • Save is local
        </div>
      </div>
    </div>
  );
}
