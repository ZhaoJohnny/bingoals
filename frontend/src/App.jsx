import BingoBoard from './components/BingoBoard';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1 className="app-title">BINGOals</h1>
      <BingoBoard title="BOARD NAME" />
    </div>
  );
}

export default App;