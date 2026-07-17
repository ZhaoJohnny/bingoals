import PlayerList from "../PlayerList";
import ReadyButton from "../ReadyButton";
import "../../styles/LobbyPhase.css";

function LobbyPhase({ boardID, playerID, onToggle }) {
  return (
    <div className="lobby-phase">
      <div className="lobby-center">
        <PlayerList boardID={boardID} />
      </div>
      <div className="lobby-bottom">
        <ReadyButton boardID={boardID} playerID={playerID} onToggle={onToggle} />
      </div>
    </div>
  );
}

export default LobbyPhase;