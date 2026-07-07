  import { Routes, Route } from "react-router-dom";
  import StartPage from "./pages/StartPage";
  import BoardPage from "./pages/BoardPage";

function StartMenuPage() {
  const navigate = useNavigate();

  async function handleCreateGame(playerID) {
    try {
      const response = await fetch("http://localhost:3001/api/create-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerID: playerID,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();

      navigate(`/board/${data.boardID}`, {
        state: {
          playerID: playerID,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  function handleJoinGame(playerID, boardID) {
    navigate(`/board/${boardID}`, {
      state: {
        playerID: playerID,
      },
    });
  }
  function App() {
    return (
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/board/:roomCode" element={<BoardPage />} />
      </Routes>
    );
  }

  export default App;


function BingoBoardPage() {
  const { boardID } = useParams();

  return <BingoBoard title="BOARD NAME" boardID={boardID} />;
}
  // import BingoBoard from './components/BingoBoard';
  // import StartMenu from './components/StartMenu';
  // import { useState } from 'react';
  // import './App.css';

  // function App() {
  //   const [gameStarted, setGameStarted] = useState(false);
  //   const [roomCode, setRoomCode] = useState('');
  //   const [playerID, setPlayerID] = useState('');
  //   async function handleCreateGame(playerID) {
      
  //     try {
  //       const response = await fetch('http://localhost:3001/api/create-game', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           playerID: playerID,
  //         }),
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to create game');
  //       }

      <Routes>
        <Route path="/" element={<StartMenuPage />} />
        <Route path="/board/:boardID" element={<BingoBoardPage />} />
      </Routes>
    </div>
  );
}

  // export default App;