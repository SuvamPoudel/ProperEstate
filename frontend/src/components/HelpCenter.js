import React, { useState } from "react";
import { API_URL } from "../constants";
import "../HelpCenter.css";

const HelpCenter = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await fetch(`${API_URL}/help-center`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setSent(true);
    } catch { alert("Failed to send. Please try again."); }
    setLoading(false);
  };
  return (
    <div className="help-center-page container">
      <h2 className="page-title">Help Center</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>Have a question or issue? Send us a message and we will get back to you.</p>
      {sent ? (
        <div className="help-success">
          <div style={{ fontSize: 48 }}>OK</div>
          <h3>Message Sent!</h3>
          <p>We will respond to your email shortly.</p>
          <button className="btn-primary" onClick={() => setSent(false)}>Send Another</button>
        </div>
      ) : (
        <form className="help-form" onSubmit={handleSubmit}>
          <div className="form-group"><label>Your Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" /></div>
          <div className="form-group"><label>Your Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" /></div>
          <div className="form-group"><label>Message</label><textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue or question..." /></div>
          <button className="btn-primary full-width" type="submit" disabled={loading}>{loading ? "Sending..." : "Send Message"}</button>
        </form>
      )}
    </div>
  );
};

export default HelpCenter;
