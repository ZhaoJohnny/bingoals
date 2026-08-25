import { useState, useEffect } from 'react';
import BingoSquare from './BingoSquare';
import '../styles/BingoBoard.css';
import socket from '../socket.js';

function BingoBoard({ title, boardID, status, bingoSquareClick, markSquareClick}) {
  const [cells, setCells] = useState(
    Array.from({ length: 25 }, (_, index) => ({ index, content: '' }))
  );
  
  const [loading, setLoading] = useState(true);
  
  
    async function loadBoard() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}`, {
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

    
  
    async function loadEverything() {
      setLoading(true);
      await loadBoard();
      
      setLoading(false);
    }
  useEffect(() => {  
    function handleBoardUpdated(data) {
      if (String(data.boardID) === String(boardID)) {
        loadEverything();
        console.log('Board updated, reloading board:', boardID);
      }
    };
    socket.on('board-updated', handleBoardUpdated);
    
    loadEverything();
    return () => {
      socket.off('board-updated', handleBoardUpdated);
    };
  }, [boardID, status]);
  async function handleToggleMarker(index,content) {
    try {
      const data = await markSquareClick(index,content);
      
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
            isOwner={cell.isOwner}
            onToggleMarker={handleToggleMarker}
            bingoSquareClick={bingoSquareClick}
          />
        ))}
      </div>
    </div>
  );
}

export default BingoBoard;