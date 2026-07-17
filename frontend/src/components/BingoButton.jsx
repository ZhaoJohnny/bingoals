function BingoButton(props) {
    return (
        <button className="bingo-button" onClick={props.onClick}>
            {"BINGO!"}
        </button>
    );
}
export default BingoButton;