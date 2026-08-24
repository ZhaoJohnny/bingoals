import { useState, useEffect } from 'react';
import '../styles/BingoSquare.css';

function BingoSquare({ content, boardID, index, status, marked, isOwner, bingoSquareClick }) {

  const playerID = JSON.parse(localStorage.getItem('user'))?.id;
  if (status === 'playing') {
    return (
      <button
        className={marked ? 'bingo-square marked' : 'bingo-square'}
        onClick={() => bingoSquareClick(index,content, marked)}
      >
        {content || ''}
      </button>
    );
  }
  if (status === 'ended') {
    return (
      <div className={marked ? 'bingo-square marked' : 'bingo-square'}>
        {content || ''}
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
      onClick={bingoSquareClick ? () => bingoSquareClick(index, content) : undefined}>
      {content || ''}
      
    </button>
  );
}

export default BingoSquare;