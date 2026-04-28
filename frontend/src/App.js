import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import "./App.css";
import ChatApp from "./components/chatting";

const getUserFromStorage = () => {
  const saved = localStorage.getItem("properEstateUser");
  return saved ? JSON.parse(saved) : null;
};

/* ===== ESEWA PAYMENT ===== */
const DummyEsewaPayment = ({ amount, description, onSuccess, onCancel }) => {
  const [step, setStep] = useState("form");
  const [mpin, setMpin] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const handlePay = () => {
    if (!phone || phone.length < 10) { setError("Enter a valid eSewa ID / phone number"); return; }
    if (!mpin || mpin.length < 4) { setError("Enter your MPIN (min 4 digits)"); return; }
    setError(""); setStep("processing");
    setTimeout(() => setStep("success"), 2500);
    setTimeout(() => onSuccess(), 3500);
  };
  return (
    <div className="esewa-overlay"><div className="esewa-modal">
      <div className="esewa-header">
        <div className="esewa-logo"><span className="esewa-logo-e">e</span>Sewa</div>
        <button className="esewa-close" onClick={onCancel}>&#x2715;</button>
      </div>
      {step === "form" && (
        <div className="esewa-body">
          <div className="esewa-amount-box">
            <p className="esewa-label">Total Amount</p>
            <h2 className="esewa-amount">NPR {amount.toLocaleString()}</h2>
            <p className="esewa-desc">{description}</p>
          </div>
          <div className="esewa-form">
            <label>eSewa ID / Mobile Number</label>
            <div className="esewa-input-row">
              <span className="esewa-flag">&#127475;&#127477; +977</span>
              <input type="tel" placeholder="98XXXXXXXX" value={phone} maxLength={10} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} />
            </div>
            <label style={{ marginTop: 14 }}>MPIN</label>
            <input type="password" className="esewa-mpin" placeholder="&#9679; &#9679; &#9679; &#9679;" maxLength={6} value={mpin} onChange={e => setMpin(e.target.value.replace(/\D/g, ""))} />
            {error && <p className="esewa-error">{error}</p>}
            <button className="esewa-pay-btn" onClick={handlePay}>Pay NPR {amount.toLocaleString()}</button>
            <button className="esewa-cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
          <p className="esewa-secure">Secured by eSewa - Demo Mode</p>
        </div>
      )}
      {step === "processing" && (<div className="esewa-processing"><div className="esewa-spinner"></div><p>Processing Payment...</p><p className="esewa-proc-sub">Please do not close this window</p></div>)}
      {step === "success" && (<div className="esewa-success"><div className="esewa-check">&#10003;</div><h3>Payment Successful!</h3><p>NPR {amount.toLocaleString()} paid via eSewa</p></div>)}
    </div></div>
  );
};

/* ===== AI RENT ADVISOR ===== */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SmartSuggestor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // OpenAI message history
  const bottomRef = useRef();
  const inputRef = useRef();

  const QUICK_ACTIONS = [
    { icon: "🏠", label: "Rent a flat in Kathmandu" },
    { icon: "💰", label: "Cheapest rentals in Nepal" },
    { icon: "🏢", label: "Commercial space Pokhara" },
    { icon: "📋", label: "How to list my property" },
    { icon: "⚖️", label: "Rental agreement process" },
    { icon: "🗺️", label: "Best areas to rent in Chitwan" },
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Namaste! 🙏 I'm **RentBot**, your AI expert for Nepal real estate.\n\nI know everything about renting in Nepal — prices, locations, laws, and how to use ProperEstate. Ask me anything!",
        id: Date.now()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const newHistory = [...history, { role: "user", content: msg }];
    setHistory(newHistory);

    try {
      const res = await fetch(`${API_URL}/ai-advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory })
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, id: Date.now() + 1 }]);
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your internet and try again.", id: Date.now() + 1 }]);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMessages([{
      role: "assistant",
      content: "Namaste! 🙏 I'm **RentBot**, your AI expert for Nepal real estate.\n\nI know everything about renting in Nepal — prices, locations, laws, and how to use ProperEstate. Ask me anything!",
      id: Date.now()
    }]);
    setHistory([]);
    setInput("");
  };

  // Simple markdown-like renderer for bold text
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
    });
  };

  const formatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{SUGGESTOR_STYLES}</style>
      <button className="sug-fab" onClick={() => setIsOpen(o => !o)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Rent Advisor</span>
      </button>

      {isOpen && (
        <div className="sug-window">
          {/* Header */}
          <div className="sug-header">
            <div className="sug-header-left">
              <div className="sug-bot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <div className="sug-header-name">RentBot AI</div>
                <div className="sug-header-sub">
                  <span className="sug-online-dot"></span> Nepal Real Estate Expert
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="sug-icon-btn" onClick={handleReset} title="New conversation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              </button>
              <button className="sug-icon-btn" onClick={() => setIsOpen(false)} title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="sug-messages">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={"sug-msg-row " + msg.role}>
                {msg.role === "assistant" && (
                  <div className="sug-bot-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                )}
                <div className={"sug-bubble " + msg.role}>
                  <div className="sug-bubble-text">{renderContent(msg.content)}</div>
                  <div className="sug-bubble-time">{formatTime()}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="sug-msg-row assistant">
                <div className="sug-bot-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div className="sug-bubble assistant loading-bubble">
                  <span className="sug-dot"></span>
                  <span className="sug-dot"></span>
                  <span className="sug-dot"></span>
                </div>
              </div>
            )}

            {/* Quick actions — show only on first message */}
            {messages.length === 1 && !loading && (
              <div className="sug-quick-actions">
                <p className="sug-quick-label">Quick questions:</p>
                <div className="sug-quick-grid">
                  {QUICK_ACTIONS.map((a, i) => (
                    <button key={i} className="sug-quick-btn" onClick={() => sendMessage(a.label)}>
                      <span>{a.icon}</span> {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="sug-input-area">
            <div className="sug-input-wrap">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about Nepal rentals..."
                className="sug-input"
                disabled={loading}
              />
              <button
                className={"sug-send-btn " + (input.trim() && !loading ? "ready" : "")}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
            <p className="sug-footer-note">Powered by AI · ProperEstate Nepal</p>
          </div>
        </div>
      )}
    </>
  );
};

const SUGGESTOR_STYLES = `
/* ===== RENTBOT FAB ===== */
.sug-fab {
  position: fixed;
  bottom: 100px;
  right: 28px;
  background: linear-gradient(135deg, #c5a059 0%, #a07830 100%);
  color: #fff;
  border: none;
  border-radius: 30px;
  padding: 11px 20px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 24px rgba(197,160,89,0.5);
  z-index: 1500;
  transition: transform 0.2s, box-shadow 0.2s;
  letter-spacing: 0.3px;
}
.sug-fab:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 10px 32px rgba(197,160,89,0.6); }
.sug-fab:active { transform: scale(0.97); }

/* ===== WINDOW ===== */
.sug-window {
  position: fixed;
  bottom: 170px;
  right: 28px;
  width: 380px;
  height: 560px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 12px 50px rgba(0,0,0,0.18), 0 2px 10px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1500;
  animation: sugSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);
  border: 1px solid rgba(0,0,0,0.06);
}
@keyframes sugSlideUp {
  from { opacity: 0; transform: translateY(28px) scale(0.94); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== HEADER ===== */
.sug-header {
  background: linear-gradient(135deg, #1a3c34 0%, #2d5a4e 60%, #3a7a6a 100%);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.sug-header::before {
  content: "";
  position: absolute;
  top: -30px; right: -30px;
  width: 100px; height: 100px;
  background: rgba(255,255,255,0.05);
  border-radius: 50%;
}
.sug-header-left { display: flex; align-items: center; gap: 10px; }
.sug-bot-avatar {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, #c5a059, #a07830);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.sug-header-name { color: #fff; font-weight: 700; font-size: 0.95rem; }
.sug-header-sub { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.7); font-size: 0.72rem; margin-top: 1px; }
.sug-online-dot { width: 7px; height: 7px; background: #4caf50; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 2px rgba(76,175,80,0.3); animation: sugPulse 2s infinite; }
@keyframes sugPulse { 0%,100%{box-shadow:0 0 0 2px rgba(76,175,80,0.3);} 50%{box-shadow:0 0 0 5px rgba(76,175,80,0.1);} }
.sug-icon-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  width: 30px; height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.sug-icon-btn:hover { background: rgba(255,255,255,0.28); }

/* ===== MESSAGES AREA ===== */
.sug-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8f9fa;
  scroll-behavior: smooth;
}
.sug-messages::-webkit-scrollbar { width: 4px; }
.sug-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

/* ===== MESSAGE ROWS ===== */
.sug-msg-row {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  animation: sugMsgIn 0.22s ease;
  margin-bottom: 2px;
}
@keyframes sugMsgIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sug-msg-row.user { flex-direction: row-reverse; }
.sug-bot-icon {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #1a3c34, #2d5a4e);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
  margin-bottom: 2px;
}

/* ===== BUBBLES ===== */
.sug-bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
}
.sug-bubble.assistant {
  background: #fff;
  color: #111;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.sug-bubble.user {
  background: linear-gradient(135deg, #1a3c34, #2d5a4e);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.sug-bubble-text { white-space: pre-wrap; }
.sug-bubble-time { font-size: 0.62rem; opacity: 0.5; margin-top: 4px; text-align: right; }

/* ===== LOADING DOTS ===== */
.loading-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
  min-width: 56px;
}
.sug-dot {
  width: 7px; height: 7px;
  background: #bbb;
  border-radius: 50%;
  animation: sugBounce 1.2s infinite;
  display: inline-block;
}
.sug-dot:nth-child(2) { animation-delay: 0.2s; }
.sug-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes sugBounce {
  0%,60%,100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* ===== QUICK ACTIONS ===== */
.sug-quick-actions { margin-top: 8px; }
.sug-quick-label { font-size: 0.72rem; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 4px; }
.sug-quick-grid { display: flex; flex-direction: column; gap: 6px; }
.sug-quick-btn {
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  padding: 9px 14px;
  font-size: 0.82rem;
  color: #333;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.18s;
  font-weight: 500;
}
.sug-quick-btn:hover {
  background: #f0f7f5;
  border-color: #1a3c34;
  color: #1a3c34;
  transform: translateX(3px);
}

/* ===== INPUT AREA ===== */
.sug-input-area {
  padding: 10px 14px 14px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.sug-input-wrap {
  display: flex;
  align-items: center;
  background: #f4f4f4;
  border-radius: 26px;
  padding: 5px 5px 5px 16px;
  gap: 6px;
  transition: box-shadow 0.2s, background 0.2s;
}
.sug-input-wrap:focus-within {
  box-shadow: 0 0 0 2px rgba(26,60,52,0.2);
  background: #fff;
}
.sug-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  outline: none;
  color: #111;
  padding: 6px 0;
}
.sug-input::placeholder { color: #aaa; }
.sug-input:disabled { opacity: 0.6; }
.sug-send-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: #e0e0e0;
  color: #aaa;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sug-send-btn.ready {
  background: linear-gradient(135deg, #c5a059, #a07830);
  color: #fff;
  box-shadow: 0 2px 8px rgba(197,160,89,0.4);
}
.sug-send-btn.ready:hover { transform: scale(1.1); }
.sug-send-btn:disabled { cursor: not-allowed; opacity: 0.6; }

/* ===== POWERED BY ===== */
.sug-powered {
  text-align: center;
  font-size: 0.65rem;
  color: #ccc;
  padding: 4px 0 2px;
  letter-spacing: 0.3px;
}

@media (max-width: 480px) {
  .sug-window { width: calc(100vw - 20px); right: 10px; bottom: 220px; height: 65vh; }
  .sug-fab { right: 10px; }
}
`;
/* ===== HELP CENTER ===== */
const HelpCenter = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await fetch("http://localhost:5000/help-center", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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

/* ===== LIVE SEARCH BAR ===== */
const SearchBar = ({ onSearch }) => {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch("http://localhost:5000/search-live?q=" + encodeURIComponent(query));
      const data = await res.json();
      if (data.success) setSuggestions(data.results);
    } catch { setSuggestions([]); }
  }, []);
  const handleChange = (e) => {
    const val = e.target.value; setQ(val); setShowSug(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };
  const handleSelect = (land) => { setQ(land.title); setShowSug(false); setSuggestions([]); navigate("/land/" + land._id); };
  const handleSearch = () => { setShowSug(false); onSearch(q); };
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="search-wrapper" ref={wrapRef}>
      <div className="search-container-classic">
        <input className="search-input-classic" placeholder="Search city, area, property type..." value={q} onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && handleSearch()} onFocus={() => q.length >= 2 && setShowSug(true)} autoComplete="off" />
        <button className="search-btn-classic" onClick={handleSearch}>&#128269;</button>
      </div>
      {showSug && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((s) => (
            <div key={s._id} className="search-sug-item" onMouseDown={() => handleSelect(s)}>
              <img src={s.image ? "http://localhost:5000/uploads/" + s.image : "https://via.placeholder.com/40"} className="sug-thumb" alt="" />
              <div className="sug-info">
                <span className="sug-title">{s.title}</span>
                <span className="sug-loc">{[s.city, s.district].filter(Boolean).join(", ") || s.location} - {s.subCategory || s.category}</span>
              </div>
              <span className="sug-price">Rs. {parseInt(s.price).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== LAND CARD ===== */
const LandCard = ({ land, user, toggleSave, showActions = false, onDelete }) => {
  const isSaved = user?.savedLands?.includes(land._id);
  const navigate = useNavigate();
  return (
    <div className="land-card">
      <div className="land-image" onClick={() => navigate("/land/" + land._id)}>
        <img src={land.image ? "http://localhost:5000/uploads/" + land.image : "https://via.placeholder.com/400"} alt="land" />
        <div className="card-badge">{land.subCategory || land.category || "Property"}</div>
      </div>
      <div className="land-info">
        <h3>{land.title}</h3>
        <p className="loc-text">{[land.city, land.district, land.province].filter(Boolean).join(", ") || land.location}</p>
        <div className="price-tag">Rs. {parseInt(land.price).toLocaleString()}/mo</div>
        {user?._id === land.ownerId && (<p style={{ fontSize: "0.8rem", color: land.status === "approved" ? "green" : "orange" }}>Status: {land.status?.toUpperCase()}</p>)}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center" }}>
          <button className="btn-outline" onClick={() => navigate("/land/" + land._id)}>Details</button>
          {toggleSave && !showActions && (
            <button className="save-btn" onClick={(e) => { e.stopPropagation(); toggleSave(land._id); }} title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}>
              {isSaved ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#e53935" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              )}
            </button>
          )}
          {showActions && user?._id === land.ownerId && (<button className="btn-outline" onClick={() => navigate("/edit-land/" + land._id)}>✏ Edit</button>)}
          {showActions && (<button className="btn-danger" onClick={() => onDelete(land._id)}>Delete</button>)}
        </div>
      </div>
    </div>
  );
};

/* ===== FILTER BAR ===== */
const FilterBar = ({ onFilter, refreshList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 200000, location: "", category: "" });
  const wrapRef = useRef(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters); onFilter(newFilters);
  };
  const activeCount = [filters.location, filters.category, filters.minPrice > 0, filters.maxPrice < 200000].filter(Boolean).length;
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="filter-wrapper" ref={wrapRef}>
      <button className={"filter-toggle-btn" + (isOpen ? " active" : "")} onClick={() => setIsOpen(!isOpen)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        Filters
        {activeCount > 0 && <span className="filter-active-dot">{activeCount}</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {isOpen && (
        <div className="filter-dropdown-content">
          <div className="filter-row">
            <div className="filter-item">
              <label>Location</label>
              <input name="location" placeholder="e.g. Kathmandu" value={filters.location} onChange={handleChange} />
            </div>
            <div className="filter-item">
              <label>Property Type</label>
              <select name="category" value={filters.category} onChange={handleChange}>
                <option value="">All Types</option>
                <optgroup label="Land">
                  <option value="Agricultural Land">Agricultural Land</option>
                  <option value="Residential Land">Residential Land</option>
                  <option value="Commercial Land">Commercial Land</option>
                </optgroup>
                <optgroup label="House">
                  <option value="Apartment">Apartment / Flat</option>
                  <option value="House">House / Villa</option>
                  <option value="Bungalow">Bungalow</option>
                </optgroup>
                <optgroup label="Room">
                  <option value="Room - Living">Room (Living)</option>
                  <option value="Room - Office">Room (Office)</option>
                  <option value="Room - Storage">Room (Storage)</option>
                </optgroup>
                <optgroup label="Commercial">
                  <option value="Shop">Shop / Showroom</option>
                  <option value="Office Space">Office Space</option>
                  <option value="Warehouse">Warehouse</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-item">
              <label>Min Rent/mo <span className="filter-val">Rs. {parseInt(filters.minPrice).toLocaleString()}</span></label>
              <input
                type="number"
                name="minPrice"
                min="0"
                max="200000"
                step="500"
                value={filters.minPrice}
                onChange={handleChange}
                className="filter-num-input"
                placeholder="0"
              />
              <input type="range" name="minPrice" min="0" max="200000" step="1000" value={filters.minPrice} onChange={handleChange} className="filter-slider" />
            </div>
            <div className="filter-item">
              <label>Max Rent/mo <span className="filter-val">Rs. {parseInt(filters.maxPrice).toLocaleString()}</span></label>
              <input
                type="number"
                name="maxPrice"
                min="0"
                max="200000"
                step="500"
                value={filters.maxPrice}
                onChange={handleChange}
                className="filter-num-input"
                placeholder="200000"
              />
              <input type="range" name="maxPrice" min="0" max="200000" step="1000" value={filters.maxPrice} onChange={handleChange} className="filter-slider" />
            </div>
          </div>
          <div className="filter-actions">
            <button className="filter-reset-btn" onClick={() => { const reset = { minPrice: 0, maxPrice: 200000, location: "", category: "" }; setFilters(reset); onFilter(reset); }}>Reset</button>
            <button className="filter-refresh-btn" onClick={() => { refreshList(); setIsOpen(false); }}>Apply & Refresh</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===== NEPAL LOCATIONS ===== */
const NEPAL_LOCATIONS = {
  "Bagmati": ["Kathmandu", "Lalitpur", "Bhaktapur", "Makwanpur", "Sindhuli", "Ramechhap", "Dolakha", "Rasuwa", "Nuwakot", "Kavrepalanchok", "Sindhupalchok", "Chitwan"],
  "Gandaki": ["Kaski", "Syangja", "Parbat", "Baglung", "Myagdi", "Mustang", "Manang", "Lamjung", "Tanahu", "Gorkha", "Nawalpur"],
  "Lumbini": ["Rupandehi", "Kapilvastu", "Nawalparasi West", "Palpa", "Arghakhanchi", "Gulmi", "Pyuthan", "Rolpa", "Rukum East", "Dang", "Banke", "Bardiya"],
  "Koshi": ["Morang", "Sunsari", "Jhapa", "Ilam", "Taplejung", "Sankhuwasabha", "Solukhumbu", "Okhaldhunga", "Khotang", "Bhojpur", "Dhankuta", "Terhathum", "Panchthar", "Udayapur"],
  "Madhesh": ["Sarlahi", "Mahottari", "Dhanusha", "Siraha", "Saptari", "Parsa", "Bara", "Rautahat"],
  "Sudurpashchim": ["Kanchanpur", "Kailali", "Dadeldhura", "Doti", "Achham", "Bajhang", "Bajura", "Baitadi", "Darchula"],
  "Karnali": ["Surkhet", "Dailekh", "Jajarkot", "Dolpa", "Humla", "Jumla", "Kalikot", "Mugu", "Rukum West", "Salyan"],
};

/* ===== PROPERTY CATEGORY STRUCTURE ===== */
const PROPERTY_CATEGORIES = {
  "Land": {
    icon: "🌿",
    subCategories: ["Agricultural Land", "Residential Land", "Commercial Land"]
  },
  "House": {
    icon: "🏠",
    subCategories: ["Apartment / Flat", "House / Villa", "Bungalow", "Townhouse"]
  },
  "Room": {
    icon: "🚪",
    subCategories: ["Room - Living", "Room - Office", "Room - Storage"]
  },
  "Commercial": {
    icon: "🏢",
    subCategories: ["Shop / Showroom", "Office Space", "Warehouse", "Restaurant Space"]
  }
};

/* ===== LAND FORM ===== */
const LandForm = ({ initialData = {}, onSubmit, submitLabel = "Submit Listing" }) => {
  const [province, setProvince] = useState(initialData.province || "");
  const [district, setDistrict] = useState(initialData.district || "");
  const [mainCategory, setMainCategory] = useState(initialData.mainCategory || "");
  const [subCategory, setSubCategory] = useState(initialData.subCategory || initialData.category || "");
  const districts = province ? NEPAL_LOCATIONS[province] || [] : [];
  const subCats = mainCategory ? PROPERTY_CATEGORIES[mainCategory]?.subCategories || [] : [];

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data">
      <div className="form-grid">
        <input name="title" placeholder="Property Title" required defaultValue={initialData.title || ""} />
        <input name="price" type="number" placeholder="Monthly Rent (Rs.)" required defaultValue={initialData.price || ""} />
        <input name="areaSize" placeholder="Area Size (e.g. 5 aana, 200 sqft)" required defaultValue={initialData.areaSize || ""} />

        {/* Category Selection */}
        <div className="form-full">
          <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "6px" }}>Property Category</label>
          <div className="category-selector">
            {Object.entries(PROPERTY_CATEGORIES).map(([cat, info]) => (
              <button
                key={cat}
                type="button"
                className={"cat-btn" + (mainCategory === cat ? " selected" : "")}
                onClick={() => { setMainCategory(cat); setSubCategory(""); }}
              >
                <span>{info.icon}</span> {cat}
              </button>
            ))}
          </div>
          <input type="hidden" name="mainCategory" value={mainCategory} />
        </div>

        {mainCategory && (
          <div className="form-full">
            <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "6px" }}>Sub-Category</label>
            <div className="subcategory-selector">
              {subCats.map(sc => (
                <button
                  key={sc}
                  type="button"
                  className={"subcat-btn" + (subCategory === sc ? " selected" : "")}
                  onClick={() => setSubCategory(sc)}
                >
                  {sc}
                </button>
              ))}
            </div>
            <input type="hidden" name="subCategory" value={subCategory} />
            <input type="hidden" name="category" value={mainCategory} />
            {!subCategory && <p style={{ fontSize: "0.78rem", color: "#e53935", marginTop: "4px" }}>Please select a sub-category</p>}
          </div>
        )}

        {/* Land-specific fields */}
        {mainCategory === "Land" && (
          <>
            <div className="form-full">
              <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "4px" }}>Land Use / Zoning</label>
              <select name="landUse" defaultValue={initialData.landUse || ""}>
                <option value="">Select Land Use</option>
                <option value="Farming">Farming / Cultivation</option>
                <option value="Orchard">Orchard / Garden</option>
                <option value="Pasture">Pasture / Grazing</option>
                <option value="Residential Plot">Residential Plot</option>
                <option value="Commercial Plot">Commercial Plot</option>
                <option value="Industrial">Industrial Zone</option>
              </select>
            </div>
            <input name="roadAccess" placeholder="Road Access (e.g. 20ft black top)" defaultValue={initialData.roadAccess || ""} />
            <input name="waterSource" placeholder="Water Source (e.g. municipal, well)" defaultValue={initialData.waterSource || ""} />
          </>
        )}

        {/* House-specific fields */}
        {mainCategory === "House" && (
          <>
            <input name="bedrooms" type="number" placeholder="Number of Bedrooms" min="0" defaultValue={initialData.bedrooms || ""} />
            <input name="bathrooms" type="number" placeholder="Number of Bathrooms" min="0" defaultValue={initialData.bathrooms || ""} />
            <select name="furnishing" defaultValue={initialData.furnishing || ""}>
              <option value="">Furnishing Status</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Fully Furnished">Fully Furnished</option>
            </select>
            <select name="floor" defaultValue={initialData.floor || ""}>
              <option value="">Floor</option>
              <option value="Ground">Ground Floor</option>
              <option value="1st">1st Floor</option>
              <option value="2nd">2nd Floor</option>
              <option value="3rd">3rd Floor</option>
              <option value="4th+">4th Floor or Above</option>
            </select>
          </>
        )}

        {/* Room-specific fields */}
        {mainCategory === "Room" && (
          <>
            <select name="furnishing" defaultValue={initialData.furnishing || ""}>
              <option value="">Furnishing Status</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Fully Furnished">Fully Furnished</option>
            </select>
            <select name="attachedBathroom" defaultValue={initialData.attachedBathroom || ""}>
              <option value="">Bathroom</option>
              <option value="Attached">Attached Bathroom</option>
              <option value="Shared">Shared Bathroom</option>
            </select>
          </>
        )}

        <select name="province" required value={province} onChange={e => { setProvince(e.target.value); setDistrict(""); }}>
          <option value="">Select Province</option>
          {Object.keys(NEPAL_LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="district" required value={district} onChange={e => setDistrict(e.target.value)} disabled={!province}>
          <option value="">Select District</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input name="city" placeholder="City / VDC / Tole" required defaultValue={initialData.city || ""} />
        <input name="location" placeholder="Specific Location / Landmark" required defaultValue={initialData.location || ""} />
        <input name="ownerName" placeholder="Owner Name" required defaultValue={initialData.ownerName || ""} />
        <input name="ownerPhone" placeholder="Contact Phone (10 digits)" required pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" defaultValue={initialData.ownerPhone || ""} />
        <input name="ownerEmail" type="email" placeholder="Owner Email" required defaultValue={initialData.ownerEmail || ""} />
        <div className="form-full">
          <label style={{ fontSize: "0.8rem", color: "#666" }}>Map Location (Google Maps link, city name, or Lat/Lng)</label>
          <input name="mapUrl" placeholder="e.g. Kathmandu, Nepal OR 27.7172, 85.3240" defaultValue={initialData.mapUrl || ""} />
        </div>
      </div>
      <textarea name="description" placeholder="Detailed Description..." rows="4" style={{ width: "100%", marginTop: "10px" }} defaultValue={initialData.description || ""}></textarea>
      <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block" }}>Property Image {initialData.image ? "(leave blank to keep current)" : "(Public)"}</label>
          <input type="file" name="image" accept="image/*" {...(!initialData.image ? { required: true } : {})} />
        </div>
        {!initialData._id && (
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", color: "red", fontWeight: "bold" }}>Lalpurja / Ownership Document (Admin Only)</label>
            <input type="file" name="lalpurja" required />
          </div>
        )}
      </div>
      <button className="btn-primary full-width" style={{ marginTop: "20px" }} type="submit" disabled={mainCategory && !subCategory}>{submitLabel}</button>
    </form>
  );
};

/* ===== LAND DETAILS PAGE ===== */
const LandDetailsPage = ({ user, toggleSave, onChatWith }) => {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [owner, setOwner] = useState(null);
  const [rentDuration, setRentDuration] = useState("");
  const [rentMonths, setRentMonths] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/land/" + id).then(res => res.json()).then(async data => {
      setLand(data.land);
      if (data.land?.ownerId) {
        const ur = await fetch("http://localhost:5000/user/" + data.land.ownerId);
        const ud = await ur.json();
        if (ud.success) setOwner(ud.user);
      }
    });
  }, [id]);

  const handleBookingRequest = async () => {
    if (!rentDuration) { alert("Please specify the rental duration."); return; }
    setShowPayment(false);
    const body = { landId: land._id, buyerId: user._id, sellerId: land.ownerId, paymentAmount: 5000, rentDuration, rentDurationMonths: rentMonths };
    const res = await fetch("http://localhost:5000/book-land", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if ((await res.json()).success) alert("Booking Request Sent! The owner will be notified via email.");
  };

  const handleRequestClick = () => {
    if (!user) return navigate("/login");
    if (user._id === land.ownerId) return alert("You are the owner of this property.");
    if (!rentDuration) { alert("Please enter the rental duration before requesting."); return; }
    setShowPayment(true);
  };

  if (!land) return <div className="loading">Loading details...</div>;

  return (
    <div className="details-page container">
      {showPayment && (<DummyEsewaPayment amount={5000} description={"Booking Request for: " + land.title} onSuccess={handleBookingRequest} onCancel={() => setShowPayment(false)} />)}
      <button className="back-btn" onClick={() => navigate(-1)}>&#8592; Back</button>
      <div className="details-grid">
        <div className="details-left">
          <div className="image-container-fixed">
            <img className="main-img" src={land.image ? "http://localhost:5000/uploads/" + land.image : "https://via.placeholder.com/600"} alt={land.title} />
          </div>
          <div className="details-desc"><h2>About Property</h2><p>{land.description || "No description provided."}</p></div>
          {land.mapUrl && (
            <div className="details-map-section">
              <h3>Property Location</h3>
              <iframe width="100%" height="400" style={{ border: 0, borderRadius: "8px" }} loading="lazy" allowFullScreen src={"https://maps.google.com/maps?q=" + encodeURIComponent(land.mapUrl) + "&output=embed"}></iframe>
            </div>
          )}
        </div>
        <div className="details-right">
          <div className="info-box sticky-box">
            <h1>{land.title}</h1>
            <h2 className="price-lg">Rs. {parseInt(land.price).toLocaleString()}<span style={{ fontSize: "1rem", fontWeight: 400, color: "#888" }}>/month</span></h2>
            <p className="category-tag">{land.category}</p>
            <hr />
            <div className="meta-grid">
              <div className="meta-item"><span>&#128205; Province</span><strong>{land.province || "N/A"}</strong></div>
              <div className="meta-item"><span>&#128506; District</span><strong>{land.district || "N/A"}</strong></div>
              <div className="meta-item"><span>&#127961; City</span><strong>{land.city || "N/A"}</strong></div>
              <div className="meta-item"><span>&#128204; Location</span><strong>{land.location}</strong></div>
              <div className="meta-item"><span>&#128208; Area</span><strong>{land.areaSize || "N/A"}</strong></div>
            </div>
            <hr />
            <h3>Owner Contact</h3>
            <div className="owner-box">
              <p><strong>{land.ownerName}</strong></p>
              <p>{land.ownerPhone}</p>
              {land.ownerEmail && <p>{land.ownerEmail}</p>}
            </div>
            <hr />
            <div className="rent-duration-box">
              <label className="rent-dur-label">Rental Duration</label>
              <div className="rent-dur-row">
                <input type="number" min="1" max="120" value={rentMonths} onChange={e => { setRentMonths(parseInt(e.target.value) || 1); setRentDuration(e.target.value + " months"); }} className="rent-dur-input" placeholder="e.g. 6" />
                <select className="rent-dur-select" onChange={e => { const unit = e.target.value; setRentDuration(rentMonths + " " + unit); }}>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              {rentDuration && <p className="rent-dur-preview">Duration: {rentDuration}</p>}
            </div>
            <div className="action-row-vertical">
              <button className="btn-primary full-width" onClick={handleRequestClick}>&#128203; Request to Rent</button>
              {user && user._id !== land.ownerId && owner && (
                <button className="btn-secondary full-width" onClick={() => onChatWith(owner)}>&#128172; Chat with Owner</button>
              )}
              <button className="btn-secondary full-width" onClick={() => toggleSave(land._id)}>
                {user?.savedLands?.includes(land._id) ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="#e53935" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>Remove from Wishlist</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>Add to Wishlist</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== EDIT LAND PAGE ===== */
const EditLandPage = ({ user }) => {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { fetch("http://localhost:5000/land/" + id).then(r => r.json()).then(d => setLand(d.land)); }, [id]);
  if (!user) return <Navigate to="/login" />;
  if (!land) return <div className="loading">Loading...</div>;
  if (land.ownerId !== user._id) return <Navigate to="/" />;
  const handleEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append("ownerId", user._id);
    const res = await fetch("http://localhost:5000/edit-land/" + id, { method: "PUT", body: fd });
    const data = await res.json();
    if (data.success) { alert("Land updated successfully!"); navigate("/dashboard/listed"); }
    else alert(data.message || "Update failed");
  };
  return (<div className="auth-container wide"><h2>Edit Property</h2><LandForm initialData={land} onSubmit={handleEdit} submitLabel="Save Changes" /></div>);
};

/* ===== BECOME SELLER SECTION (inside Profile) ===== */
const BecomeSellerSection = ({ user, setUser }) => {
  const [docType, setDocType] = useState("citizenship");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { alert("Please upload your document."); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("userId", user._id);
    fd.append("sellerDocType", docType);
    fd.append("sellerDoc", file);
    const res = await fetch("http://localhost:5000/become-seller", { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("properEstateUser", JSON.stringify(data.user));
      setDone(true);
    } else alert(data.message || "Failed");
    setLoading(false);
  };

  if (user.accountType === "seller") return (
    <div className="seller-status-box approved">
      <div className="seller-status-icon">&#10003;</div>
      <h3>Verified Seller Account</h3>
      <p>You can list properties for rent on ProperEstate.</p>
    </div>
  );

  if (user.accountType === "seller_pending" || done) return (
    <div className="seller-status-box pending">
      <div className="seller-status-icon">&#8987;</div>
      <h3>Verification Pending</h3>
      <p>Your documents are under review. Admin will verify within 24-48 hours.</p>
    </div>
  );

  return (
    <div className="become-seller-box">
      <h3>Become a Seller</h3>
      <p>Upload a valid ID document to list properties for rent.</p>
      <form onSubmit={handleSubmit} className="seller-form">
        <div className="profile-field">
          <label>Document Type</label>
          <select value={docType} onChange={e => setDocType(e.target.value)} className="seller-select">
            <option value="citizenship">Citizenship Certificate</option>
            <option value="nid">National ID (NID)</option>
            <option value="passport">Passport</option>
          </select>
        </div>
        <div className="profile-field">
          <label>Upload Document (Photo / Scan)</label>
          <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} required />
        </div>
        <button className="btn-primary full-width" type="submit" disabled={loading}>{loading ? "Uploading..." : "Submit for Verification"}</button>
      </form>
    </div>
  );
};

/* ===== SIGNUP PAGE WITH SELLER OPTION ===== */
const SignupPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [wantSeller, setWantSeller] = useState(false);
  const [docType, setDocType] = useState("citizenship");
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form"); // form | pending

  const handleSignup = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const phone = e.target.phone.value.trim();
    const password = e.target.password.value;

    if (!name || !email || !phone || !password) { alert("All fields are required."); return; }
    if (!/^[0-9]{10}$/.test(phone)) { alert("Phone must be exactly 10 digits."); return; }
    if (wantSeller && !docFile) { alert("Please upload your ID document to register as a seller."); return; }

    setLoading(true);
    try {
      if (wantSeller) {
        // Seller registration: first create user, then upload doc
        const signupRes = await fetch("http://localhost:5000/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password })
        });
        const signupData = await signupRes.json();
        if (!signupData.success) { alert(signupData.message || "Signup failed"); setLoading(false); return; }

        // Upload seller doc
        const fd = new FormData();
        fd.append("userId", signupData.user._id);
        fd.append("sellerDocType", docType);
        fd.append("sellerDoc", docFile);
        const sellerRes = await fetch("http://localhost:5000/become-seller", { method: "POST", body: fd });
        const sellerData = await sellerRes.json();
        if (sellerData.success) {
          setStep("pending");
        } else {
          alert("Account created but seller doc upload failed. Please go to Profile to retry.");
          setUser(signupData.user);
          localStorage.setItem("properEstateUser", JSON.stringify(signupData.user));
          navigate("/profile");
        }
      } else {
        const res = await fetch("http://localhost:5000/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem("properEstateUser", JSON.stringify(data.user));
          navigate(data.user.role === "admin" ? "/admin" : "/");
        } else alert(data.message || "Signup failed");
      }
    } catch (err) { alert("Network error. Please try again."); }
    setLoading(false);
  };

  if (step === "pending") return (
    <div className="auth-container" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
      <h2 style={{ color: "#1a3c34" }}>Account Created!</h2>
      <p style={{ color: "#666", marginBottom: 8 }}>Your seller verification is <strong>pending admin review</strong>.</p>
      <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 24 }}>You can log in now. Seller features will be unlocked once your ID is approved (24–48 hrs).</p>
      <button className="btn-primary full-width" onClick={() => navigate("/login")}>Go to Login</button>
    </div>
  );

  return (
    <div className="auth-container" style={{ maxWidth: 460 }}>
      <h2>Create Account</h2>
      <form onSubmit={handleSignup}>
        <input name="name" placeholder="Full Name" required />
        <input name="email" type="email" placeholder="Email Address" required />
        <input name="phone" placeholder="Phone Number (10 digits)" maxLength={10} required />
        <input name="password" type="password" placeholder="Password" required />

        {/* Seller toggle */}
        <div className="signup-seller-toggle" onClick={() => setWantSeller(v => !v)}>
          <div className={"toggle-switch" + (wantSeller ? " on" : "")}>
            <div className="toggle-knob"></div>
          </div>
          <div>
            <span className="toggle-label">Register as Seller</span>
            <p className="toggle-hint">List properties for rent. Requires ID verification.</p>
          </div>
        </div>

        {wantSeller && (
          <div className="seller-doc-box">
            <p className="seller-doc-note">📋 Upload a valid government ID. Your account will be reviewed by admin before seller features are activated.</p>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ marginBottom: 10 }}>
              <option value="citizenship">Citizenship Certificate</option>
              <option value="nid">National ID (NID)</option>
              <option value="passport">Passport</option>
            </select>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Upload Document Photo / Scan</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setDocFile(e.target.files[0])} required={wantSeller} />
            {docFile && <p style={{ fontSize: "0.78rem", color: "#43a047", marginTop: 4 }}>✓ {docFile.name}</p>}
          </div>
        )}

        <button className="btn-primary full-width" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Creating Account..." : wantSeller ? "Register & Submit for Verification" : "Create Account"}
        </button>
      </form>
      <p onClick={() => navigate("/login")} className="auth-link">Already have an account? Login</p>
    </div>
  );
};

/* ===== ADMIN DASHBOARD ===== */
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [lands, setLands] = useState([]);
  const [view, setView] = useState("pending");
  const fetchAdminData = () => {
    fetch("http://localhost:5000/admin/users").then(res => res.json()).then(d => setUsers(d.users));
    fetch("http://localhost:5000/admin/all-lands").then(res => res.json()).then(d => setLands(d.lands));
  };
  useEffect(() => { fetchAdminData(); }, []);
  const handleVerify = async (id, status) => {
    if (!window.confirm("Mark this land as " + status + "?")) return;
    await fetch("http://localhost:5000/admin/verify-land/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAdminData();
  };
  const deleteLand = async (id) => {
    if (!window.confirm("Delete this land?")) return;
    await fetch("http://localhost:5000/admin/delete-land/" + id, { method: "DELETE" });
    fetchAdminData();
  };
  const deleteUser = async (id) => {
    if (!window.confirm("Delete User AND their lands?")) return;
    await fetch("http://localhost:5000/admin/delete-user/" + id, { method: "DELETE" });
    fetchAdminData();
  };
  const verifySeller = async (id, status) => {
    await fetch("http://localhost:5000/admin/verify-seller/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAdminData();
  };
  const setAccountType = async (id, accountType) => {
    await fetch("http://localhost:5000/admin/set-account-type/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountType }) });
    fetchAdminData();
  };
  const pendingSellers = users.filter(u => u.accountType === "seller_pending");
  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <div onClick={() => setView("pending")} className={view === "pending" ? "active" : ""}>Pending Lands</div>
        <div onClick={() => setView("sellers")} className={view === "sellers" ? "active" : ""}>
          Seller Requests {pendingSellers.length > 0 && <span className="admin-badge">{pendingSellers.length}</span>}
        </div>
        <div onClick={() => setView("lands")} className={view === "lands" ? "active" : ""}>All Lands</div>
        <div onClick={() => setView("users")} className={view === "users" ? "active" : ""}>Manage Users</div>
      </div>
      <div className="admin-content">
        <h1>{view === "lands" ? "All Listed Properties" : view === "users" ? "Registered Users" : view === "sellers" ? "Seller Verification Requests" : "Pending Land Verifications"}</h1>
        {view === "pending" && (
          <div className="users-list">
            {lands.filter(l => l.status === "pending").map(l => (
              <div key={l._id} className="user-row" style={{ flexDirection: "column", gap: "10px" }}>
                <div className="user-info">
                  <strong>{l.title}</strong> - {[l.city, l.district, l.province].filter(Boolean).join(", ") || l.location} (Owner: {l.ownerName})
                  {l.ownerEmail && <span style={{ color: "#666", fontSize: "0.85rem" }}> - {l.ownerEmail}</span>}
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <a href={"http://localhost:5000/uploads/" + l.lalpurjaImage} target="_blank" rel="noreferrer" style={{ color: "blue" }}>View Lalpurja</a>
                  <button className="btn-primary" onClick={() => handleVerify(l._id, "approved")}>Approve</button>
                  <button className="btn-danger-sm" onClick={() => handleVerify(l._id, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
            {lands.filter(l => l.status === "pending").length === 0 && <p>No pending lands.</p>}
          </div>
        )}
        {view === "sellers" && (
          <div className="users-list">
            {pendingSellers.length === 0 && <p>No pending seller requests.</p>}
            {pendingSellers.map(u => (
              <div key={u._id} className="user-row" style={{ flexDirection: "column", gap: "10px" }}>
                <div className="user-info">
                  <strong>{u.name}</strong> - {u.email}
                  <span style={{ marginLeft: 8, color: "#888", fontSize: "0.85rem" }}>Doc: {u.sellerDocType}</span>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {u.sellerDoc && <a href={"http://localhost:5000/uploads/" + u.sellerDoc} target="_blank" rel="noreferrer" style={{ color: "blue" }}>View Document</a>}
                  <button className="btn-primary" onClick={() => verifySeller(u._id, "approved")}>Approve Seller</button>
                  <button className="btn-danger-sm" onClick={() => verifySeller(u._id, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {view === "lands" && (
          <div className="lands-grid">
            {lands.map(l => (<div key={l._id}><LandCard land={l} showActions={true} onDelete={deleteLand} /><p style={{ textAlign: "center", marginTop: "5px", fontWeight: "bold" }}>Status: {l.status}</p></div>))}
          </div>
        )}
        {view === "users" && (
          <div className="users-list">
            {users.map(u => (
              <div key={u._id} className="user-row">
                <div className="user-info">
                  <strong>{u.name}</strong>
                  <span>{u.email}</span>
                  <span style={{ fontSize: "0.8rem", color: u.accountType === "seller" ? "green" : u.accountType === "seller_pending" ? "orange" : "#888" }}>
                    {u.accountType || "buyer"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {u.accountType !== "seller" && <button className="btn-primary" style={{ fontSize: "0.8rem", padding: "6px 10px" }} onClick={() => setAccountType(u._id, "seller")}>Make Seller</button>}
                  {u.accountType === "seller" && <button className="btn-outline" style={{ fontSize: "0.8rem", padding: "6px 10px" }} onClick={() => setAccountType(u._id, "buyer")}>Revoke Seller</button>}
                  <button className="btn-danger-sm" onClick={() => deleteUser(u._id)}>Ban</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== PROFILE PAGE ===== */
const ProfilePage = ({ user, setUser }) => {
  const [formData, setFormData] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [file, setFile] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [saved, setSaved] = useState(false);
  const validatePhone = (val) => { if (val && !/^[0-9]{10}$/.test(val)) setPhoneError("Phone must be exactly 10 digits"); else setPhoneError(""); };
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) { setPhoneError("Phone must be exactly 10 digits"); return; }
    const data = new FormData();
    data.append("userId", user._id); data.append("name", formData.name); data.append("phone", formData.phone);
    if (file) data.append("avatar", file);
    const res = await fetch("http://localhost:5000/update-profile", { method: "POST", body: data });
    const result = await res.json();
    if (result.success) { setUser(result.user); localStorage.setItem("properEstateUser", JSON.stringify(result.user)); setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };
  if (!user) return <Navigate to="/login" />;
  const avatarSrc = file ? URL.createObjectURL(file) : (user.avatar ? "http://localhost:5000/uploads/" + user.avatar : null);
  return (
    <div className="profile-page-wrapper">
      <div className="profile-cover"><div className="profile-cover-gradient"></div></div>
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            {avatarSrc ? <img src={avatarSrc} alt="avatar" className="profile-avatar-img" /> : <div className="profile-avatar-placeholder">{user.name?.[0]?.toUpperCase() || "U"}</div>}
          </div>
          <input type="file" id="avatarInput" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          <label htmlFor="avatarInput" className="profile-camera-btn" title="Change photo">&#128247;</label>
        </div>
        <div className="profile-user-meta">
          <h2 className="profile-display-name">{user.name}</h2>
          <p className="profile-display-email">{user.email}</p>
          <span className="profile-role-badge">{user.role === "admin" ? "Admin" : user.accountType === "seller" ? "Verified Seller" : user.accountType === "seller_pending" ? "Seller Pending" : "Buyer"}</span>
        </div>
        <form className="profile-form-new" onSubmit={handleUpdate}>
          <div className="profile-field">
            <label>Full Name</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">&#128100;</span>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your full name" required />
            </div>
          </div>
          <div className="profile-field">
            <label>Phone Number</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">&#128222;</span>
              <input value={formData.phone} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 10); setFormData({ ...formData, phone: v }); validatePhone(v); }} placeholder="10-digit phone number" maxLength={10} inputMode="numeric" />
            </div>
            {phoneError && <p className="profile-field-error">{phoneError}</p>}
            {formData.phone && !phoneError && formData.phone.length === 10 && (<p className="profile-field-ok">Valid phone number</p>)}
          </div>
          <div className="profile-field readonly">
            <label>Email Address</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">&#9993;</span>
              <input value={user.email} disabled />
            </div>
            <p className="profile-field-hint">Email cannot be changed</p>
          </div>
          <button className={"profile-save-btn " + (saved ? "saved" : "")} type="submit">{saved ? "Saved!" : "Save Changes"}</button>
        </form>
        <div style={{ padding: "0 28px 28px" }}>
          <BecomeSellerSection user={user} setUser={setUser} />
        </div>
      </div>
    </div>
  );
};

/* ===== TOAST NOTIFICATION ===== */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={"toast-notif toast-" + (type || "info")}>
      <span>{msg}</span>
      <button onClick={onClose} className="toast-close">✕</button>
    </div>
  );
};

/* ===== RENTAL PARTNER PAGE ===== */
const PARTNER_CATEGORIES = {
  "Land":  { icon: "🌿", subs: ["Agricultural Land", "Residential Land", "Commercial Land"] },
  "House": { icon: "🏠", subs: ["Apartment / Flat", "House / Villa", "Bungalow"] },
  "Room":  { icon: "🚪", subs: ["Room - Living", "Room - Office", "Room - Storage"] },
};

const PartnerCard = ({ p, onChat, currentUserId }) => {
  const typeIcon = PARTNER_CATEGORIES[p.propertyType]?.icon || "🏘";
  const initials = (p.name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const budgetFmt = p.budget ? `Rs. ${parseInt(p.budget).toLocaleString()}/mo` : "—";
  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  // The poster's user object (populated from backend)
  const posterUser = p.userId && typeof p.userId === "object" ? p.userId : null;
  const isOwn = posterUser?._id && currentUserId && posterUser._id.toString() === currentUserId.toString();
  return (
    <div className="pcard">
      <div className="pcard-top">
        <div className="pcard-avatar">{initials}</div>
        <div className="pcard-meta">
          <span className="pcard-name">{p.name}</span>
          <span className="pcard-date">{dateStr}</span>
        </div>
        <div className="pcard-type-badge">{typeIcon} {p.propertyType}</div>
      </div>
      <div className="pcard-subcat">{p.subCategory}</div>
      <div className="pcard-row">
        <span className="pcard-icon-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {p.location}
        </span>
        <span className="pcard-budget">{budgetFmt}</span>
      </div>
      {(p.preferredGender || p.preferredAge || p.moveInDate) && (
        <div className="pcard-prefs">
          {p.preferredGender && p.preferredGender !== "No Preference" && (
            <span className="pcard-pref-tag">👤 {p.preferredGender}</span>
          )}
          {p.preferredAge && p.preferredAge !== "No Preference" && (
            <span className="pcard-pref-tag">🎂 {p.preferredAge} yrs</span>
          )}
          {p.moveInDate && (
            <span className="pcard-pref-tag">📅 {new Date(p.moveInDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
          )}
        </div>
      )}
      {p.description && <p className="pcard-desc">{p.description}</p>}
      <div className="pcard-contact">
        <a href={`tel:${p.phone}`} className="pcard-contact-btn phone">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Call
        </a>
        <a href={`mailto:${p.email}`} className="pcard-contact-btn email">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
          Email
        </a>
        {onChat && posterUser && !isOwn && (
          <button className="pcard-contact-btn msg" onClick={() => onChat(posterUser)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Message
          </button>
        )}
      </div>
    </div>
  );
};

const RentalPartnerPage = ({ user, chatRef }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("browse");
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [searchLoc, setSearchLoc] = useState("");
  const [searchType, setSearchType] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [postStep, setPostStep] = useState("form");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    email: user?.email || "",
    location: "",
    budget: "",
    propertyType: "",
    subCategory: "",
    preferredGender: "",
    preferredAge: "",
    moveInDate: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  const subCats = formData.propertyType ? PARTNER_CATEGORIES[formData.propertyType]?.subs || [] : [];

  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const res = await fetch("http://localhost:5000/rental-partners");
      const data = await res.json();
      if (data.success) setPartners(data.partners);
    } catch {}
    setLoadingPartners(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const filtered = partners.filter(p => {
    const locMatch = !searchLoc || (p.location || "").toLowerCase().includes(searchLoc.toLowerCase());
    const typeMatch = !searchType || p.propertyType === searchType;
    return locMatch && typeMatch;
  });

  // Open the chat window with the partner poster
  const handleChat = (posterUser) => {
    if (!user) return;
    if (chatRef?.current?.open) {
      chatRef.current.open();
    }
    // Small delay so the window opens first, then navigate to that conversation
    setTimeout(() => {
      if (chatRef?.current?.openWith) {
        chatRef.current.openWith(posterUser);
      }
    }, 100);
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.phone || !/^[0-9]{10}$/.test(formData.phone)) e.phone = "Valid 10-digit phone required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) e.email = "Valid email required";
    if (!formData.location.trim()) e.location = "Location is required";
    if (!formData.budget) e.budget = "Budget is required";
    if (!formData.propertyType) e.propertyType = "Property type is required";
    if (!formData.subCategory) e.subCategory = "Sub-category is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    try {
      await fetch("http://localhost:5000/rental-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId: user?._id })
      });
    } catch (err) { console.error(err); }
    setPostStep("success");
    fetchPartners();
  };

  return (
    <div className="rp-page">
      {showPayment && (
        <DummyEsewaPayment
          amount={200}
          description="Rental Partner Listing Fee - ProperEstate"
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Hero */}
      <div className="rp-hero">
        <div className="rp-hero-inner">
          <h1>🤝 Find a Rental Partner</h1>
          <p>Connect with people looking to share rent across Nepal. Browse requests or post your own.</p>
          <div className="rp-hero-stats">
            <span><strong>{partners.length}</strong> active requests</span>
            <span className="rp-hero-dot">·</span>
            <span>Rs. 200 to post</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rp-tabs-bar">
        <div className="rp-tabs">
          <button className={"rp-tab" + (tab === "browse" ? " active" : "")} onClick={() => setTab("browse")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Browse Requests
            {partners.length > 0 && <span className="rp-tab-count">{partners.length}</span>}
          </button>
          <button className={"rp-tab" + (tab === "post" ? " active" : "")} onClick={() => setTab("post")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post a Request
          </button>
        </div>
      </div>

      <div className="rp-body">

        {/* BROWSE TAB */}
        {tab === "browse" && (
          <div>
            <div className="rp-search-bar">
              <div className="rp-search-loc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input placeholder="Search by location..." value={searchLoc} onChange={e => setSearchLoc(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchPartners()} />
              </div>
              <div className="rp-search-divider" />
              <div className="rp-search-type">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <select value={searchType} onChange={e => setSearchType(e.target.value)}>
                  <option value="">All Types</option>
                  {Object.keys(PARTNER_CATEGORIES).map(k => (
                    <option key={k} value={k}>{PARTNER_CATEGORIES[k].icon} {k}</option>
                  ))}
                </select>
              </div>
              <button className="rp-search-btn" onClick={fetchPartners}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search
              </button>
            </div>

            {(searchLoc || searchType) && (
              <div className="rp-filter-chips">
                {searchLoc && <span className="rp-chip">📍 {searchLoc} <button onClick={() => setSearchLoc("")}>✕</button></span>}
                {searchType && <span className="rp-chip">{PARTNER_CATEGORIES[searchType]?.icon} {searchType} <button onClick={() => setSearchType("")}>✕</button></span>}
                <span className="rp-chip-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {loadingPartners ? (
              <div className="rp-loading">
                <div className="rp-spinner"></div>
                <p>Loading partner requests...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rp-empty">
                <div style={{ fontSize: 52 }}>🤝</div>
                <h3>No requests found</h3>
                <p>{partners.length === 0 ? "Be the first to post a rental partner request!" : "Try adjusting your search filters."}</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTab("post")}>Post a Request</button>
              </div>
            ) : (
              <div className="pcard-grid">
                {filtered.map((p, i) => <PartnerCard key={p._id || i} p={p} onChat={user ? handleChat : null} currentUserId={user?._id} />)}
              </div>
            )}
          </div>
        )}

        {/* POST TAB */}
        {tab === "post" && (
          <div className="rp-post-wrap">
            {postStep === "success" ? (
              <div className="rp-success-box">
                <div className="rp-success-icon">🤝</div>
                <h2>Request Posted!</h2>
                <p>Your rental partner listing is now live. People will contact you directly via phone or email.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
                  <button className="btn-primary" onClick={() => { setPostStep("form"); setTab("browse"); }}>Browse All Requests</button>
                  <button className="btn-outline" onClick={() => { setPostStep("form"); setFormData({ name: user?.name||"", phone:"", email: user?.email||"", location:"", budget:"", propertyType:"", subCategory:"", preferredGender:"", preferredAge:"", moveInDate:"", description:"" }); }}>Post Another</button>
                </div>
              </div>
            ) : (
              <>
                <div className="rp-post-header">
                  <h3>Post Your Partner Request</h3>
                  <p>Fill in your details and pay <strong>Rs. 200</strong> via eSewa to go live.</p>
                </div>
                <form onSubmit={handleSubmit} className="rp-form">
                  <div className="rp-section">
                    <h4>Your Details</h4>
                    <div className="rp-grid">
                      <div className="rp-field">
                        <label>Full Name *</label>
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your full name" />
                        {errors.name && <span className="rp-error">{errors.name}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Phone Number *</label>
                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,"").slice(0,10)})} placeholder="10-digit phone" maxLength={10} />
                        {errors.phone && <span className="rp-error">{errors.phone}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Email *</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
                        {errors.email && <span className="rp-error">{errors.email}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Preferred Location *</label>
                        <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Kathmandu, Lalitpur" />
                        {errors.location && <span className="rp-error">{errors.location}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="rp-section">
                    <h4>What You're Looking For</h4>
                    <div className="rp-field">
                      <label>Property Type *</label>
                      <div className="category-selector">
                        {Object.entries(PARTNER_CATEGORIES).map(([cat, info]) => (
                          <button key={cat} type="button"
                            className={"cat-btn" + (formData.propertyType === cat ? " selected" : "")}
                            onClick={() => setFormData({...formData, propertyType: cat, subCategory: ""})}>
                            {info.icon} {cat}
                          </button>
                        ))}
                      </div>
                      {errors.propertyType && <span className="rp-error">{errors.propertyType}</span>}
                    </div>
                    {formData.propertyType && (
                      <div className="rp-field" style={{ marginTop: 10 }}>
                        <label>Sub-Category *</label>
                        <div className="subcategory-selector">
                          {subCats.map(sc => (
                            <button key={sc} type="button"
                              className={"subcat-btn" + (formData.subCategory === sc ? " selected" : "")}
                              onClick={() => setFormData({...formData, subCategory: sc})}>
                              {sc}
                            </button>
                          ))}
                        </div>
                        {errors.subCategory && <span className="rp-error">{errors.subCategory}</span>}
                      </div>
                    )}
                    <div className="rp-grid" style={{ marginTop: 14 }}>
                      <div className="rp-field">
                        <label>Monthly Budget (Rs.) *</label>
                        <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="e.g. 8000" min="0" />
                        {errors.budget && <span className="rp-error">{errors.budget}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Move-in Date (Optional)</label>
                        <input type="date" value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="rp-section">
                    <h4>Partner Preferences <span style={{fontWeight:400,color:"#aaa",fontSize:"0.8rem"}}>(Optional)</span></h4>
                    <div className="rp-grid">
                      <div className="rp-field">
                        <label>Preferred Partner Gender</label>
                        <select value={formData.preferredGender} onChange={e => setFormData({...formData, preferredGender: e.target.value})}>
                          <option value="">No Preference</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Any">Any</option>
                        </select>
                      </div>
                      <div className="rp-field">
                        <label>Preferred Partner Age Range</label>
                        <select value={formData.preferredAge} onChange={e => setFormData({...formData, preferredAge: e.target.value})}>
                          <option value="">No Preference</option>
                          <option value="18-25">18–25</option>
                          <option value="25-35">25–35</option>
                          <option value="35-50">35–50</option>
                          <option value="50+">50+</option>
                        </select>
                      </div>
                    </div>
                    <div className="rp-field" style={{ marginTop: 14 }}>
                      <label>Additional Details</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Lifestyle, occupation, preferences..." style={{width:"100%",resize:"vertical"}} />
                    </div>
                  </div>

                  <div className="rp-submit-area">
                    <p className="rp-fee-note">💳 A listing fee of <strong>Rs. 200</strong> will be charged via eSewa to publish your request.</p>
                    <button type="submit" className="btn-primary full-width" style={{marginTop:12}}>
                      Post Partner Request — Pay Rs. 200
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
function App() {
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [user, setUser] = useState(getUserFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState({ uploaded: [], saved: [], bookings: [] });
  const [showDashMenu, setShowDashMenu] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [cachedAddFormData, setCachedAddFormData] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [toast, setToast] = useState(null);
  const chatRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchLands = async () => {
    try {
      const res = await fetch("http://localhost:5000/lands");
      const data = await res.json();
      setLands(data.lands); setFilteredLands(data.lands);
    } catch (err) { console.error("Failed to fetch lands", err); }
  };

  const fetchDashboardData = async () => {
    if (user?._id) {
      fetch("http://localhost:5000/user-dashboard/" + user._id).then(r => r.json()).then(d => {
        setDashData(prev => ({ ...prev, uploaded: d.uploaded, saved: d.saved }));
      });
      fetch("http://localhost:5000/seller/bookings/" + user._id).then(r => r.json()).then(d => {
        setDashData(prev => ({ ...prev, bookings: d.bookings }));
        const pending = (d.bookings || []).filter(b => b.status === "pending").length;
        setBookingCount(pending);
      });
    }
  };

  useEffect(() => { fetchLands(); }, []);
  useEffect(() => { fetchDashboardData(); }, [user, location.pathname]);

  const toggleSave = async (landId) => {
    if (!user) return navigate("/login");
    const res = await fetch("http://localhost:5000/toggle-save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user._id, landId }) });
    const data = await res.json();
    const updatedUser = { ...user, savedLands: data.savedLands };
    setUser(updatedUser); localStorage.setItem("properEstateUser", JSON.stringify(updatedUser));
  };

  const handleAuth = async (e, type) => {
    e.preventDefault();
    const body = type === "login"
      ? { email: e.target.email.value, password: e.target.password.value }
      : { name: e.target.name.value, email: e.target.email.value, password: e.target.password.value };
    const res = await fetch("http://localhost:5000/" + type, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      setUser(data.user); localStorage.setItem("properEstateUser", JSON.stringify(data.user));
      if (data.user.role === "admin") navigate("/admin"); else navigate("/");
    } else alert(data.message || "Error");
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem("properEstateUser"); navigate("/login"); setSidebarOpen(false); };

  const applyFilters = (filters) => {
    let temp = [...lands];
    if (filters.location) temp = temp.filter(l => (l.location || "").toLowerCase().includes(filters.location.toLowerCase()) || (l.city || "").toLowerCase().includes(filters.location.toLowerCase()) || (l.district || "").toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.minPrice) temp = temp.filter(l => l.price >= parseInt(filters.minPrice));
    if (filters.maxPrice) temp = temp.filter(l => l.price <= parseInt(filters.maxPrice));
    if (filters.category) temp = temp.filter(l => l.subCategory === filters.category || l.category === filters.category || l.mainCategory === filters.category);
    setFilteredLands(temp);
  };

  const handleGlobalSearch = (query) => {
    const lowerQ = query.toLowerCase();
    const results = lands.filter(l => (l.title || "").toLowerCase().includes(lowerQ) || (l.location || "").toLowerCase().includes(lowerQ) || (l.city || "").toLowerCase().includes(lowerQ) || (l.district || "").toLowerCase().includes(lowerQ) || (l.province || "").toLowerCase().includes(lowerQ));
    setFilteredLands(results); navigate("/");
  };

  const respondToBooking = async (id, status) => {
    await fetch("http://localhost:5000/seller/respond-booking/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchDashboardData();
  };

  const initiateAddLand = (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (user.accountType && user.accountType !== "seller" && user.role !== "admin") {
      setToast({ msg: "You need a verified Seller account to list properties. Go to Profile → Become a Seller to apply.", type: "warn" });
      return;
    }
    const fd = new FormData(e.target);
    fd.append("ownerId", user._id);
    setCachedAddFormData(fd); setShowAddPayment(true);
  };

  const completeAddLand = async () => {
    setShowAddPayment(false);
    const res = await fetch("http://localhost:5000/add-land", { method: "POST", body: cachedAddFormData });
    if ((await res.json()).success) { alert("Property Listed! Waiting for Admin Verification."); await fetchLands(); navigate("/"); }
  };

  return (
    <div className="app-root">
      {showAddPayment && (<DummyEsewaPayment amount={1000} description={"ProperEstate Platform Commission (Listing Fee)"} onSuccess={completeAddLand} onCancel={() => setShowAddPayment(false)} />)}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <SmartSuggestor />
      {user && <ChatApp user={user} initialOther={chatTarget} openRef={chatRef} />}

      <div className={"sidebar-overlay " + (sidebarOpen ? "open" : "")} onClick={() => setSidebarOpen(false)}></div>
      <div className={"sidebar " + (sidebarOpen ? "open" : "")}>
        <h2 className="sidebar-logo">ProperEstate</h2>
        <div className="sidebar-link" onClick={() => { navigate("/"); setSidebarOpen(false); }}>🏘 Home Explore</div>
        {user?.role === "admin" && <div className="sidebar-link admin-link" onClick={() => { navigate("/admin"); setSidebarOpen(false); }}>🛡 Admin Panel</div>}
        <div className="sidebar-link" onClick={() => { navigate("/profile"); setSidebarOpen(false); }}>👤 My Profile</div>
        <div className="sidebar-link" onClick={() => { navigate("/add-land"); setSidebarOpen(false); }}>＋ List Property</div>
        <div className="sidebar-link" onClick={() => { navigate("/rental-partner"); setSidebarOpen(false); }}>🤝 Rental Partner</div>
        <div className="sidebar-link" onClick={() => { navigate("/help"); setSidebarOpen(false); }}>❓ Help Center</div>
        {user && <div className="sidebar-link logout" onClick={handleLogout}>Logout</div>}
      </div>

      <header className="header">
        <div className="nav-bar">
          <div className="nav-left">
            <div onClick={() => setSidebarOpen(true)} className="menu-icon">&#9776;</div>
            <div className="logo" onClick={() => navigate("/")}>ProperEstate</div>
          </div>
          <SearchBar onSearch={handleGlobalSearch} />
          <div className="nav-right">
            {user && (
              <>
                <button className="nav-chat-btn" onClick={() => chatRef.current?.toggle()} title="Messages">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  {bookingCount > 0 && <span className="nav-requests-badge" style={{top:2,right:2}}>{bookingCount > 9 ? "9+" : bookingCount}</span>}
                </button>
                <button className="nav-requests-btn" onClick={() => navigate("/dashboard/requests")} title="Rental Requests">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {bookingCount > 0 && <span className="nav-requests-badge">{bookingCount}</span>}
                </button>
              </>
            )}
            {!user ? (
              <button className="btn-primary" onClick={() => navigate("/login")}>Login</button>
            ) : (
              <div className="user-menu" onMouseEnter={() => setShowDashMenu(true)} onMouseLeave={() => setShowDashMenu(false)}>
                <div className="nav-item">Dashboard</div>
                {showDashMenu && (
                  <div className="dropdown-menu">
                    <div onClick={() => navigate("/dashboard/listed")}>My Listed Assets</div>
                    <div onClick={() => navigate("/dashboard/saved")}>My Saved Wishlist</div>
                  </div>
                )}
                <img onClick={() => navigate("/profile")} src={user.avatar ? "http://localhost:5000/uploads/" + user.avatar : "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name) + "&background=1a3c34&color=fff"} className="nav-avatar" alt="avatar" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={
            <>
              <div className="hero">
                <h1>Brokers make you Broke</h1>
                <p className="hero-sub">Choose ProperEstate — Broker-free, directly from owner to renter.</p>
              </div>
              <div className="container">
                <FilterBar onFilter={applyFilters} refreshList={fetchLands} />
                <div className="lands-grid">
                  {filteredLands.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} />)}
                  {filteredLands.length === 0 && <p className="no-res">No properties match your filters.</p>}
                </div>
              </div>
            </>
          } />
          <Route path="/land/:id" element={<LandDetailsPage user={user} toggleSave={toggleSave} onChatWith={(owner) => { setChatTarget(owner); }} />} />
          <Route path="/edit-land/:id" element={<EditLandPage user={user} />} />
          <Route path="/login" element={
            <div className="auth-container"><h2>Login</h2>
              <form onSubmit={(e) => handleAuth(e, "login")}>
                <input name="email" placeholder="Email" /><input name="password" type="password" placeholder="Password" />
                <button className="btn-primary full-width">Sign In</button>
              </form>
              <p onClick={() => navigate("/signup")} className="auth-link">Create an account</p>
            </div>
          } />
          <Route path="/signup" element={<SignupPage setUser={setUser} />} />
          <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/rental-partner" element={user ? <RentalPartnerPage user={user} chatRef={chatRef} /> : <Navigate to="/login" />} />
          <Route path="/dashboard/listed" element={
            <div className="container"><h2 className="page-title">My Listed Assets</h2>
              <div className="lands-grid">
                {dashData.uploaded?.length > 0
                  ? dashData.uploaded.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} showActions={true} onDelete={async (id) => { if (window.confirm("Delete?")) { await fetch("http://localhost:5000/admin/delete-land/" + id, { method: "DELETE" }); fetchDashboardData(); } }} />)
                  : <p>No uploads yet.</p>}
              </div>
            </div>
          } />
          <Route path="/dashboard/saved" element={
            <div className="container"><h2 className="page-title">My Saved Wishlist</h2>
              <div className="lands-grid">
                {dashData.saved?.length > 0 ? dashData.saved.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} />) : <p>No saved lands.</p>}
              </div>
            </div>
          } />
          <Route path="/dashboard/requests" element={
            <div className="container"><h2 className="page-title">Rental Requests</h2>
              <div className="users-list">
                {dashData.bookings?.length > 0 ? dashData.bookings.map(b => (
                  <div key={b._id} className="user-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <p><strong>Property:</strong> {b.landId?.title}</p>
                    <p><strong>Renter:</strong> {b.buyerId?.name} | <strong>Email:</strong> {b.buyerId?.email}</p>
                    {b.rentDuration && <p><strong>Duration:</strong> {b.rentDuration}</p>}
                    <p><strong>Status:</strong> <span style={{ fontWeight: "bold", color: b.status === "pending" ? "orange" : b.status === "accepted" ? "green" : "red" }}>{b.status?.toUpperCase()}</span></p>
                    {b.status === "pending" && (
                      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                        <button className="btn-primary" onClick={() => respondToBooking(b._id, "accepted")}>Accept</button>
                        <button className="btn-danger-sm" onClick={() => respondToBooking(b._id, "rejected")}>Reject (Refund)</button>
                      </div>
                    )}
                  </div>
                )) : <p>No rental requests yet.</p>}
              </div>
            </div>
          } />
          <Route path="/admin" element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/add-land" element={
            !user ? <Navigate to="/login" /> :
            <div className="auth-container wide">
              <h2>List New Property for Rent</h2>
              <LandForm onSubmit={initiateAddLand} submitLabel="Submit Listing and Pay Rs.1000 Commission" />
            </div>
          } />
        </Routes>
      </main>

      <footer className="footer">
        <h2>PROPERESTATE</h2>
        <p>2026 Premium Rental Platform - Nepal - Broker Free</p>
      </footer>
    </div>
  );
}

export default function AppWrapper() { return <BrowserRouter><App /></BrowserRouter>; }

