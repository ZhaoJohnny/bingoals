import BingoBoard from './components/BingoBoard';
import StartMenu from './components/StartMenu';
import { useState } from 'react';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerID, setPlayerID] = useState('');
  async function handleCreateGame(playerID) {
    
    try {
      const response = await fetch('http://localhost:3001/api/create-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerID: playerID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const data = await response.json();
      setRoomCode(data.roomCode);
      setPlayerID(playerID);
      setGameStarted(true);
    } catch (error) {
      console.error(error);
    }
  }
  function handleJoinGame(playerID, roomCode) {
    setPlayerID(playerID);
    setRoomCode(roomCode);
    setGameStarted(true);
  }
  return (
    <div className="app">
      <h1 className="app-title">BINGOals</h1>
      {!gameStarted ? (
        <StartMenu onCreate={handleCreateGame} onJoin={handleJoinGame} />
      ) : (
        <BingoBoard title="BOARD NAME" />
      )}
    </div>
  );
}

export default App;