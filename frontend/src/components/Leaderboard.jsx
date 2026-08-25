import "../styles/Leaderboard.css";
import socket from "../socket.js";
import { useState, useEffect } from "react";

function Leaderboard({ boardID }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function getLeaderboard() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/leaderboard`,
      );
      const data = await res.json();
      console.log("Leaderboard response:", data);
      if (data.success) setPlayers(data.players);
    } catch (error) {
      console.error("Failed to load players", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getLeaderboard();
    socket.on('marker-updated', (data) => {
      if (String(data.boardID) === String(boardID)) {
        getLeaderboard();
      }
    });
    return () => {
      socket.off('marker-updated');
    };
  }, [boardID]);

  return (
    <div className="players-list">
      <h3>Leaderboard</h3>
      <ul>
        {players.map((player) => (
          <li key={player.user_id}>
            <span className="player-name">{player.name}</span>
            <span className="marker-count">{player.marker_count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;
