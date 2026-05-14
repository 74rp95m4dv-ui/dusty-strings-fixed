import type { useGameState } from "../useGameState";

export default function MenuScreen(game: ReturnType<typeof useGameState>) {
return (
<div style={{ padding: "60px 20px 40px", textAlign: "center" }}>
<div style={{ fontFamily: "var(–head)", fontSize: 42, fontWeight: 900, fontStyle: "italic", color: "var(–amber)", marginBottom: 8 }}>
Dusty Strings
</div>
<div style={{ color: "var(–muted2)", fontSize: 13, marginBottom: 40, fontStyle: "italic" }}>
A country & blues career simulation
</div>
{game.hasSave && (
<button className="btn btn-lime btn-block" onClick={game.loadGame} style={{ marginBottom: 12 }}>
Continue Career
</button>
)}
<button className="btn btn-block" onClick={game.goToSetup} style={{ marginBottom: 12 }}>
New Career
</button>
{game.hasSave && (
<button className="btn btn-ghost btn-block" onClick={game.clearSave}>
Clear Save
</button>
)}
<div style={{ marginTop: 40, fontSize: 11, color: "var(–muted)", fontFamily: "var(–mono)" }}>
v1.0 • Mobile-first • Save is local
</div>
</div>
);
}