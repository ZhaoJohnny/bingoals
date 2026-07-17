import { useState } from 'react';
import '../styles/StartButtonButton.css';

function StartButton({boardID}) {
    const [loading, setLoading] = useState(false);
    async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/board/${boardID}/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
        body: JSON.stringify({ user_id: playerID, board_id: boardID }),
      });
      const data = await res.json();
      if (data.success) {
        // TODO: Start the game
      } else {
        console.error('Failed to start ', data.message);
      }
    } catch (error) {
      console.error('Error toggling ready', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="start-button" onClick={handleClick} disabled={loading}>
      Start Game
    </button>
  );
}

export default StartButton;