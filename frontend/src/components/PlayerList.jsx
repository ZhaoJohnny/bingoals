import { useState, useEffect } from 'react';
import '../styles/PlayerList.css';

function PlayerList({ boardID }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch(`http://localhost:3001/api/board/${boardID}/players`);
        const data = await res.json();
        if (data.success) setPlayers(data.players);
      } catch (error) {
        console.error('Failed to load players', error);
      } finally {
        setLoading(false);
      }
    }

    loadPlayers(); // initial fetch
    // TODO: right now the playerList is refreshed by querying the server every 300ms. This
    // definitely seems like a brute force way to accomplish what is a simple player list, and could
    // definitely be refactored to be more efficient later
    const interval = setInterval(loadPlayers, 300); // then poll every 300ms

    return () => clearInterval(interval); // stop polling on unmount
  }, [boardID]);

  if (loading) return <div className="players-list">Loading players…</div>;

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
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlayerList;