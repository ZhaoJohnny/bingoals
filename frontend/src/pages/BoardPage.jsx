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
import PlayerList from "../components/PlayerList.jsx";
import CreationPopup from "../components/CreationPopup.jsx";
import PlayingPopup from "../components/PlayingPopup.jsx";

function BoardPage() {
  const { boardID } = useParams();
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const myPlayerID = getPlayerIDFromToken();

  const location = useLocation();
  const code = location.state?.code;
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    console.log("Joining socket board:", boardID);
    setLoading(true);

    socket.emit("join-board", boardID);

    socket.on("connect", () => {
      console.log("Socket connected on frontend:", socket.id);
      setLoading(false);
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
  async function loadBoardStatusWithoutJump() {
  const scrollY = window.scrollY;

  await loadBoardStatus();

  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
  });
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
      
      if (data.success && data.status && data.status != status) {
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
  const [text, setText] = useState("");
  async function saveSquareContent(index, content) {
    if (status !== "creation") return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/square/${index}/bingo-square`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            boardID,
            index,
            content: text,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save bingo square");
      }
      setText("");

    } catch (error) {
      console.error(error);
    }
  }
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSquareID, setSelectedSquareID] = useState(null);
  async function handleBingoSquareClick(squareID, content) {
    setShowPopup(true);
    setSelectedSquareID(squareID);
    setText(content);

  }
  const [showPlayPopup, setShowPlayPopup] = useState(false);
  const [selectedSquareMarked, setSelectedSquareMarked] = useState(false);
  async function handlePlayBingoSquareClick(squareID, content, marked) {
    setShowPlayPopup(true);
    setSelectedSquareID(squareID);
    setText(content);
    setSelectedSquareMarked(marked);

  }
  async function markSquareClick(index) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/square/${index}/toggle-marker`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        return data;
      }
    } catch (error) {
      console.error("Failed to toggle marker:", error);
    }
  }

  useEffect(() => {
    function handleBoardStatusUpdate(data) {
      if (String(data.boardID) === String(boardID)) {
        loadBoardStatusWithoutJump();
        console.log("Board status updated, reloading status:", boardID);
      }
    }
    loadBoardStatusWithoutJump();
    socket.on("board-updated", handleBoardStatusUpdate);
    return () => {
      socket.off("board-updated", handleBoardStatusUpdate);
    };
  }, [boardID, status]);
  const [countdown, setCountdown] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  useEffect(() => {
  function handleCountdownStarted(data) {
    if (String(data.boardID) === String(boardID)) {
      setCountdown(data.seconds);
    }
  }

  function handleCountdownCancelled(data) {
    if (String(data.boardID) === String(boardID)) {
      setCountdown(null);
    }
  }

  socket.on("countdown-started", handleCountdownStarted);
  socket.on("countdown-cancelled", handleCountdownCancelled);

  return () => {
    socket.off("countdown-started", handleCountdownStarted);
    socket.off("countdown-cancelled", handleCountdownCancelled);
  };
}, [boardID]);
useEffect(() => {
  if (countdown === null) return;

  if (countdown <= 0) return;

  const timer = setTimeout(() => {
    setCountdown((prev) => prev - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [countdown]);
  
  if (status === 'lobby') {
    return (
      <div className="loading">
        <p>loading...</p>
      </div>
    );
  }
  if (status === "lobby") {
    return <LobbyPhase boardID={boardID} onStart={onStart} code={code} />;
  }
  if (status === "creation") {
    return (
      <div className = "creation-page">
      <BingoBoard title="BOARD NAME" boardID={boardID} status={status} bingoSquareClick = {handleBingoSquareClick}/>
      <PlayerList boardID = {boardID} showKick = {false} variant ="creation"/>
      <div className="finish-row">
        <FinishButton onFinish={onFinish} />

        <div className={countdown !== null && countdown > 0 ? "countdown visible" : "countdown"}>
          {countdown !== null && countdown > 0 && (
            <>
              <span>Game starting in...</span>
              <strong>{countdown}</strong>
            </>
          )}
      </div>
</div>
  

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
      <div>
        <BingoBoard
          title="BOARD NAME"
          boardID={boardID}
          status={status}
          bingoSquareClick={handleBingoSquareClick}
        />
        <FinishButton onFinish={onFinish} />
        {showPopup && (
          <CreationPopup
            setText={setText}
            setShowPopup={setShowPopup}
            saveSquareContent={saveSquareContent}
            text={text}
            selectedSquareID={selectedSquareID}
          />
        )}
      </div>
    );
  }
  if (status === "playing") {
    return (
      <div>
        <BingoBoard
          title="BOARD NAME"
          boardID={boardID}
          status={status}
          bingoSquareClick={handlePlayBingoSquareClick}
          markSquareClick={markSquareClick}
        />
        <BingoButton onClick={handleBingo} />
        {showPlayPopup && (
          <PlayingPopup
            setShowPlayPopup={setShowPlayPopup}
            markSquareClick={markSquareClick}
            selectedSquareMarked={selectedSquareMarked}
            text={text}
            selectedSquareID={selectedSquareID}
          />
        )}
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
