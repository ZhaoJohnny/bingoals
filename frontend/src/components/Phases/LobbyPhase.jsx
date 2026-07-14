import PlayersList from '../components/PlayersList';
import ReadyButton from '../components/ReadyButton';
import '../styles/LobbyPhase.css';

function LobbyPhase({ boardID, boardState, onToggle }) {
  return (
    <div className="lobby-phase">
      <div className="lobby-center">
        <PlayersList boardID={boardID} />
      </div>
      <div className="lobby-bottom">
        <ReadyButton boardState={boardState} onToggle={onToggle} />
      </div>
    </div>
  );
}

export default LobbyPhase;