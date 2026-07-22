import { useState } from 'react';
import '../styles/ReadyButton.css';

function ReadyButton({ boardID, onToggle }) {
  const [ready, setReady] = useState(false);

  return (
    <button className="ready-button" onClick={onToggle} disabled={loading}>
      {ready ? 'Ready ✓ (click to undo)' : 'Ready Up'}
    </button>
  );
}

export default ReadyButton;