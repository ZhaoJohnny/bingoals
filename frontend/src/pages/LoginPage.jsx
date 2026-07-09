import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();
    async function handleSubmit(event) {
        event.preventDefault();
        const email = event.target[0].value;
        const password = event.target[1].value;
        try {
            const response = await fetch("http://localhost:3001/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email:email, password:password })
            });
            if (response.ok) {
              const responseData = await response.json();
              localStorage.setItem("token", responseData.token);
              localStorage.setItem("user", JSON.stringify(responseData.user));
              navigate("/start");
            }
        } catch (error) {
            console.error("Error logging in:", error);
        }
        
    }
  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
    </div>
  );
};

export default LoginPage;