import React from "react";
import { Link } from "react-router-dom";

function Login({ setLoggedIn, setUser }) {

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLoggedIn(true);
          setUser(data.user);
          alert(`Welcome ${data.user.name}`);
        } else {
          alert(data.message);
        }
      });
  };

  return (
    <div className="card">
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        Don’t have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}

export default Login;
