import PlayerList from "../PlayerList";
import ReadyButton from "../ReadyButton";
import "../../styles/LobbyPhase.css";

function LobbyPhase({ boardID, boardState, onToggle }) {
  return (
    <div className="lobby-phase">
      <div className="lobby-center">
        <PlayerList boardID={boardID} />
      </div>
      <div className="lobby-bottom">
        <ReadyButton boardState={boardState} onToggle={onToggle} />
      </div>
    </div>
  );
}

export default LobbyPhase;