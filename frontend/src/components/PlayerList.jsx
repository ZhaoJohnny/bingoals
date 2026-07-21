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
    const interval = setInterval(loadPlayers, 300); // then poll every 2 seconds

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