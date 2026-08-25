import "../styles/PlayingPopup.css";

function PlayingPopup({setShowPlayPopup, markSquareClick, selectedSquareMarked, text, selectedSquareID}) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p>{text}</p>

        <button onClick={() => setShowPlayPopup(false)}>Close</button>
        <button
          onClick={() => {
            markSquareClick(selectedSquareID);
            setShowPlayPopup(false);
          }}
        >
          {selectedSquareMarked ? "Unmark" : "Mark"}
        </button>
      </div>
    </div>
  );
}

export default PlayingPopup;
