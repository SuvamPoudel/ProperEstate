import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import "../Auth.css";

function SignupPage({ setUser }) {
  const navigate = useNavigate();
  const [wantSeller, setWantSeller] = useState(false);
  const [docType, setDocType] = useState("citizenship");
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const phone = e.target.phone.value.trim();
    const password = e.target.password.value;

    if (!name || !email || !phone || !password) { setError("All fields are required."); return; }
    if (!/^[0-9]{10}$/.test(phone)) { setError("Phone must be exactly 10 digits."); return; }
    if (wantSeller && !docFile) { setError("Please upload your ID document to register as a seller."); return; }

    setLoading(true);
    try {
      if (wantSeller) {
        const signupRes = await fetch(`${API_URL}/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, password }) });
        const signupData = await signupRes.json();
        if (!signupData.success) { setError(signupData.message || "Signup failed"); setLoading(false); return; }
        
        const fd = new FormData();
        fd.append("userId", signupData.user._id);
        fd.append("sellerDocType", docType);
        fd.append("sellerDoc", docFile);
        
        const sellerRes = await fetch(`${API_URL}/become-seller`, { method: "POST", body: fd });
        const sellerData = await sellerRes.json();
        
        if (sellerData.success) {
          setStep("pending");
        } else {
          setError("Account created but seller doc upload failed. Please go to Profile to retry.");
          setUser(signupData.user);
          localStorage.setItem("properEstateUser", JSON.stringify(signupData.user));
          setTimeout(() => navigate("/profile"), 2000);
        }
      } else {
        const res = await fetch(`${API_URL}/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, password }) });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem("properEstateUser", JSON.stringify(data.user));
          navigate(data.user.role === "admin" ? "/admin" : "/");
        } else {
          setError(data.message || "Signup failed");
        }
      }
    } catch (err) { 
      setError("Network error. Please try again."); 
    } finally {
      setLoading(false);
    }
  };

  if (step === "pending") return (
    <div className="auth-page-wrapper">
      <div className="auth-card success-state">
        <div className="success-icon">⏳</div>
        <h2>Account Created!</h2>
        <p>
          Your seller verification is <strong>pending admin review</strong>.<br /><br />
          You can log in now. Seller features will be unlocked once your ID is approved (24–48 hrs).
        </p>
        <button className="auth-submit-btn" style={{ width: '100%' }} onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card wide">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>ProperEstate</div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the premium real estate platform</p>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(229, 57, 53, 0.1)", border: "1px solid rgba(229, 57, 53, 0.3)", borderRadius: "8px", color: "#E53935", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <input name="name" className="auth-input" placeholder="John Doe" required />
            </div>
            <div className="auth-input-group">
              <label className="auth-label">Phone Number</label>
              <input name="phone" className="auth-input" placeholder="10 digits" maxLength={10} required />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <input name="email" type="email" className="auth-input" placeholder="john@example.com" required />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input name="password" type="password" className="auth-input" placeholder="Create a strong password" required />
          </div>

          <div 
            className={`seller-toggle-wrapper ${wantSeller ? 'active' : ''}`}
            onClick={() => setWantSeller(v => !v)}
          >
            <div className="toggle-switch-ui"></div>
            <div className="toggle-content">
              <h4>Register as a Seller</h4>
              <p>List properties for rent. Requires government ID verification.</p>
            </div>
          </div>

          {wantSeller && (
            <div className="seller-doc-container">
              <div className="auth-input-group" style={{ marginBottom: "12px" }}>
                <label className="auth-label">Document Type</label>
                <select className="auth-input" value={docType} onChange={e => setDocType(e.target.value)}>
                  <option value="citizenship">Citizenship Certificate</option>
                  <option value="nid">National ID (NID)</option>
                  <option value="passport">Passport</option>
                </select>
              </div>
              
              <div className="auth-input-group">
                <label className="auth-label">Upload ID Photo / Scan</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={e => setDocFile(e.target.files[0])} 
                  required={wantSeller} 
                />
              </div>
              {docFile && <p style={{ fontSize: "12px", color: "#4CAF50", marginTop: "8px", fontFamily: "var(--font-mono)" }}>✓ {docFile.name}</p>}
            </div>
          )}

          <button className="auth-submit-btn" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
            {loading ? "Creating Account..." : wantSeller ? "Register & Submit for Verification" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <span onClick={() => navigate("/login")} className="auth-link-text">Login</span>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
