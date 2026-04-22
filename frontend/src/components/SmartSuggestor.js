import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

const SUGGESTOR_STYLES = `
/* ===== RENT ADVISOR FAB — FIX 9 ===== */
.sug-fab {
  position: fixed;
  bottom: 24px; /* FIX 9 */
  right: 24px; /* FIX 9 */
  height: 40px; /* FIX 9 */
  padding: 0 16px; /* FIX 9 */
  border-radius: 20px; /* FIX 9 */
  background: #C8A96E; /* FIX 9 */
  color: #1A1A1A; /* FIX 9 */
  font-size: 13px; /* FIX 9 */
  font-weight: 500; /* FIX 9 */
  border: none;
  box-shadow: none; /* FIX 9 — Remove glow */
  cursor: pointer;
  z-index: 50; /* FIX 9 */
  display: flex;
  align-items: center;
  gap: 8px; /* FIX 9 */
  transition: all 0.2s;
  letter-spacing: 0;
}
.sug-fab:hover { 
  background: #D4B97A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(200, 169, 110, 0.3);
}
.sug-fab:active { transform: scale(0.97); }
.sug-fab svg {
  width: 16px; /* FIX 9 */
  height: 16px; /* FIX 9 */
}
.sug-window {
  position: fixed;
  bottom: 80px;
  right: 24px;
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
.sug-header::before { content: ""; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.05); border-radius: 50%; }
.sug-header-left { display: flex; align-items: center; gap: 10px; }
.sug-bot-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #c5a059, #a07830); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2); flex-shrink: 0; }
.sug-header-name { color: #fff; font-weight: 700; font-size: 0.95rem; }
.sug-header-sub { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.7); font-size: 0.72rem; margin-top: 1px; }
.sug-online-dot { width: 7px; height: 7px; background: #4caf50; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 2px rgba(76,175,80,0.3); animation: sugPulse 2s infinite; }
@keyframes sugPulse { 0%,100%{box-shadow:0 0 0 2px rgba(76,175,80,0.3);} 50%{box-shadow:0 0 0 5px rgba(76,175,80,0.1);} }
.sug-icon-btn { background: rgba(255,255,255,0.15); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.sug-icon-btn:hover { background: rgba(255,255,255,0.28); }
.sug-messages { flex: 1; overflow-y: auto; padding: 16px 14px 8px; display: flex; flex-direction: column; gap: 4px; background: #f8f9fa; scroll-behavior: smooth; }
.sug-messages::-webkit-scrollbar { width: 4px; }
.sug-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.sug-msg-row { display: flex; align-items: flex-end; gap: 7px; animation: sugMsgIn 0.22s ease; margin-bottom: 2px; }
@keyframes sugMsgIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.sug-msg-row.user { flex-direction: row-reverse; }
.sug-bot-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #1a3c34, #2d5a4e); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; margin-bottom: 2px; }
.sug-bubble { max-width: 78%; padding: 10px 14px; border-radius: 18px; font-size: 0.875rem; line-height: 1.5; word-break: break-word; position: relative; }
.sug-bubble.assistant { background: #fff; color: #111; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.sug-bubble.user { background: linear-gradient(135deg, #1a3c34, #2d5a4e); color: #fff; border-bottom-right-radius: 4px; }
.sug-bubble-text { white-space: pre-wrap; }
.sug-bubble-time { font-size: 0.62rem; opacity: 0.5; margin-top: 4px; text-align: right; }
.loading-bubble { display: flex; align-items: center; gap: 5px; padding: 12px 16px; min-width: 56px; }
.sug-dot { width: 7px; height: 7px; background: #bbb; border-radius: 50%; animation: sugBounce 1.2s infinite; display: inline-block; }
.sug-dot:nth-child(2) { animation-delay: 0.2s; }
.sug-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes sugBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
.sug-quick-actions { margin-top: 8px; }
.sug-quick-label { font-size: 0.72rem; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 4px; }
.sug-quick-grid { display: flex; flex-direction: column; gap: 6px; }
.sug-quick-btn { background: #fff; border: 1.5px solid #e8e8e8; border-radius: 12px; padding: 9px 14px; font-size: 0.82rem; color: #333; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; transition: all 0.18s; font-weight: 500; }
.sug-quick-btn:hover { background: #f0f7f5; border-color: #1a3c34; color: #1a3c34; transform: translateX(3px); }
.sug-input-area { padding: 10px 14px 14px; background: #fff; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
.sug-input-wrap { display: flex; align-items: center; background: #f4f4f4; border-radius: 26px; padding: 5px 5px 5px 16px; gap: 6px; transition: box-shadow 0.2s, background 0.2s; }
.sug-input-wrap:focus-within { box-shadow: 0 0 0 2px rgba(26,60,52,0.2); background: #fff; }
.sug-input { flex: 1; border: none; background: transparent; font-size: 0.88rem; outline: none; color: #111; padding: 6px 0; }
.sug-input::placeholder { color: #aaa; }
.sug-input:disabled { opacity: 0.6; }
.sug-send-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: #e0e0e0; color: #aaa; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
.sug-send-btn.ready { background: linear-gradient(135deg, #c5a059, #a07830); color: #fff; box-shadow: 0 2px 8px rgba(197,160,89,0.4); }
.sug-send-btn.ready:hover { transform: scale(1.1); }
.sug-send-btn:disabled { cursor: not-allowed; opacity: 0.6; }
.sug-footer-note { text-align: center; font-size: 0.65rem; color: #ccc; padding: 4px 0 2px; letter-spacing: 0.3px; }

/* ── Property cards inside chat ─────────────────────────────── */
.sug-prop-cards { display: flex; flex-direction: column; gap: 7px; margin-top: 8px; }
.sug-prop-label { font-size: 0.7rem; font-weight: 700; color: #1a3c34; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 2px; }
.sug-prop-card {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1.5px solid #e8e8e8;
  border-radius: 12px; padding: 8px 10px;
  cursor: pointer; transition: all 0.18s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.sug-prop-card:hover { border-color: #1a3c34; background: #f0f7f5; transform: translateX(2px); }
.sug-prop-img {
  width: 48px; height: 48px; border-radius: 8px;
  object-fit: cover; flex-shrink: 0;
  background: #eee;
}
.sug-prop-info { flex: 1; min-width: 0; }
.sug-prop-name { font-size: 0.8rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.sug-prop-loc { font-size: 0.7rem; color: #888; display: block; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sug-prop-price { font-size: 0.78rem; font-weight: 700; color: #1a3c34; display: block; margin-top: 3px; }
.sug-prop-badge { font-size: 0.62rem; background: #fff3cd; color: #856404; border-radius: 4px; padding: 1px 5px; margin-left: 4px; font-weight: 600; }
.sug-prop-arrow { color: #aaa; flex-shrink: 0; }

@media (max-width: 480px) {
  .sug-window { width: calc(100vw - 20px); right: 10px; bottom: 220px; height: 65vh; }
  .sug-fab { right: 10px; }
}
`;

