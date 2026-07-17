// pages/BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import BingoBoard from "../components/BingoBoard";
import BingoButton from "../components/BingoButton";

function BoardPage() {
  const { boardID } = useParams();
  const [status, setStatus] = useState('');
  async function loadBoardStatus() {
      try {
        const res = await fetch(`http://localhost:3001/api/board/${boardID}/status`, {
          headers: {
            authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setStatus(data.status);
        }
      } catch (err) {
        console.error('Failed to get board status', err);
      }
    }
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
        setStatus('ended');
      }
      else {
        alert("BINGO claim was not valid.");
      }
    } catch (error) {
      console.error("Error submitting BINGO:", error);
    }
  }
  useEffect(() => {
  loadBoardStatus();
  }, [boardID]);
  return (
    <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
      <h1><BingoButton onClick={handleBingo} /></h1>
    </div>
  );
}

export default BoardPage;