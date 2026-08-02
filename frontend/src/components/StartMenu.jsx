import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/StartMenu.css';

function StartMenu({ }) {
    const [boardID, setBoardID] = useState('');
    const navigate = useNavigate();

    async function handleCreateClick() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();

      navigate(`/board/${data.boardID}`);
    } catch (error) {
      console.error(error);
    }
  }
    async function handleJoinClick() {
         if (!boardID) {
            alert('Please enter a board ID');
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/board/${boardID}/join`, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });
            const data = await res.json();
            if (!data.success) {
                alert('Please enter a valid board ID');
                console.log(data.message);
                return;
            }
            navigate(`/board/${boardID}`);
        } catch (error) {
            console.error('Error checking board:', error);
            alert('Something went wrong checking that board ID')
        }
    }

  return (
    <div className="start-menu">
  <h2>Welcome to BINGOals!</h2>

  <div className="menu-section">
    <h3>Join Game</h3>

    <input
      type="text"
      placeholder="Enter Board ID"
      value={boardID}
      onChange={(e) => setBoardID(e.target.value)}
    />

    <button onClick={handleJoinClick}>Join Game</button>
  </div>

  <div className="menu-section">
    <h3>Create Game</h3>


    <button onClick={handleCreateClick}>Create Game</button>
  </div>
</div>
  );
}

export default StartMenu;