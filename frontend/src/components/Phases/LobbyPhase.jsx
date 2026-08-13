import PlayerList from "../PlayerList";
import ReadyButton from "../ReadyButton";
import "../../styles/LobbyPhase.css";
import StartButton from "../StartButton";
import LeaveButton from "../LeaveButton";

function LobbyPhase({ boardID, onStart, code }) {
  return (
    <div className="lobby-phase">
      <div className="lobby-top">
        <h2>Lobby</h2>
        <p>Board Code: {code}</p>
      </div>
      <div className="lobby-center">
        <PlayerList boardID={boardID}/>
      </div>
      <div className="lobby-bottom">
        <ReadyButton boardID={boardID}/>
      </div>
      <div className="lobby-bottom">
        <StartButton boardID={boardID} onStart={onStart}/>
      </div>
      <div className="leave-button">
        <LeaveButton boardID={boardID}/>
      </div>
    </div>
  );
}

export default LobbyPhase;