import { useState, useEffect } from 'react';
import BingoSquare from './BingoSquare';
import '../styles/BingoBoard.css';

function BingoBoard({ title, boardID }) {
  const [cells, setCells] = useState(
    Array.from({ length: 25 }, (_, index) => ({ index, content: '' }))
  );

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBoard() {
      try {
        const res = await fetch(`http://localhost:3001/api/board/${boardID}`, {
          headers: {
            authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setCells(data.cells);
        }
      } catch (err) {
        console.error('Failed to load board', err);
      }
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
        }
      } catch (err) {
        console.error('Failed to get board status', err);
      }
    }
    
    async function loadEverything() {
      setLoading(true);
      await loadBoard();
      await loadBoardStatus();
      setLoading(false);
    }

    loadEverything();
  }, [boardID]);

  async function handleToggleMarker(index) {
    try {
      const response = await fetch(
        `http://localhost:3001/api/board/${boardID}/square/${index}/toggle-marker`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCells((prevCells) =>
          prevCells.map((cell) =>
            cell.index === index
              ? { ...cell, marked: data.marked }
              : cell
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle marker:', error);
    }
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
            status={status}
            marked={cell.marked}
            onToggleMarker={handleToggleMarker}
          />
        ))}
      </div>
    </div>
  );
}

export default BingoBoard;