import { useState } from 'react';
import '../styles/StartMenu.css';

function StartMenu({ onCreate, onJoin }) {
    const [playerID, setPlayerID] = useState('');
    const [roomCode, setRoomCode] = useState('');

    function handleJoinClick() {
         if (!playerID || !roomCode) {
            alert('Please enter a player name and room code');
            return;
        }
        onJoin(playerID, roomCode);
    }
    function handleCreateClick() {
        if (!playerID) {
            alert('Please enter a player name');
            return;
        }
        onCreate(playerID);
    }

  return (
    <div className="start-menu">
  <h2>Welcome to BINGOals!</h2>

  <div className="menu-section">
    <h3>Join Game</h3>

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

    <button onClick={handleJoinClick}>Join Game</button>
  </div>

  <div className="menu-section">
    <h3>Create Game</h3>

    <input
      type="text"
      placeholder="Enter Player ID"
      value={playerID}
      onChange={(e) => setPlayerID(e.target.value)}
    />

    <button onClick={handleCreateClick}>Create Game</button>
  </div>
</div>
  );
}

export default StartMenu;