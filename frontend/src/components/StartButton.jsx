import { useState } from 'react';
import '../styles/StartButton.css';

function StartButton({ boardID, onStart }) {
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
      });
      const data = await res.json();
      if (data.success) {
        if (onStart) onStart();
      } else {
        console.error('Failed to start', data.message);
      }
    } catch (error) {
      console.error('Error starting game', error);
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