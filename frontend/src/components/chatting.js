import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Avatar = ({ name, avatar, size = 36 }) => {
  const src = avatar
    ? `${API}/uploads/${avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=1a2744&color=00d4ff&bold=true&size=128`;
  return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
};

// Countdown timer for 1-minute delete rule
const DeleteCountdown = ({ deleteAt }) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(deleteAt) - Date.now()) / 1000));
      setSecs(remaining);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deleteAt]);
  if (!deleteAt || secs <= 0) return null;
  return (
    <span className="cw-delete-timer" title="Message deletes after 1 minute of being read">
      🕐 {secs}s
    </span>
  );
};

// ─── Notifications Panel ──────────────────────────────────────────────────────
export function NotificationsPanel({ user, bookingCount, dashData, respondToBooking, onClose }) {
  const bookings = (dashData?.bookings || []).filter(b => b.status === "pending");
  return (
    <div className="npanel">
      <div className="npanel-header">
        <span className="npanel-title">Notifications</span>
        {bookingCount > 0 && <span className="npanel-badge">{bookingCount}</span>}
        <button className="npanel-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="npanel-body">
        {bookings.length === 0 ? (
          <div className="npanel-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p>No pending requests</p>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b._id} className="npanel-item">
              <div className="npanel-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </div>
              <div className="npanel-item-body">
                <p className="npanel-item-title">{b.buyerId?.name || "Someone"} wants to rent</p>
                <p className="npanel-item-sub">{b.landId?.title} · {b.rentDuration}</p>
                <p className="npanel-item-price">Rs. {parseInt(b.paymentAmount || 0).toLocaleString()}</p>
              </div>
              <div className="npanel-item-actions">
                <button className="npanel-accept" onClick={() => respondToBooking(b._id, "accepted")}>Accept</button>
                <button className="npanel-reject" onClick={() => respondToBooking(b._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Chat App ─────────────────────────────────────────────────────────────────
export default function ChatApp({ user, initialOther = null, openRef = null, onUnreadChange = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeOther, setActiveOther] = useState(initialOther);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(!!initialOther);
  const [view, setView] = useState(initialOther ? "chat" : "list");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const pollRef = useRef(null);
  const bottomRef = useRef();
  const inputRef = useRef();
  const fileRef = useRef();

  useEffect(() => {
    if (openRef) {
      openRef.current = {
        toggle: () => setOpen(o => { if (!o) { setView("list"); fetchConversations(); } return !o; }),
        open: () => { setOpen(true); setView("list"); fetchConversations(); },
        openWith: (other) => { setActiveOther(other); setView("chat"); setMessages([]); setOpen(true); },
      };
    }
  });

  useEffect(() => { if (onUnreadChange) onUnreadChange(unread); }, [unread, onUnreadChange]);

  const fetchConversations = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/chat/conversations/${user._id}`);
      const data = await res.json();
      if (data.success) {
        // Backend returns partnerName/partnerAvatar — normalize to {user: {name, avatar, _id}}
        const normalized = data.conversations.map(c => ({
          user: {
            _id: c.partnerId || c._id,
            name: c.partnerName || c.user?.name || "Unknown",
            avatar: c.partnerAvatar || c.user?.avatar || null,
          },
          lastMessage: c.lastMessage || "",
          unread: c.unreadCount || c.unread || 0,
        }));
        setConversations(normalized);
      }
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
    if (open && activeOther) { fetchMessages(); pollRef.current = setInterval(fetchMessages, 2000); }
    else clearInterval(pollRef.current);
    return () => clearInterval(pollRef.current);
  }, [open, activeOther, fetchMessages]);

  useEffect(() => {
    if (!user?._id) return;
    fetchUnread();
    const t = setInterval(fetchUnread, 5000);
    return () => clearInterval(t);
  }, [fetchUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (open && view === "list") fetchConversations(); }, [open, view, fetchConversations]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (initialOther?._id) { setActiveOther(initialOther); setView("chat"); setOpen(true); } }, [initialOther?._id]); // eslint-disable-line
  useEffect(() => { if (open && view === "chat") setTimeout(() => inputRef.current?.focus(), 100); }, [open, view]);

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !imageFile) || !activeOther || sending) return;
    setSending(true);
    setInput("");
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { _id: tempId, senderId: user._id, text, image: imagePreview ? "preview" : null, createdAt: new Date().toISOString(), optimistic: true }]);
    setImagePreview(null);
    try {
      const fd = new FormData();
      fd.append("senderId", user._id);
      fd.append("receiverId", activeOther._id);
      if (text) fd.append("text", text);
      if (imageFile) fd.append("image", imageFile);
      setImageFile(null);
      await fetch(`${API}/chat/send`, { method: "POST", body: fd });
      await fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openChat = (other) => { setActiveOther(other); setView("chat"); setMessages([]); };
  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso) => {
    const d = new Date(iso), t = new Date(), y = new Date(t); y.setDate(y.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const grouped = messages.reduce((g, m) => {
    const k = fmtDate(m.createdAt);
    if (!g[k]) g[k] = [];
    g[k].push(m);
    return g;
  }, {});

  if (!user) return null;

  return (
    <>
      <style>{STYLES}</style>
      {open && (
        <div className="cw">
          {/* Header */}
          <div className="cw-head">
            {view === "chat" && activeOther ? (
              <div className="cw-head-inner">
                <button className="cw-back" onClick={() => { setView("list"); fetchConversations(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div style={{ position: "relative" }}>
                  <Avatar name={activeOther.name} avatar={activeOther.avatar} size={34} />
                  <span className="cw-online" />
                </div>
                <div className="cw-head-info">
                  <span className="cw-head-name">{activeOther.name}</span>
                  <span className="cw-head-status">Active now</span>
                </div>
              </div>
            ) : (
              <div className="cw-head-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="cw-head-title">Messages</span>
                {unread > 0 && <span className="cw-head-badge">{unread}</span>}
              </div>
            )}
            <button className="cw-close" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Conversation list */}
          {view === "list" && (
            <div className="cw-list">
              {conversations.length === 0 ? (
                <div className="cw-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <p>No conversations yet</p>
                  <span>Start from a property listing</span>
                </div>
              ) : conversations.map((c, i) => (
                <div key={i} className="cw-convo" onClick={() => openChat(c.user)}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={c.user?.name} avatar={c.user?.avatar} size={44} />
                    <span className="cw-convo-dot" />
                  </div>
                  <div className="cw-convo-info">
                    <div className="cw-convo-row">
                      <span className="cw-convo-name">{c.user?.name}</span>
                      <span className="cw-convo-time">{c.lastMessage ? "now" : ""}</span>
                    </div>
                    <div className="cw-convo-row">
                      <span className="cw-convo-last">{c.lastMessage || "Say hello"}</span>
                      {c.unread > 0 && <span className="cw-unread">{c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat view */}
          {view === "chat" && (
            <>
              <div className="cw-msgs">
                {Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="cw-date"><span>{date}</span></div>
                    {msgs.map((m, i) => {
                      const mine = m.senderId === user._id || m.senderId?.toString() === user._id?.toString();
                      const last = i === msgs.length - 1 || msgs[i + 1]?.senderId?.toString() !== m.senderId?.toString();
                      const showAv = !mine && (i === 0 || msgs[i - 1]?.senderId?.toString() !== m.senderId?.toString());
                      return (
                        <div key={m._id || i} className={`cw-row ${mine ? "mine" : "theirs"}`}>
                          {!mine && <div className="cw-av-slot">{showAv && <Avatar name={activeOther?.name} avatar={activeOther?.avatar} size={26} />}</div>}
                          <div className={`cw-bwrap ${mine ? "mine" : "theirs"}`}>
                            {m.image && m.image !== "preview" && (
                              <img src={`${API}/uploads/${m.image}`} alt="attachment" className={`cw-img-msg ${mine ? "mine" : "theirs"}`} />
                            )}
                            {m.image === "preview" && imagePreview && (
                              <img src={imagePreview} alt="sending" className={`cw-img-msg ${mine ? "mine" : "theirs"}`} style={{ opacity: 0.6 }} />
                            )}
                            {m.text && (
                              <div className={`cw-bubble ${mine ? "mine" : "theirs"} ${m.optimistic ? "sending" : ""} ${last ? "last" : ""}`}>
                                {m.text}
                              </div>
                            )}
                            {last && (
                              <div className={`cw-meta ${mine ? "mine" : ""}`}>
                                <span className="cw-time">{fmt(m.createdAt)}</span>
                                {/* 1-min delete countdown — shown on received messages that have deleteAt */}
                                {!mine && m.deleteAt && <DeleteCountdown deleteAt={m.deleteAt} />}
                                {mine && !m.optimistic && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={m.read ? "#4fc3f7" : "currentColor"} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Image preview bar */}
              {imagePreview && (
                <div className="cw-img-preview">
                  <img src={imagePreview} alt="preview" />
                  <button onClick={() => { setImagePreview(null); setImageFile(null); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="cw-input-area">
                <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
                <button className="cw-attach" onClick={() => fileRef.current?.click()} title="Attach image">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <input
                  ref={inputRef}
                  className="cw-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Message..."
                  maxLength={1000}
                />
                <button className={`cw-send ${(input.trim() || imageFile) ? "active" : ""}`} onClick={sendMessage} disabled={(!input.trim() && !imageFile) || sending}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

const STYLES = `
/* ── Chat Window ─────────────────────────────── */
.cw {
  position: fixed;
  top: 72px;
  right: 16px;
  width: 348px;
  height: 520px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1400;
  animation: cwIn 0.2s cubic-bezier(0.16,1,0.3,1);
}
@keyframes cwIn { from { opacity:0; transform:translateY(-10px) scale(0.97); } to { opacity:1; transform:none; } }

/* ── Header ──────────────────────────────────── */
.cw-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  flex-shrink: 0;
}
.cw-head-inner { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.cw-head-title { font-weight: 600; font-size: 15px; color: var(--text-primary); }
.cw-head-badge {
  background: #e53935; color: #fff;
  font-size: 10px; font-weight: 700;
  min-width: 18px; height: 18px;
  border-radius: 999px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
}
.cw-head-name { font-weight: 600; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw-head-status { font-size: 11px; color: #4caf50; }
.cw-head-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.cw-online {
  position: absolute; bottom: 1px; right: 1px;
  width: 9px; height: 9px; background: #4caf50;
  border-radius: 50%; border: 2px solid var(--bg-card);
}
.cw-back, .cw-close {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  background: transparent; border: none;
  color: var(--text-muted); cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.cw-back:hover, .cw-close:hover { background: var(--bg-secondary); color: var(--text-primary); }

/* ── Conversation List ───────────────────────── */
.cw-list { flex: 1; overflow-y: auto; }
.cw-list::-webkit-scrollbar { width: 3px; }
.cw-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.cw-convo {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.cw-convo:hover { background: var(--bg-secondary); }
.cw-convo-dot {
  position: absolute; bottom: 1px; right: 1px;
  width: 9px; height: 9px; background: #4caf50;
  border-radius: 50%; border: 2px solid var(--bg-card);
}
.cw-convo-info { flex: 1; min-width: 0; }
.cw-convo-row { display: flex; justify-content: space-between; align-items: center; }
.cw-convo-name { font-weight: 600; font-size: 13px; color: var(--text-primary); }
.cw-convo-time { font-size: 11px; color: var(--text-muted); }
.cw-convo-last { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; margin-top: 2px; }
.cw-unread {
  background: var(--accent); color: #1a1a1a;
  font-size: 10px; font-weight: 700;
  min-width: 17px; height: 17px; border-radius: 999px;
  padding: 0 4px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cw-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 10px; color: var(--text-muted); padding: 40px 20px; text-align: center;
}
.cw-empty p { font-weight: 500; font-size: 14px; color: var(--text-secondary); margin: 0; }
.cw-empty span { font-size: 12px; color: var(--text-muted); }

/* ── Messages ────────────────────────────────── */
.cw-msgs {
  flex: 1; overflow-y: auto;
  padding: 12px 12px 8px;
  display: flex; flex-direction: column; gap: 2px;
  background: var(--bg-secondary);
}
.cw-msgs::-webkit-scrollbar { width: 3px; }
.cw-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.cw-date {
  display: flex; align-items: center; gap: 8px;
  margin: 8px 0 4px; font-size: 11px; color: var(--text-muted);
}
.cw-date::before, .cw-date::after { content: ""; flex: 1; height: 1px; background: var(--border); }
.cw-row { display: flex; align-items: flex-end; gap: 6px; margin-bottom: 1px; }
.cw-row.mine { flex-direction: row-reverse; }
.cw-av-slot { width: 26px; flex-shrink: 0; }
.cw-bwrap { display: flex; flex-direction: column; max-width: 74%; }
.cw-bwrap.mine { align-items: flex-end; }
.cw-bwrap.theirs { align-items: flex-start; }
.cw-bubble {
  padding: 8px 12px; border-radius: 16px;
  font-size: 13px; line-height: 1.45; word-break: break-word;
}
.cw-bubble.mine {
  background: var(--accent); color: #1a1a1a;
  border-bottom-right-radius: 4px;
}
.cw-bubble.mine.last { border-bottom-right-radius: 16px; }
.cw-bubble.theirs {
  background: var(--bg-card); color: var(--text-primary);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
}
.cw-bubble.theirs.last { border-bottom-left-radius: 16px; }
.cw-bubble.sending { opacity: 0.55; }
.cw-img-msg {
  max-width: 200px; max-height: 160px;
  border-radius: 12px; object-fit: cover;
  margin-bottom: 2px; display: block;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.cw-img-msg.mine { border-bottom-right-radius: 4px; }
.cw-img-msg.theirs { border-bottom-left-radius: 4px; }
.cw-meta { display: flex; align-items: center; gap: 3px; margin-top: 3px; padding: 0 3px; }
.cw-meta.mine { flex-direction: row-reverse; }
.cw-time { font-size: 10px; color: var(--text-muted); }
.cw-delete-timer {
  font-size: 9px;
  color: rgba(255, 100, 100, 0.7);
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-left: 2px;
}

/* ── Image preview ───────────────────────────── */
.cw-img-preview {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; background: var(--bg-card);
  border-top: 1px solid var(--border); flex-shrink: 0;
}
.cw-img-preview img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
.cw-img-preview button {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--bg-secondary); border: none;
  color: var(--text-muted); cursor: pointer;
}
.cw-img-preview button:hover { background: var(--border); color: var(--text-primary); }

/* ── Input ───────────────────────────────────── */
.cw-input-area {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px 12px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.cw-attach {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: transparent; border: none;
  color: var(--text-muted); cursor: pointer;
  transition: background 0.15s, color 0.15s; flex-shrink: 0;
}
.cw-attach:hover { background: var(--bg-secondary); color: var(--accent); }
.cw-input {
  flex: 1; border: 1.5px solid var(--border);
  border-radius: 20px; padding: 7px 14px;
  font-size: 13px; background: var(--bg-secondary);
  color: var(--text-primary); outline: none;
  transition: border-color 0.15s;
}
.cw-input:focus { border-color: var(--accent); background: var(--bg-card); }
.cw-input::placeholder { color: var(--text-muted); }
.cw-send {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 50%;
  border: none; background: var(--border);
  color: var(--text-muted); cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.cw-send.active { background: var(--accent); color: #1a1a1a; }
.cw-send.active:hover { transform: scale(1.08); }
.cw-send:disabled { cursor: not-allowed; }

/* ── Notifications Panel ─────────────────────── */
.npanel {
  position: fixed;
  top: 72px;
  right: 16px;
  width: 340px;
  max-height: 480px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1400;
  animation: cwIn 0.2s cubic-bezier(0.16,1,0.3,1);
}
.npanel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.npanel-title { font-weight: 600; font-size: 15px; color: var(--text-primary); flex: 1; }
.npanel-badge {
  background: #e53935; color: #fff;
  font-size: 10px; font-weight: 700;
  min-width: 18px; height: 18px; border-radius: 999px;
  padding: 0 4px; display: flex; align-items: center; justify-content: center;
}
.npanel-close {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  background: transparent; border: none;
  color: var(--text-muted); cursor: pointer;
  transition: background 0.15s;
}
.npanel-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
.npanel-body { flex: 1; overflow-y: auto; }
.npanel-body::-webkit-scrollbar { width: 3px; }
.npanel-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.npanel-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 20px; gap: 10px; color: var(--text-muted);
}
.npanel-empty p { font-size: 13px; color: var(--text-secondary); margin: 0; }
.npanel-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px; border-bottom: 1px solid var(--border);
}
.npanel-item-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(200,169,110,0.12); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.npanel-item-body { flex: 1; min-width: 0; }
.npanel-item-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0 0 2px; }
.npanel-item-sub { font-size: 11px; color: var(--text-muted); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.npanel-item-price { font-size: 12px; font-weight: 600; color: var(--accent); margin: 0; }
.npanel-item-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
.npanel-accept, .npanel-reject {
  height: 26px; padding: 0 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600; cursor: pointer;
  border: none; transition: opacity 0.15s;
}
.npanel-accept { background: #4caf50; color: #fff; }
.npanel-reject { background: rgba(229,57,53,0.12); color: #e53935; border: 1px solid rgba(229,57,53,0.25); }
.npanel-accept:hover, .npanel-reject:hover { opacity: 0.85; }

@media (max-width: 480px) {
  .cw, .npanel { width: calc(100vw - 20px); right: 10px; top: 66px; }
  .cw { height: 72vh; }
}
`;
