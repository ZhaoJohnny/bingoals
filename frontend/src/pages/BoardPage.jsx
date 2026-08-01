// pages/BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import LobbyPhase from "../components/Phases/LobbyPhase";
import BingoBoard from "../components/BingoBoard";
import BingoButton from "../components/BingoButton";
import FinishButton from "../components/FinishButton";

function BoardPage() {
  const { boardID } = useParams();
  const [status, setStatus] = useState('');

  async function onStart() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        
        setStatus(data.status);
      }
        if (!res.ok) {
      alert(data.message);
      return;
    }
    } catch (error) {
      console.error('Error starting game', error);
    }        
  }

  async function loadBoardStatus() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/status`, {
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

    async function onFinish() {
        try{
            const finishCreationResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/finish-creation`, {
                method: 'PUT',
                headers: {
                    authorization: `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const data = await finishCreationResponse.json();

            if (data.success) {
                setStatus(data.status);
            }
        } catch (error) {
            console.error("Failed to finish creation phase", error)
        }
    }

  async function handleBingo() {
    try {
      const statusResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/status`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/bingo`, {
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
      <LobbyPhase boardID={boardID} onStart = {onStart}/>
    );
  }
  if (status === 'creation') {
    return (
      <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
      <FinishButton onFinish={onFinish}/>
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