const SmartSuggestor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef();
  const inputRef = useRef();
  const navigate = useNavigate();

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
      setMessages([{ role: "assistant", content: "Namaste! 🙏 I'm **RentBot**, your AI expert for Nepal real estate.\n\nI know everything about renting in Nepal — prices, locations, laws, and how to use ProperEstate. Ask me anything!", id: Date.now() }]);
    }
  }, [isOpen]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

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
      const res = await fetch(`${API_URL}/ai-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newHistory }) });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      const props = data.properties && data.properties.length > 0 ? data.properties : null;
      setMessages(prev => [...prev, { role: "assistant", content: reply, id: Date.now() + 1, properties: props }]);
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your internet and try again.", id: Date.now() + 1 }]);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMessages([{ role: "assistant", content: "Namaste! 🙏 I'm **RentBot**, your AI expert for Nepal real estate.\n\nI know everything about renting in Nepal — prices, locations, laws, and how to use ProperEstate. Ask me anything!", id: Date.now() }]);
    setHistory([]);
    setInput("");
  };

  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
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
          <div className="sug-header">
            <div className="sug-header-left">
              <div className="sug-bot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <div className="sug-header-name">RentBot AI</div>
                <div className="sug-header-sub"><span className="sug-online-dot"></span> Nepal Real Estate Expert</div>
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
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="sug-prop-cards">
                      <p className="sug-prop-label">📍 Live listings found:</p>
                      {msg.properties.map(p => (
                        <div key={p._id} className="sug-prop-card" onClick={() => { setIsOpen(false); navigate("/land/" + p._id); }}>
                          <img
                            src={p.image ? (p.image.startsWith("http") ? p.image : `${API_URL}/uploads/${p.image}`) : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=48"}
                            alt={p.title}
                            className="sug-prop-img"
                          />
                          <div className="sug-prop-info">
                            <span className="sug-prop-name">
                              {p.title}
                              {p.featured && <span className="sug-prop-badge">⭐ Featured</span>}
                            </span>
                            <span className="sug-prop-loc">{[p.city, p.district].filter(Boolean).join(", ") || p.location || "Nepal"}</span>
                            <span className="sug-prop-price">Rs. {parseInt(p.price || 0).toLocaleString()}/mo</span>
                          </div>
                          <svg className="sug-prop-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <span className="sug-dot"></span><span className="sug-dot"></span><span className="sug-dot"></span>
                </div>
              </div>
            )}
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

          <div className="sug-input-area">
            <div className="sug-input-wrap">
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder="Ask about Nepal rentals..." className="sug-input" disabled={loading} />
              <button className={"sug-send-btn " + (input.trim() && !loading ? "ready" : "")} onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
            <p className="sug-footer-note">Powered by AI · ProperEstate Nepal</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartSuggestor;
