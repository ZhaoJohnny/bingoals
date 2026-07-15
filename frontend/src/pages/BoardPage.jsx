// pages/BoardPage.jsx

import { useParams } from "react-router-dom";
import BingoBoard from "../components/BingoBoard";
import BingoButton from "../components/BingoButton";

function BoardPage() {
  const { boardID } = useParams();
  async function handleBingo() {
    try {
      const statusResponse = await fetch(`http://localhost:3001/api/board/${boardID}/status`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const statusData = await statusResponse.json();
      const status = statusData.status;
      if (status === 'ended') {
        alert("Game has already ended.");
        return;
      }
      const response = await fetch(`http://localhost:3001/api/board/${boardID}/bingo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        alert("BINGO!");
      }
      else {
        alert("BINGO claim was not valid.");
      }
    } catch (error) {
      console.error("Error submitting BINGO:", error);
    }
  }
  return (
    <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} />
      <h1><BingoButton onClick={handleBingo} /></h1>
    </div>
  );
}

export default BoardPage;