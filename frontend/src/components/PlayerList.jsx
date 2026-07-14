import { useState, useEffect } from 'react';
import '../styles/PlayerList.css';

function PlayersList({ boardID }) {
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
    loadPlayers();
  }, [boardID]);

  if (loading) return <div className="players-list">Loading players…</div>;

  return (
    <div className="players-list">
      <h3>Players</h3>
      <ul>
        {players.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

export default PlayersList;