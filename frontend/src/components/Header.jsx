import { useNavigate } from "react-router-dom";
import '../styles/Header.css';

function Header() {
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem("token")
  return (
    <header className="header">
      <button className="header-home-button" onClick={() => navigate("/")}>
        BINGOals
      </button>
      { loggedIn ?
      <button className="header-logout-button" onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");    
      }}>
         Logout
      </button> : 
      <button className="header-login-button" onClick={() => {
          navigate("/login");    
      }}>
         Login</button>
      } 
    </header>
  );
}
export default Header;