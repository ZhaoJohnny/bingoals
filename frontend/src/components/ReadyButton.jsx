import { useState, useEffect } from 'react';
import '../styles/ReadyButton.css';

function ReadyButton({ boardID }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function fetchReadyStatus() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/getReady`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setReady(data.ready);
      } catch (error) {
        console.error('Error fetching ready status', error);
      }
    }
    fetchReadyStatus();
  }, [boardID]);

async function handleReadyToggle() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/changeReady`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
      });
      const readyData = await res.json();
      setReady(readyData.ready);
    } catch (error) {
      console.error('Error toggling ready', error);
    } 
  }
  
  return (
    <button className="ready-button" onClick={handleReadyToggle}>
      {ready ? 'Ready ✓ (click to undo)' : 'Ready Up'}
    </button>
  );
}

export default ReadyButton;