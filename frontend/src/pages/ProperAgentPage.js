import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import "../ChatbotPage.css";

/* ── Animated 3D Robot SVG ─────────────────────────────────── */
const RobotSVG = () => (
  <svg
    className="pa-robot"
    width="160"
    height="180"
    viewBox="0 0 160 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Antenna */}
    <line x1="80" y1="18" x2="80" y2="36" stroke="#667eea" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="80" cy="12" r="6" fill="#a855f7">
      <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
    </circle>

    {/* Head */}
    <rect x="42" y="36" width="76" height="58" rx="16" fill="url(#headGrad)" />
    <rect x="42" y="36" width="76" height="58" rx="16" fill="none" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.5"/>

    {/* Eyes */}
    <rect className="robot-eye" x="54" y="52" width="20" height="14" rx="5" fill="#667eea">
      <animate attributeName="fill" values="#667eea;#a855f7;#667eea" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect className="robot-eye" x="86" y="52" width="20" height="14" rx="5" fill="#667eea">
      <animate attributeName="fill" values="#667eea;#a855f7;#667eea" dur="3s" repeatCount="indefinite"/>
    </rect>
    {/* Eye shine */}
    <rect x="57" y="54" width="6" height="4" rx="2" fill="white" opacity="0.7"/>
    <rect x="89" y="54" width="6" height="4" rx="2" fill="white" opacity="0.7"/>

    {/* Mouth — happy arc */}
    <path d="M62 80 Q80 92 98 80" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>

    {/* Ear ports */}
    <rect x="33" y="52" width="9" height="18" rx="4" fill="#8b5cf6" opacity="0.7"/>
    <rect x="118" y="52" width="9" height="18" rx="4" fill="#8b5cf6" opacity="0.7"/>

    {/* Neck */}
    <rect x="70" y="94" width="20" height="10" rx="4" fill="#7c3aed" opacity="0.6"/>

    {/* Body */}
    <rect x="36" y="104" width="88" height="60" rx="18" fill="url(#bodyGrad)"/>
    <rect x="36" y="104" width="88" height="60" rx="18" fill="none" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.4"/>

    {/* Chest panel */}
    <rect x="56" y="116" width="48" height="30" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>

    {/* Chest lights */}
    <circle cx="68" cy="127" r="4" fill="#52d475">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="80" cy="127" r="4" fill="#f59e0b">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="92" cy="127" r="4" fill="#ef4444">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" begin="1s" repeatCount="indefinite"/>
    </circle>

    {/* Left arm (static) */}
    <rect x="14" y="104" width="20" height="48" rx="10" fill="url(#armGrad)"/>
    <circle cx="24" cy="156" r="9" fill="#7c3aed" opacity="0.8"/>

    {/* Right arm (waving) */}
    <g className="robot-arm-right" style={{transformOrigin: "126px 110px"}}>
      <rect x="126" y="104" width="20" height="48" rx="10" fill="url(#armGrad)"/>
      <circle cx="136" cy="156" r="9" fill="#7c3aed" opacity="0.8"/>
    </g>

    {/* Legs */}
    <rect x="52" y="162" width="22" height="16" rx="8" fill="#6d28d9" opacity="0.8"/>
    <rect x="86" y="162" width="22" height="16" rx="8" fill="#6d28d9" opacity="0.8"/>

    {/* Feet */}
    <ellipse cx="63" cy="177" rx="14" ry="6" fill="#5b21b6"/>
    <ellipse cx="97" cy="177" rx="14" ry="6" fill="#5b21b6"/>

    {/* Gradient defs */}
    <defs>
      <linearGradient id="headGrad" x1="42" y1="36" x2="118" y2="94" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8"/>
        <stop offset="100%" stopColor="#6d28d9"/>
      </linearGradient>
      <linearGradient id="bodyGrad" x1="36" y1="104" x2="124" y2="164" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7c3aed"/>
        <stop offset="100%" stopColor="#4c1d95"/>
      </linearGradient>
      <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
        <stop offset="0%" stopColor="#818cf8"/>
        <stop offset="100%" stopColor="#6d28d9"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ── Component ─────────────────────────────────────────────── */
const ProperAgentPage = ({ user }) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);
  const [suggestedProps, setSuggestedProps] = useState([]); // eslint-disable-line no-unused-vars
  const bottomRef = useRef();
  const inputRef  = useRef();
  const navigate  = useNavigate();

  const QUICK = [
    { icon: "🏠", label: "Find a flat in Kathmandu under Rs.20,000" },
    { icon: "🌿", label: "Agricultural land in Chitwan" },
    { icon: "💰", label: "What's the rent in Pokhara?" },
    { icon: "🏢", label: "Office space in Lalitpur" },
    { icon: "📋", label: "How do I list my property?" },
    { icon: "🤖", label: "What can you help me with?" },
  ];

  const WELCOME_MSG = "Namaste! 👋 I'm **ProperAgent**, your AI-powered Nepal real estate assistant.\n\nI can help you find properties, compare rental prices across cities, explain Nepal's rental laws, and answer pretty much anything you'd like to know!\n\nWhat's on your mind?";

  useEffect(() => {
    setMessages([{ role: "assistant", content: WELCOME_MSG, id: Date.now() }]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg    = { role: "user", content: msg, id: Date.now() };
    const newHistory = [...history, { role: "user", content: msg }];
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setHistory(newHistory);

    try {
      const res  = await fetch(`${API_URL}/ai-advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend now handles DB search internally — no need to pass liveProperties from frontend
        body: JSON.stringify({ messages: newHistory }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't generate a response. Please try again.";
      // Properties are now returned directly from the backend response
      const props = data.properties && data.properties.length > 0 ? data.properties : null;
      setSuggestedProps(props || []);
      setMessages(prev => [...prev, { role: "assistant", content: reply, id: Date.now() + 1, properties: props }]);
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection error. Please check your network and try again.", id: Date.now() + 1 }]);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMessages([{ role: "assistant", content: WELCOME_MSG, id: Date.now() }]);
    setHistory([]);
    setSuggestedProps([]);
    setInput("");
  };

  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
    });
  };

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isWelcome = messages.length === 1;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="pa-page">
      {/* ── Sidebar ── */}
      <aside className="pa-sidebar">
        <div className="pa-sidebar-top">
          <div className="pa-brand">
            <div className="pa-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="pa-brand-text">
              <h2>ProperAgent</h2>
              <span>AI Real Estate Assistant</span>
            </div>
          </div>
          <button className="pa-new-btn" onClick={handleReset}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Chat
          </button>
        </div>

        <div className="pa-quick-list">
          <span className="pa-section-label">Suggestions</span>
          {QUICK.map((q, i) => (
            <button key={i} className="pa-quick-btn" onClick={() => sendMessage(q.label)}>
              <span className="qi">{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        <div className="pa-sidebar-foot">
          <div className="pa-foot-info">
            <div className="pa-foot-dot"/>
            <span>Powered by Groq · Live DB · Nepal 2025</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="pa-main">
        {/* Header */}
        <div className="pa-header">
          <div className="pa-header-left">
            <div className="pa-header-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div className="pa-header-name">ProperAgent AI</div>
              <div className="pa-header-status">Online — Ready to help</div>
            </div>
          </div>
          <button
            onClick={handleReset}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#8892b0", padding:"6px", borderRadius:"8px", display:"flex", alignItems:"center" }}
            title="Clear chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.15"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="pa-messages">
          {isWelcome ? (
            /* ── Welcome / Robot Screen ── */
            <div className="pa-welcome">
              <div className="pa-robot-wrap">
                <RobotSVG />
                <div className="pa-robot-shadow" />
              </div>

              <div>
                <h1 className="pa-welcome-title">
                  Hey there! I'm <span>ProperAgent</span>
                </h1>
                <p className="pa-welcome-sub">
                  Your AI assistant for Nepal real estate. Ask me anything — property prices, listings, laws, or just chat!
                </p>
              </div>

              <div className="pa-card-grid">
                {QUICK.map((a, i) => (
                  <button key={i} className="pa-welcome-card" onClick={() => sendMessage(a.label)}>
                    <span className="wc-icon">{a.icon}</span>
                    <span className="wc-text">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Chat messages ── */
            <>
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`pa-msg-row ${msg.role}`}>
                  <div className="pa-msg-inner">
                    <div className={`pa-avatar ${msg.role === "assistant" ? "bot" : "user-av"}`}>
                      {msg.role === "assistant"
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        : userInitial}
                    </div>
                    <div className="pa-msg-body">
                      <div className="pa-bubble">
                        {renderContent(msg.content)}
                      </div>
                      {msg.properties && msg.properties.length > 0 && (
                        <div className="pa-prop-cards">
                          <p className="pa-prop-label">📍 Live listings found:</p>
                          {msg.properties.map(p => (
                            <div key={p._id} className="pa-prop-card" onClick={() => navigate("/land/" + p._id)}>
                              <img src={p.image ? (p.image.startsWith("http") ? p.image : `${API_URL}/uploads/${p.image}`) : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=56"} alt={p.title} className="pa-prop-img"/>
                              <div className="pa-prop-info">
                                <span className="pa-prop-name">{p.title}</span>
                                <span className="pa-prop-loc">{[p.city, p.district].filter(Boolean).join(", ") || p.location}</span>
                                <span className="pa-prop-price">Rs. {parseInt(p.price).toLocaleString()}/mo</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pa-bubble-time">{formatTime()}</div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="pa-msg-row assistant">
                  <div className="pa-msg-inner">
                    <div className="pa-avatar bot">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div className="pa-msg-body">
                      <div className="pa-typing">
                        <div className="pa-typing-dot"/><div className="pa-typing-dot"/><div className="pa-typing-dot"/>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pa-input-zone">
          <div className="pa-input-box">
            <input
              ref={inputRef}
              className="pa-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask me anything about Nepal real estate..."
              disabled={loading}
            />
            <button
              className="pa-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <p className="pa-input-note">ProperAgent · AI-powered · Nepal Real Estate 2025</p>
        </div>
      </main>
    </div>
  );
};

export default ProperAgentPage;
