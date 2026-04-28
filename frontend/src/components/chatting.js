import React, { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Avatar = ({ name, avatar, size = 38 }) => {
  const src = avatar
    ? `${API}/uploads/${avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=1a3c34&color=fff&bold=true&size=128`;
  return (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  );
};

export default function ChatApp({ user, initialOther = null, openRef = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeOther, setActiveOther] = useState(initialOther);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(!!initialOther);
  const [view, setView] = useState(initialOther ? "chat" : "list");
  const [sending, setSending] = useState(false);
  const [isOtherTyping] = useState(false); // future: real typing indicator
  const pollRef = useRef(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  // Expose open/toggle to parent via ref
  useEffect(() => {
    if (openRef) {
      openRef.current = {
        toggle: () => {
          setOpen(o => {
            if (!o) { setView("list"); fetchConversations(); }
            return !o;
          });
        },
        open: () => {
          setOpen(true);
          setView("list");
          fetchConversations();
        },
        getUnread: () => unread,
      };
    }
  });

  const fetchConversations = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/chat/conversations/${user._id}`);
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch {}
  }, [user]);

  const fetchUnread = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/chat/unread/${user._id}`);
      const data = await res.json();
      if (data.success) setUnread(data.count);
    } catch {}
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user?._id || !activeOther?._id) return;
    try {
      const res = await fetch(`${API}/chat/messages/${user._id}/${activeOther._id}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch {}
  }, [user, activeOther]);

  useEffect(() => {
    if (open && activeOther) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 2000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [open, activeOther, fetchMessages]);

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

  useEffect(() => {
    if (initialOther?._id) {
      setActiveOther(initialOther);
      setView("chat");
      setOpen(true);
    }
  }, [initialOther?._id]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && view === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, view]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeOther || sending) return;
    setSending(true);
    setInput("");
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      _id: tempId,
      senderId: user._id,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true
    }]);
    try {
      await fetch(`${API}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user._id, receiverId: activeOther._id, text })
      });
      await fetchMessages();
    } catch {}
    setSending(false);
  };

  const openChat = (other) => {
    setActiveOther(other);
    setView("chat");
    setMessages([]);
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (!user) return null;

  return (
    <>
      <style>{CHAT_STYLES}</style>

      {open && (
        <div className="cwindow">
          {/* Header */}
          <div className="cwin-header">
            {view === "chat" && activeOther ? (
              <div className="cwin-header-chat">
                <button className="cback-btn" onClick={() => { setView("list"); fetchConversations(); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="cwin-avatar-wrap">
                  <Avatar name={activeOther.name} avatar={activeOther.avatar} size={38} />
                  <span className="cwin-online-ring"></span>
                </div>
                <div className="cwin-header-info">
                  <span className="cwin-header-name">{activeOther.name}</span>
                  <span className="cwin-header-status">
                    {isOtherTyping ? <span className="cwin-typing-text">typing...</span> : <span>Active now</span>}
                  </span>
                </div>
              </div>
            ) : (
              <div className="cwin-header-list">
                <div className="cwin-header-logo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <span className="cwin-header-title">Messages</span>
              </div>
            )}
            <button className="cclose-btn" onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Conversation List */}
          {view === "list" && (
            <div className="cconvo-list">
              {conversations.length === 0 ? (
                <div className="cempty">
                  <div className="cempty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p className="cempty-title">No messages yet</p>
                  <p className="cempty-sub">Start a conversation from any property listing</p>
                </div>
              ) : (
                conversations.map((c, i) => (
                  <div key={i} className="cconvo-item" onClick={() => openChat(c.user)}>
                    <div className="cconvo-avatar-wrap">
                      <Avatar name={c.user?.name} avatar={c.user?.avatar} size={46} />
                      <span className="cconvo-online-dot"></span>
                    </div>
                    <div className="cconvo-info">
                      <div className="cconvo-top">
                        <span className="cconvo-name">{c.user?.name}</span>
                        <span className="cconvo-time">{c.lastMessage ? "now" : ""}</span>
                      </div>
                      <div className="cconvo-bottom">
                        <span className="cconvo-last">{c.lastMessage || "Start a conversation"}</span>
                        {c.unread > 0 && <span className="cunread-badge">{c.unread}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chat View */}
          {view === "chat" && (
            <>
              <div className="cmessages">
                <div className="cttl-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Messages disappear 1 min after being read
                </div>

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="cdate-divider"><span>{date}</span></div>
                    {msgs.map((m, i) => {
                      const isMine = m.senderId === user._id || m.senderId?.toString() === user._id;
                      const showAvatar = !isMine && (i === 0 || msgs[i - 1]?.senderId?.toString() !== m.senderId?.toString());
                      const isLast = i === msgs.length - 1 || msgs[i + 1]?.senderId?.toString() !== m.senderId?.toString();
                      return (
                        <div key={m._id || i} className={`cmsg-row ${isMine ? "mine" : "theirs"}`}>
                          {!isMine && (
                            <div className="cmsg-avatar-slot">
                              {showAvatar && <Avatar name={activeOther?.name} avatar={activeOther?.avatar} size={28} />}
                            </div>
                          )}
                          <div className={`cbubble-wrap ${isMine ? "mine" : "theirs"}`}>
                            <div className={`cbubble ${isMine ? "mine" : "theirs"} ${m.optimistic ? "sending" : ""} ${isLast ? "last" : ""}`}>
                              {m.text}
                            </div>
                            {isLast && (
                              <div className={`cmsg-meta ${isMine ? "mine" : "theirs"}`}>
                                <span className="cmsg-time">{formatTime(m.createdAt)}</span>
                                {isMine && (
                                  <span className="cmsg-status">
                                    {m.optimistic ? (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                                    ) : m.readAt ? (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12" transform="translate(4,0)"/></svg>
                                    ) : (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {isOtherTyping && (
                  <div className="cmsg-row theirs">
                    <div className="cmsg-avatar-slot">
                      <Avatar name={activeOther?.name} avatar={activeOther?.avatar} size={28} />
                    </div>
                    <div className="cbubble theirs typing-bubble">
                      <span className="ctyping-dot"></span>
                      <span className="ctyping-dot"></span>
                      <span className="ctyping-dot"></span>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <div className="cinput-area">
                <div className="cinput-wrap">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Message..."
                    className="cinput"
                    maxLength={1000}
                  />
                  <button
                    className={`csend-btn ${input.trim() ? "active" : ""}`}
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

const CHAT_STYLES = `
/* ===== CHAT FAB ===== */
.cfab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1a3c34, #2d5a4e);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(26,60,52,0.45);
  z-index: 1400;
  transition: transform 0.2s, box-shadow 0.2s;
}
.cfab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(26,60,52,0.55); }
.cfab-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background: #e53935;
  color: #fff;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #fff;
}

/* ===== CHAT WINDOW ===== */
.cwindow {
  position: fixed;
  top: 80px;
  right: 16px;
  width: 360px;
  height: 520px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1400;
  animation: cSlideDown 0.25s cubic-bezier(0.34,1.56,0.64,1);
  border: 1px solid rgba(0,0,0,0.06);
}
@keyframes cSlideDown {
  from { opacity: 0; transform: translateY(-16px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== HEADER ===== */
.cwin-header {
  background: linear-gradient(135deg, #1a3c34 0%, #2d5a4e 100%);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.cwin-header-chat { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.cwin-header-list { display: flex; align-items: center; gap: 10px; }
.cwin-header-logo {
  width: 34px; height: 34px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.cwin-header-title { color: #fff; font-weight: 700; font-size: 1rem; }
.cback-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}
.cback-btn:hover { background: rgba(255,255,255,0.25); }
.cwin-avatar-wrap { position: relative; flex-shrink: 0; }
.cwin-online-ring {
  position: absolute;
  bottom: 1px; right: 1px;
  width: 10px; height: 10px;
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid #1a3c34;
}
.cwin-header-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.cwin-header-name { color: #fff; font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cwin-header-status { color: rgba(255,255,255,0.7); font-size: 0.72rem; }
.cwin-typing-text { color: #a8e6a3; }
.cclose-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}
.cclose-btn:hover { background: rgba(255,255,255,0.25); }

/* ===== CONVERSATION LIST ===== */
.cconvo-list { flex: 1; overflow-y: auto; background: #fff; }
.cconvo-list::-webkit-scrollbar { width: 4px; }
.cconvo-list::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
.cconvo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}
.cconvo-item:hover { background: #f7f9f8; }
.cconvo-avatar-wrap { position: relative; flex-shrink: 0; }
.cconvo-online-dot {
  position: absolute;
  bottom: 1px; right: 1px;
  width: 10px; height: 10px;
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid #fff;
}
.cconvo-info { flex: 1; min-width: 0; }
.cconvo-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.cconvo-name { font-weight: 600; font-size: 0.9rem; color: #111; }
.cconvo-time { font-size: 0.72rem; color: #aaa; }
.cconvo-bottom { display: flex; justify-content: space-between; align-items: center; }
.cconvo-last { font-size: 0.8rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.cunread-badge {
  background: #1a3c34;
  color: #fff;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
}
.cempty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; padding: 40px 20px; text-align: center;
}
.cempty-icon { margin-bottom: 16px; opacity: 0.4; }
.cempty-title { font-weight: 600; color: #333; margin: 0 0 6px; }
.cempty-sub { font-size: 0.82rem; color: #aaa; margin: 0; }

/* ===== MESSAGES ===== */
.cmessages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f8f9fa;
}
.cmessages::-webkit-scrollbar { width: 4px; }
.cmessages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.cttl-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0,0,0,0.06);
  color: #888;
  font-size: 0.7rem;
  padding: 5px 12px;
  border-radius: 20px;
  margin: 0 auto 10px;
  width: fit-content;
}
.cdate-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 6px;
}
.cdate-divider::before, .cdate-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}
.cdate-divider span { font-size: 0.7rem; color: #aaa; white-space: nowrap; }

/* ===== MESSAGE ROWS ===== */
.cmsg-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-bottom: 2px;
  animation: cMsgIn 0.2s ease;
}
@keyframes cMsgIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cmsg-row.mine { flex-direction: row-reverse; }
.cmsg-avatar-slot { width: 28px; flex-shrink: 0; }
.cbubble-wrap { display: flex; flex-direction: column; max-width: 72%; }
.cbubble-wrap.mine { align-items: flex-end; }
.cbubble-wrap.theirs { align-items: flex-start; }
.cbubble {
  padding: 9px 13px;
  border-radius: 18px;
  font-size: 0.88rem;
  line-height: 1.45;
  word-break: break-word;
  position: relative;
  transition: opacity 0.2s;
}
.cbubble.mine {
  background: linear-gradient(135deg, #1a3c34, #2d5a4e);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.cbubble.mine.last { border-bottom-right-radius: 18px; }
.cbubble.theirs {
  background: #fff;
  color: #111;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.cbubble.theirs.last { border-bottom-left-radius: 18px; }
.cbubble.sending { opacity: 0.65; }
.cmsg-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  padding: 0 4px;
}
.cmsg-meta.mine { flex-direction: row-reverse; }
.cmsg-time { font-size: 0.65rem; color: #aaa; }
.cmsg-status { display: flex; align-items: center; color: #aaa; }

/* ===== TYPING BUBBLE ===== */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  min-width: 52px;
}
.ctyping-dot {
  width: 7px; height: 7px;
  background: #bbb;
  border-radius: 50%;
  animation: cTypeBounce 1.2s infinite;
}
.ctyping-dot:nth-child(2) { animation-delay: 0.2s; }
.ctyping-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes cTypeBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

/* ===== INPUT AREA ===== */
.cinput-area {
  padding: 10px 14px 14px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.cinput-wrap {
  display: flex;
  align-items: center;
  background: #f4f4f4;
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  gap: 6px;
  transition: box-shadow 0.2s;
}
.cinput-wrap:focus-within {
  box-shadow: 0 0 0 2px rgba(26,60,52,0.2);
  background: #fff;
}
.cinput {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  outline: none;
  color: #111;
  padding: 6px 0;
}
.cinput::placeholder { color: #aaa; }
.csend-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: #e0e0e0;
  color: #aaa;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.csend-btn.active {
  background: linear-gradient(135deg, #1a3c34, #2d5a4e);
  color: #fff;
}
.csend-btn.active:hover { transform: scale(1.08); }
.csend-btn:disabled { cursor: not-allowed; }

@media (max-width: 480px) {
  .cwindow { width: calc(100vw - 20px); right: 10px; top: 70px; height: 70vh; }
}
`;
