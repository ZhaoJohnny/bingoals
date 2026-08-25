import { useState, useEffect } from 'react';
import '../styles/PlayerList.css';
import socket from '../socket.js';
import KickPlayerButton from './KickPlayerButton';

function PlayerList({ boardID, showKick, variant = "default"}) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPlayers() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/players`);
      const data = await res.json();
      if (data.success) setPlayers(data.players);
    } catch (error) {
      console.error('Failed to load players', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers(); // initial fetch
    
    socket.on('players-updated', (data) => {
      if (String(data.boardID) === String(boardID)) {
        loadPlayers();

      }
    });
    return () => {
      socket.off('players-updated');
    };
  }, [boardID]);

  if (loading) return <div className={`players-list players-list-${variant}`}>Loading players…</div>;
  if (variant === "creation") {
    return (
      <div className="players-list players-list-creation">
        {players.map((player) => (
          <span key={player.id} className="creation-player">
            <span className="creation-player-name">{player.name}</span>

            <span className={player.ready ? "ready-mark" : "not-ready-mark"}>
              {player.ready ? "✓" : "✗"}
            </span>
          </span>
        ))}
      </div>
    );
  }
  return (  
    <div className="players-list">
      <h3>Players</h3>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            <span className="player-name">{player.name}</span>
            <span className={player.ready ? 'ready-mark' : 'not-ready-mark'}>
              {player.ready ? '✓' : '✗'}
            </span>
            {showKick && (<KickPlayerButton currentPlayer={player.id} boardID={boardID} />)}
            
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlayerList;