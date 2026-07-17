import { useState } from 'react';
import '../styles/ReadyButton.css';

function ReadyButton({ boardID, playerID, onToggle }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/board/${boardID}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
          authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });
      const data = await res.json();
      if (data.success) {
        setReady(data.ready);
        if (onToggle) onToggle(data.ready);
      } else {
        console.error('Failed to update ready status', data.message);
      }
    } catch (error) {
      console.error('Error toggling ready', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="ready-button" onClick={handleClick} disabled={loading}>
      {ready ? 'Ready ✓ (click to undo)' : 'Ready Up'}
    </button>
  );
}

export default ReadyButton;