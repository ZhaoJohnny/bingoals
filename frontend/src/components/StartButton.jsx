import { useState } from 'react';
import '../styles/StartButton.css';

function StartButton({ boardID, onStart }) {
  const [loading, setLoading] = useState(false);

  

  return (
    <button className="start-button" onClick={onStart} disabled={loading}>
      Start Game
    </button>
  );
}

export default StartButton;