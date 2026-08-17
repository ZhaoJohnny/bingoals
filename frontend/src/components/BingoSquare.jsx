import { useState, useEffect } from 'react';
import '../styles/BingoSquare.css';

function BingoSquare({ content, boardID, index, status, marked, onToggleMarker, owner: initialOwner }) {
  const [text, setText] = useState(content || '');
  const [owner, setOwner] = useState(initialOwner || null);
  const playerID = JSON.parse(localStorage.getItem('user'))?.id;
  useEffect(() => {
    setText(content || '');
    setOwner(owner || null);
  }, [content, owner]);
  async function handleKeyDown(e) {
    if (status !== 'creation') return;
    if (status === 'ended') return(
      <div>{text}</div>
    );
    if (e.key === 'Enter') {
      e.preventDefault();

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/square/${index}/bingo-square`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            boardID,
            index,
            content: text,
            owner: owner,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save bingo square');
        }
        setOwner(owner);
        console.log('Owner set to:', owner);
        console.log('Saved:', text);
      } catch (error) {
        console.error(error);
      }
    }
  }

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

  return (
    <input
      className={owner === playerID ? 'bingo-square owned' : 'bingo-square'}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={status !== 'creation'}
    />
  );
}

export default BingoSquare;