import { useState } from 'react';
import '../styles/StartButton.css';

function FinishButton({ boardID, onFinish }) {

  return (
    <button className="start-button" onClick={onFinish}>
      Finish
    </button>
  );
}

export default FinishButton;