// pages/BingoBoardPage.jsx

import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import BingoBoard from "../components/BingoBoard";
import PlayersList from "../components/PlayersList";
import ReadyButton from "../components/ReadyButton";

function BingoBoardPage() {
  const { boardID } = useParams();
  const location = useLocation();
  const playerID = location.state?.playerID;

  return (
    <div>
      <PlayersList boardID={boardID} />
      <BingoBoard title="BOARD NAME" roomCode={roomCode} />
      <ReadyButton boardState={boardState} onToggle={handleReadyClick} />
    </div>
  );
}

export default BingoBoardPage;