import { useGameState } from "./useGameState";
import MenuScreen from "./components/MenuScreen";
import SetupScreen from "./components/SetupScreen";
import GameScreen from "./components/GameScreen";

export default function App() {
  const game = useGameState();
  return (
    <div id="root-inner">
      {game.state.screen === "menu" && <MenuScreen {...game} />}
      {game.state.screen === "setup" && <SetupScreen {...game} />}
      {game.state.screen === "game" && <GameScreen {...game} />}
      {(game.state.screen === "gameover" || game.state.screen === "victory") && (
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-icon">🏁</div>
          <div className="pg-title" style={{ marginBottom: 12 }}>
            {game.state.screen === "victory" ? "You Made It" : "The Road Ends Here"}
          </div>
          <p className="pg-sub">{game.state.gameOverReason || "Your journey is complete."}</p>
          <button className="btn btn-lime btn-block" onClick={game.goToMenu} style={{ marginTop: 24 }}>Back to Menu</button>
        </div>
      )}
    </div>
  );
}
