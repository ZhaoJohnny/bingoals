import { useState } from 'react';
import '../styles/BingoSquare.css';

function BingoSquare({ content, boardID, index, status }) {
  const [text, setText] = useState(content || '');
  cons
  async function handleKeyDown(e) {
    if (status !== 'creation') return;
    if (e.key === 'Enter') {
      e.preventDefault();

      try {
        const response = await fetch('http://localhost:3001/api/bingo-square', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            boardID,
            index,
            content: text,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save bingo square');
        }

        console.log('Saved:', text);
      } catch (error) {
        console.error(error);
      }
    }
    if (phase === 'playing') {
    return (
      <button
        className={marked ? 'bingo-square marked' : 'bingo-square'}
        onClick={() => onToggleMarker(index)}
      >
        {text}
      </button>
    );
  }
  }

  return (
    <input
      className="bingo-square"
      value={text}

      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

export default BingoSquare;