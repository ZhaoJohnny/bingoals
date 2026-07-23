import { useState } from 'react';
import '../styles/StartButton.css';

function StartButton({ boardID, onStart }) {


  

  return (
    <button className="start-button" onClick={onStart}>
      Start Game
    </button>
  );
}

export default StartButton;