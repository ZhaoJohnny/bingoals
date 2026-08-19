// pages/BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import LobbyPhase from "../components/Phases/LobbyPhase";
import BingoBoard from "../components/BingoBoard";
import BingoButton from "../components/BingoButton";
import FinishButton from "../components/FinishButton";
import { getPlayerIDFromToken } from "../utils/decodeToken";

import socket from "../socket.js";
import "../styles/BoardPage.css";

function BoardPage() {
  const { boardID } = useParams();
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const myPlayerID = getPlayerIDFromToken();

  const location = useLocation();
  const code = location.state?.code;
  useEffect(() => {
    console.log("Joining socket board:", boardID);

    socket.emit("join-board", boardID);

    socket.on("connect", () => {
      console.log("Socket connected on frontend:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, [boardID]);

  useEffect(() => {
    function handlePlayerKicked({ kickedPlayerID }) {
      if (String(kickedPlayerID) === String(myPlayerID)) {
        navigate("/");
      }
    }

    socket.on("player-kicked", handlePlayerKicked);

    return () => {
      socket.off("player-kicked", handlePlayerKicked);
    };
  }, [boardID, myPlayerID, navigate]);

  async function onStart() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
      }
      if (!res.ok) {
        alert(data.message);
        return;
      }
    } catch (error) {
      console.error("Error starting game", error);
    }
  }

  async function loadBoardStatus() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/status`,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();
      if (res.status === 403 || res.status === 404) {
        navigate("/");
        return;
      }
      if (data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to get board status", err);
      navigate("/");
    }
  }

  async function onFinish() {
    try {
      const finishCreationResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/finish-creation`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await finishCreationResponse.json();
      
      if (data.success) {
        setStatus(data.status);
      }

    } catch (error) {
      console.error("Failed to finish creation phase", error);
    } 
  }

  async function handleBingo() {
    try {
      const statusResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/status`,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const statusData = await statusResponse.json();
      const status = statusData.status;
      if (status === "ended") {
        alert("Game has already ended.");
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/bingo`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await response.json();
      console.log("BINGO response:", data);
      if (data.success) {
        alert("BINGO!");
        setStatus(data.status);
      } else {
        alert("BINGO claim was not valid.");
      }
    } catch (error) {
      console.error("Error submitting BINGO:", error);
    }
  }
  const [text, setText] = useState('');
  async function saveSquareContent(index, content) {
    if (status !== 'creation') return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/square/${index}/bingo-square`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            boardID,
            index,
            content: text,

          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save bingo square');
        }
        setText('');
        console.log('Saved:', text);
      } catch (error) {
        console.error(error);
      }
    
  }
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSquareID, setSelectedSquareID] = useState(null);
  async function handleBingoSquareClick(squareID) {
    setShowPopup(true);
    setSelectedSquareID(squareID);
    console.log("Bingo square clicked:", squareID);
  }
    
  useEffect(() => {
    function handleBoardStatusUpdate(data) {
      if (String(data.boardID) === String(boardID)) {
        loadBoardStatus();
        console.log("Board status updated, reloading status:", boardID);
      }
    }
    loadBoardStatus();
    socket.on("board-updated", handleBoardStatusUpdate);
    return () => {
      socket.off("board-updated", handleBoardStatusUpdate);
    };
  }, [boardID, status]);

  if (status === 'lobby') {
    return (
      <LobbyPhase boardID={boardID} onStart = {onStart} code={code}/>
    );
  }
  if (status === "creation") {
    return (
      <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} prop = {handleBingoSquareClick}/>
      <FinishButton onFinish={onFinish}/>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <textarea
              className="popup-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button onClick={() => setShowPopup(false)}>
              Close
            </button>
            <button onClick={() => {saveSquareContent(selectedSquareID, text); setShowPopup(false);}}>
              Save
            </button>
          </div>
        </div>
      )}
      </div>
    );
  }
  if (status === "playing") {
    return (
      <div>
        <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
        <BingoButton onClick={handleBingo} />
      </div>
    );
  } else if (status === "ended") {
    return (
      <div>
        <BingoBoard title="BOARD NAME" boardID={boardID} status={status} />
        <h2>Game has ended.</h2>
      </div>
    );
  }
}

export default BoardPage;
