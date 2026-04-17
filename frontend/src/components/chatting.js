import React, { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:5000";

export default function ChatApp({ user, initialOther = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeOther, setActiveOther] = useState(initialOther); // { _id, name, avatar }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(!!initialOther);
  const [view, setView] = useState(initialOther ? "chat" : "list"); // list | chat
  const pollRef = useRef(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  const fetchConversations = useCallback(async () => {
    if (!user?._id) return;
    const res = await fetch(`${API}/chat/conversations/${user._id}`);
    const data = await res.json();
    if (data.success) setConversations(data.conversations);
  }, [user]);

  const fetchUnread = useCallback(async () => {
    if (!user?._id) return;
    const res = await fetch(`${API}/chat/unread/${user._id}`);
    const data = await res.json();
    if (data.success) setUnread(data.count);
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user?._id || !activeOther?._id) return;
    const res = await fetch(`${API}/chat/messages/${user._id}/${activeOther._id}`);
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  }, [user, activeOther]);

  // Poll messages every 2s when chat open
  useEffect(() => {
    if (open && activeOther) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 2000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [open, activeOther, fetchMessages]);

  // Poll unread count every 5s
  useEffect(() => {
    if (!user?._id) return;
    fetchUnread();
    const t = setInterval(fetchUnread, 5000);
    return () => clearInterval(t);
  }, [fetchUnread]);

  useEffect(() => {
    if (open && view === "list") fetchConversations();
  }, [open, view, fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If initialOther changes (e.g. from LandDetails "Chat with Owner")
  useEffect(() => {
    if (initialOther) {
      setActiveOther(initialOther);
      setView("chat");
      setOpen(true);
    }
  }, [initialOther?._id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeOther) return;
    setInput("");
    // Optimistic
    setMessages(prev => [...prev, {
      _id: Date.now(),
      senderId: user._id,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true
    }]);
    await fetch(`${API}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: user._id, receiverId: activeOther._id, text })
    });
    fetchMessages();
  };

  const openChat = (other) => {
    setActiveOther(other);
    setView("chat");
    setMessages([]);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button className="chat-fab" onClick={() => { setOpen(!open); if (!open) { setView("list"); fetchConversations(); } }}>
        💬
        {unread > 0 && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {open && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-win-header">
            {view === "chat" && activeOther ? (
              <>
                <button className="chat-back-btn" onClick={() => { setView("list"); fetchConversations(); }}>←</button>
                <img className="chat-avatar-sm"
                  src={activeOther.avatar ? `${API}/uploads/${activeOther.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activeOther.name)}&background=1a3c34&color=fff`}
                  alt="" />
                <div className="chat-win-name">
                  <span>{activeOther.name}</span>
                  <span className="chat-online-dot">● Online</span>
                </div>
              </>
            ) : (
              <span style={{ fontWeight: 700 }}>💬 Messages</span>
            )}
            <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Conversation List */}
          {view === "list" && (
            <div className="chat-convo-list">
              {conversations.length === 0 && (
                <div className="chat-empty">
                  <p>No conversations yet.</p>
                  <p style={{ fontSize: "0.8rem", color: "#aaa" }}>Start chatting from a property listing.</p>
                </div>
              )}
              {conversations.map((c, i) => (
                <div key={i} className="chat-convo-item" onClick={() => openChat(c.user)}>
                  <img className="chat-avatar-sm"
                    src={c.user?.avatar ? `${API}/uploads/${c.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || "U")}&background=1a3c34&color=fff`}
                    alt="" />
                  <div className="chat-convo-info">
                    <span className="chat-convo-name">{c.user?.name}</span>
                    <span className="chat-convo-last">{c.lastMessage}</span>
                  </div>
                  {c.unread > 0 && <span className="chat-unread-badge">{c.unread}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          {view === "chat" && (
            <>
              <div className="chat-messages">
                <div className="chat-ttl-notice">💡 Messages disappear 1 min after being read</div>
                {messages.map((m, i) => {
                  const isMine = m.senderId === user._id || m.senderId?._id === user._id || m.senderId?.toString() === user._id;
                  return (
                    <div key={m._id || i} className={`chat-msg-row ${isMine ? "mine" : "theirs"}`}>
                      {!isMine && (
                        <img className="chat-msg-avatar"
                          src={activeOther?.avatar ? `${API}/uploads/${activeOther.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activeOther?.name || "U")}&background=1a3c34&color=fff`}
                          alt="" />
                      )}
                      <div className={`chat-bubble ${isMine ? "mine" : "theirs"} ${m.optimistic ? "optimistic" : ""}`}>
                        <span>{m.text}</span>
                        <span className="chat-msg-time">{formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="chat-input-row">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="chat-input"
                />
                <button className="chat-send-btn" onClick={sendMessage}>➤</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
