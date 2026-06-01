import { useGameState } from "./useGameState";
import MenuScreen from "./components/MenuScreen";
import SetupScreen from "./components/SetupScreen";
import GameScreen from "./components/GameScreen";

export default function App() {
  const game = useGameState();
  return (
    <div className="app-shell">
      {game.state.screen === "menu" && <MenuScreen {...game} />}
      {game.state.screen === "setup" && <SetupScreen {...game} />}
      {game.state.screen === "game" && <GameScreen {...game} />}
    </div>
  );
}
