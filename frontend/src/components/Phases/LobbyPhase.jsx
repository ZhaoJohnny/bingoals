import PlayerList from "../PlayerList";
import ReadyButton from "../ReadyButton";
import "../../styles/LobbyPhase.css";
import StartButton from "../StartButton";

function LobbyPhase({ boardID, onToggle, onStart }) {
  return (
    <div className="lobby-phase">
      <div className="lobby-center">
        <PlayerList boardID={boardID} />
      </div>
      <div className="lobby-bottom">
        <ReadyButton boardID={boardID} onToggle={onToggle} />
      </div>
      <div className="lobby-bottom">
        <StartButton boardID={boardID} onStart={onStart}/>
      </div>
    </div>
  );
}

export default LobbyPhase;