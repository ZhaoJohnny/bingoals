import '../styles/ReadyButton.css';

function ReadyButton({ boardState, onToggle }) {
  return (
    <button className="ready-button" onClick={onToggle}>
      {boardState === 'addingGoals' ? 'Finalize Board' : 'Edit Goals'}
    </button>
  );
}

export default ReadyButton;