import { useGameState } from "./useGameState";
import MenuScreen from "./components/MenuScreen";
import SetupScreen from "./components/SetupScreen";
import GameScreen from "./components/GameScreen";

export default function App() {
  const game = useGameState();
  return (
    <div className="app-shell">
      {game.screen === "menu" && <MenuScreen {...game} />}
      {game.screen === "setup" && <SetupScreen {...game} />}
      {game.screen === "game" && <GameScreen {...game} />}
    </div>
  );
}
