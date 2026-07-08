// pages/BoardPage.jsx

import { useParams } from "react-router-dom";
import BingoBoard from "../components/BingoBoard";

function BoardPage() {
  const { boardID } = useParams();

  return (
    <div>
      <BingoBoard title="BOARD NAME" boardID={boardID} />
    </div>
  );
}

export default BoardPage;