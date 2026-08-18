import { useNavigate } from "react-router-dom";
import '../styles/Header.css';

function Header() {
  const navigate = useNavigate();
  return (
    <header className="header">
      <button className="header-home-button" onClick={() => navigate("/")}>
        BINGOals
      </button>
      <button className="header-logout-button" onClick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }}>
        Logout
      </button>  
    </header>
  );
}
export default Header;