import { useState } from 'react';
import '../styles/StartMenu.css';

function StartMenu({ onStart }) {
    const [playerID, setPlayerID] = useState('');
    const [roomCode, setRoomCode] = useState('');

    function handleStartClick() {
        onStart(playerID, roomCode);
    }

  return (
    <div className="start-menu">
      <h2>Welcome to BINGOals!</h2>
      <input
        type="text"
        placeholder="Enter Player ID"
        value={playerID}
        onChange={(e) => setPlayerID(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <button onClick={handleStartClick}>Start Game</button>

    </div>
  );
}

export default StartMenu;