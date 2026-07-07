import { Routes, Route, useNavigate, useParams } from "react-router-dom";
  import StartPage from "./pages/StartPage";
  import BoardPage from "./pages/BoardPage";
  import LoginPage from "./pages/LoginPage";
  import SignUpPage from "./pages/SignUpPage";
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

  return <StartMenu onCreate={handleCreateGame} onJoin={handleJoinGame} />;
}

function BingoBoardPage() {
  const { boardID } = useParams();

  return <BingoBoard title="BOARD NAME" boardID={boardID} />;
}

function App() {
  return (
    <div className="app">
      <h1 className="app-title">BINGOals</h1>

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/board/:boardID" element={<BoardPage />} />
      </Routes>
    </div>
  );
}

export default App;