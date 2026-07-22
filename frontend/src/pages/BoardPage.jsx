// pages/BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import LobbyPhase from "../components/phases/LobbyPhase";
import BingoBoard from "../components/BingoBoard";
import BingoButton from "../components/BingoButton";

function BoardPage() {
  const { boardID } = useParams();
  const [status, setStatus] = useState('');
  async function onStart() {
    try {
      const res = await fetch(`http://localhost:3001/api/board/${boardID}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setStatus('creation');
      } else {
        console.error('Failed to start', data.message);
      }
    } catch (error) {
      console.error('Error starting game', error);
    }
  }

  function handleReadyToggle() {
    loadBoardStatus();
  }

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
          console.log('Board status:', data.status);
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
  }, [boardID, status]);


  if (status === 'lobby') {
    return (
      <LobbyPhase boardID={boardID} onToggle={handleReadyToggle} onStart={onStart} />
    );
  }
  if (status === 'creation') {
    return (
      <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
      </div>
    );
  }
  if (status === 'playing') {
    return (
      <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
      <BingoButton onClick={handleBingo} />
      </div>
    );
  }
  else if(status === 'ended') {
    return (
      <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
      <h2>Game has ended.</h2>
      </div>
    );
  }
}

export default BoardPage;