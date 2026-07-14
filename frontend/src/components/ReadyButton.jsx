import '../styles/ReadyButton.css';

function ReadyButton({ boardState, onToggle }) {
  return (
    <button className="ready-button" onClick={onToggle}>
      {boardState === 'addingGoals' ? 'Start Bingo' : 'Edit Goals'}
    </button>
  );
}

export default ReadyButton;