import { useState } from 'react';
import '../styles/KickPlayerButton.css';

function KickPlayerButton({currentPlayer, boardID}) {
    async function handleKickPlayer() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/kickPlayer/${currentPlayer}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
      });
      const kickStatus = await res.json();

    } catch (error) {
      console.error('Error kicking player', error);
    } 
  }
    return (
        <button className="kick-player-button" onClick={handleKickPlayer}>
            Kick Player
        </button>
    );
}

export default KickPlayerButton;