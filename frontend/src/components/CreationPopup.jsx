import "../styles/CreationPopup.css";

function CreationPopup({setText, setShowPopup, saveSquareContent, text, selectedSquareID}) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <textarea
          className="popup-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={() => setShowPopup(false)}>Close</button>
        <button
          onClick={() => {
            saveSquareContent(selectedSquareID, text);
            setShowPopup(false);
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default CreationPopup;
