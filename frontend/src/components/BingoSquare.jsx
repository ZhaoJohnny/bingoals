import { useState, useEffect } from 'react';
import '../styles/BingoSquare.css';

function BingoSquare({ content, boardID, index, status, marked, onToggleMarker, isOwner, func }) {
  const [text, setText] = useState(content || '');
  const playerID = JSON.parse(localStorage.getItem('user'))?.id;
  

  if (status === 'playing') {
    return (
      <button
        className={marked ? 'bingo-square marked' : 'bingo-square'}
        onClick={() => onToggleMarker(index)}
      >
        {text}
      </button>
    );
  }
  if (status === 'ended') {
    return (
      <div className={marked ? 'bingo-square marked' : 'bingo-square'}>
        {text}
      </div>
    );
  }
  if (status === 'creation' && !isOwner) {
    return (
      <div className="bingo-square unowned">
        {text || ''}
      </div>
    );
  }

  return (
    <button
      className="bingo-square owned"
      // value={text}
      // onChange={(e) => setText(e.target.value)}
      onClick={func ? () => func(index, text) : undefined}
    >
      {text}
    </button>
  );
}

export default BingoSquare;