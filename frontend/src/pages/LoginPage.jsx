import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();

  return (
    <div>
      <h1>Login</h1>
      <form>
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
    </div>
  );
};

export default LoginPage;