import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import "../Auth.css";

function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value })
      });
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("properEstateUser", JSON.stringify(data.user));
        if (data.user.role === "admin") navigate("/admin"); else navigate("/");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>ProperEstate</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(229, 57, 53, 0.1)", border: "1px solid rgba(229, 57, 53, 0.3)", borderRadius: "8px", color: "#E53935", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <input name="email" type="email" className="auth-input" placeholder="Enter your email" required />
          </div>
          
          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input name="password" type="password" className="auth-input" placeholder="Enter your password" required />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <span onClick={() => navigate("/signup")} className="auth-link-text">Create one</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
