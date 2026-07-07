// pages/BingoBoardPage.jsx

import { useParams } from "react-router-dom";
import BingoBoard from "../components/BingoBoard";

function BingoBoardPage() {
  const { roomCode } = useParams();

  return (
    <div>
      <BingoBoard title="BOARD NAME" roomCode={roomCode} />
    </div>
  );
}

export default BingoBoardPage;