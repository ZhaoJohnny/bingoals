import { useNavigate } from "react-router-dom";
import StartMenu from "../components/StartMenu";

function StartPage() {
  const navigate = useNavigate();

  async function handleCreateGame(playerID) {
    try {
      const response = await fetch("http://localhost:3001/api/create-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();

      navigate(`/board/${data.boardID}`);
    } catch (error) {
      console.error(error);
    }
  }

  function handleJoinGame(playerID, roomCode) {
    navigate(`/board/${roomCode}`);
  }

  return (
    <div>
      <StartMenu onCreate={handleCreateGame} onJoin={handleJoinGame} />
    </div>
  );
}

export default StartPage;