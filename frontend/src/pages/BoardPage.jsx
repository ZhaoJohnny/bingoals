// pages/BoardPage.jsx

import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import LobbyPhase from "../components/phases/LobbyPhase";
import BingoBoard from "../components/BingoBoard";

function BoardPage() {
  const { boardID } = useParams();
  const location = useLocation();
  const playerID = location.state?.playerID;

  const [boardState, setBoardState] = useState('addingGoals');

  function handleReadyClick() {
    setBoardState(boardState === 'addingGoals' ? 'playing' : 'addingGoals');
  }

  return (
    <div>
      {boardState === 'addingGoals' && (
        <LobbyPhase boardID={boardID} playerID={playerID} onToggle={handleReadyClick} />
      )}
      {boardState === 'playing' && (
        <BingoBoard title="BOARD NAME" boardID={boardID} playerID={playerID} boardState={boardState} />
      )}
    </div>
  );
}

export default BoardPage;