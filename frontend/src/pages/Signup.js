import React from "react";
import { Link } from "react-router-dom";

function Signup({ setLoggedIn, setUser }) {

  const handleSignup = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const phone = e.target.phone.value;
    const password = e.target.password.value;

    fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLoggedIn(true);
          setUser(data.user);
          alert("Account created successfully!");
        } else {
          alert(data.message);
        }
      });
  };

  return (
    <div className="card">
      <h2>Sign Up</h2>

      <form onSubmit={handleSignup}>
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="text" name="phone" placeholder="Phone Number" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Signup;
