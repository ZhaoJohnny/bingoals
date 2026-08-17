import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BoardList.css';

function BoardList() {
    const [boards, setBoards] = useState([]);
    const navigate = useNavigate();

    async function loadBoards() {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/boards`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setBoards(data.boards);
            }
        } catch (error) {
            console.error('Error loading boards', error);
        }
    }

    useEffect(() => {
        loadBoards();
    }, []);
    async function handleJoinGame(board) {
       navigate(`/board/${board.id}`, {
            state: {
                code: board.code,
            },
        }
       );
    }

    return (
        <div className="board-list">
            <h2>Available Boards</h2>
            <ul>
                {boards.map((board) => (
                    <li key={board.id}>
                        {board.id}: {board.title}
                        <button onClick={() => handleJoinGame(board)}>Join Game</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BoardList;