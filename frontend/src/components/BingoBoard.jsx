import { useState, useEffect } from 'react';
import BingoSquare from './BingoSquare';
import '../styles/BingoBoard.css';

function BingoBoard({ title, boardID }) {
  const [cells, setCells] = useState(
    Array.from({ length: 25 }, (_, index) => ({ index, content: '' }))
  );
  const [loading, setLoading] = useState(true);
  const [boardState, setBoardState] = useState('addingGoals');

  useEffect(() => {
    async function loadBoard() {
      try {
        const res = await fetch(`http://localhost:3001/api/board/${boardID}`);
        const data = await res.json();
        if (data.success) setCells(data.cells);
      } catch (err) {
        console.error('Failed to load board', err);
      } finally {
        setLoading(false);
      }
    }
    loadBoard();
  }, [boardID]);

function handleReadyClick() {
    setBoardState(boardState === 'addingGoals' ? 'playing' : 'addingGoals');
  }

  if (loading) return <div className="bingo-board">Loading board…</div>;

  return (
    <div className="bingo-board">
      <div className="bingo-board-header">
        {title}
      </div>
      <div className="bingo-board-grid">
        {cells.map((cell) => (
          <BingoSquare
            key={cell.index}
            content={cell.content}
            boardID={boardID}
            index={cell.index}
          />
        ))}
      </div>
      <button className="ready-button" onClick={handleReadyClick}>
        {boardState === 'addingGoals' ? 'Finalize Board' : 'Edit Goals'}
      </button>
    </div>
  );
}

export default BingoBoard;