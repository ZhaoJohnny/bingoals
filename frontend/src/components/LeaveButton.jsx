import { Navigate, useNavigate } from "react-router-dom";
import "../styles/LeaveButton.css";

function LeaveButton({ boardID }) {
  const navigate = useNavigate();

  async function handleLeave() {
    try {
      const req = await fetch(
        `${import.meta.env.VITE_API_URL}/api/board/${boardID}/leaveGame`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const res = await req.json();
      if (res.success) {
        // Redirect back to start page
        navigate("/");
      } else {
        console.error("Failed to leave the game", res.message);
      }
    } catch (error) {
      console.error("Failed to leave the game", error);
    }
  }

  return (
    <button className="leave-button" onClick={handleLeave}>
      Leave
    </button>
  );
}

export default LeaveButton;
