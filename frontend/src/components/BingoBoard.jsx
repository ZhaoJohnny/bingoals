import BingoSquare from './BingoSquare';
import '../styles/BingoBoard.css';

function BingoBoard({ title }) {
  // 25 cells for a 5x5 board — placeholder content for now
  const cells = Array.from({ length: 25 });

  return (
    <div className="bingo-board">
      <div className="bingo-board-header">
        {title}
      </div>
      <div className="bingo-board-grid">
        {cells.map((_, index) => (
          <BingoSquare key={index} content="" />
        ))}
      </div>
    </div>
  );
}

export default BingoBoard;