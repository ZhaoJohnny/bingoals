import BingoBoard from './components/BingoBoard';
import StartMenu from './components/StartMenu';
import { useState } from 'react';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerID, setPlayerID] = useState('');
  function handleStartGame(playerID, room) {
    setGameStarted(true);
    setRoomCode(room);
    setPlayerID(playerID);
  }
  function fetchBingoBoard() {
    // Fetch the bingo board data from the backend using the roomCode and playerID
    // This is a placeholder function; you would implement the actual fetch logic here
  }
  return (
    <div className="app">
      <h1 className="app-title">BINGOals</h1>
      {!gameStarted ? (
        <StartMenu onStart={handleStartGame} />
      ) : (
        <BingoBoard title="BOARD NAME" />
      )}
    </div>
  );
}

export default App;