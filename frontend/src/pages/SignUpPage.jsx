import { useNavigate } from "react-router-dom";

function SignUpPage() {
    function handleSubmit(event) {
        event.preventDefault();
        const username = event.target[0].value;
        const email = event.target[1].value;
        const password = event.target[2].value;
        try {
            fetch("http://localhost:3001/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    name:username, 
                    email:email, 
                    password:password })
            });
        } catch (error) {
            console.error("Error signing up:", error);
        }
    }
  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUpPage;