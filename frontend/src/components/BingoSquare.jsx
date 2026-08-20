import { useState, useEffect } from 'react';
import '../styles/BingoSquare.css';

function BingoSquare({ content, boardID, index, status, marked, onToggleMarker, isOwner, func }) {

  const playerID = JSON.parse(localStorage.getItem('user'))?.id;
  

  if (status === 'playing') {
    return (
      <button
        className={marked ? 'bingo-square marked' : 'bingo-square'}
        onClick={() => onToggleMarker(index)}
      >
        {content}
      </button>
    );
  }
  if (status === 'ended') {
    return (
      <div className={marked ? 'bingo-square marked' : 'bingo-square'}>
        {content}
      </div>
    );
  }
  if (status === 'creation' && !isOwner) {
    return (
      <div className="bingo-square unowned">
        {content || ''}
      </div>
    );
  }

  return (
    <button
      className="bingo-square owned"
      onClick={func ? () => func(index, content) : undefined}>
      {content}
    </button>
  );
}

export default BingoSquare;