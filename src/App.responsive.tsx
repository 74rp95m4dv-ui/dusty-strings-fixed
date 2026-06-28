import { useGameState } from "./useGameState";
import MenuScreen from "./components/MenuScreen";
import SetupScreen from "./components/SetupScreen";
import GameScreen from "./components/GameScreen";
import { ResponsiveAppShell } from "./components/ui/ResponsiveAppShell";

export default function App() {
  const game = useGameState();
  return (
    <ResponsiveAppShell className="app-shell">
      {game.state.screen === "menu" && <MenuScreen {...game} />}
      {game.state.screen === "setup" && <SetupScreen {...game} />}
      {game.state.screen === "game" && <GameScreen {...game} />}
    </ResponsiveAppShell>
  );
}