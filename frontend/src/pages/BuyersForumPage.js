import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import "../BuyersForumPage.css";

/* ── helpers ─────────────────────────────────────────────── */
const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  if (s < 604800) return Math.floor(s / 86400) + "d";
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
};

const Avatar = ({ name, avatar, size = 40 }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (avatar) {
    return <img src={`${API_URL}/uploads/${avatar}`} alt={name} className="bf-avatar" style={{ width: size, height: size }} />;
  }
  return (
    <div className="bf-avatar bf-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
};

/* ── icons (inline SVGs) ─────────────────────────────────── */
const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);
const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
);
const MessageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const PROPERTY_TAGS = [
  { label: "Land", icon: "🌿" },
  { label: "House", icon: "🏠" },
  { label: "Room", icon: "🚪" },
  { label: "Commercial", icon: "🏢" },
  { label: "Apartment", icon: "🏬" },
];

/* ════════════════════════════════════════════════════════════
   COMPOSE BOX
   ════════════════════════════════════════════════════════════ */
const ComposeBox = ({ user, onPost }) => {
  const [text, setText] = useState("");
  const [desc, setDesc] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();
  const textRef = useRef();

  const handleMediaPick = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setMediaFiles(prev => [...prev, ...files].slice(0, 4));
    setMediaPreviews(prev => [...prev, ...files.map(f => ({ url: URL.createObjectURL(f), type: f.type }))].slice(0, 4));
    setExpanded(true);
  };

  const removeMedia = (i) => {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    const fd = new FormData();
    fd.append("title", text.trim());
    fd.append("description", desc.trim());
    fd.append("userId", user._id);
    fd.append("userName", user.name);
    if (user.avatar) fd.append("userAvatar", user.avatar);
    fd.append("postType", "forum");
    if (selectedTag) fd.append("propertyType", selectedTag);
    if (location) fd.append("location", location);
    mediaFiles.forEach(f => fd.append("media", f));
    try {
      const res = await fetch(`${API_URL}/buyer-posts`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setText(""); setDesc(""); setMediaFiles([]); setMediaPreviews([]);
        setSelectedTag(""); setLocation(""); setExpanded(false);
        onPost();
      }
    } catch {}
    setPosting(false);
  };

  const charCount = text.length;
  const charLimit = 280;

  return (
    <div className="bf-compose">
      <div className="bf-compose-inner">
        <Avatar name={user?.name} avatar={user?.avatar} size={42} />
        <div className="bf-compose-content">
          <textarea
            ref={textRef}
            className="bf-compose-textarea"
            placeholder="What's happening in real estate?"
            value={text}
            onChange={e => { setText(e.target.value.slice(0, charLimit)); if (!expanded) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
          />
          {expanded && (
            <textarea
              className="bf-compose-detail"
              placeholder="Add more details (optional)..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
            />
          )}

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className={"bf-compose-media count-" + Math.min(mediaPreviews.length, 4)}>
              {mediaPreviews.map((m, i) => (
                <div key={i} className="bf-compose-media-item">
                  {m.type?.startsWith("video/") ? (
                    <video src={m.url} muted />
                  ) : (
                    <img src={m.url} alt="" />
                  )}
                  <button className="bf-media-remove" onClick={() => removeMedia(i)}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Tags & location (expanded) */}
          {expanded && (
            <div className="bf-compose-options">
              <div className="bf-compose-tags">
                {PROPERTY_TAGS.map(tag => (
                  <button
                    key={tag.label}
                    type="button"
                    className={"bf-tag-chip" + (selectedTag === tag.label ? " active" : "")}
                    onClick={() => setSelectedTag(selectedTag === tag.label ? "" : tag.label)}
                  >
                    <span>{tag.icon}</span> {tag.label}
                  </button>
                ))}
              </div>
              <div className="bf-compose-location-row">
                <LocationIcon />
                <input
                  className="bf-compose-location"
                  placeholder="Add location..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="bf-compose-bar">
            <div className="bf-compose-tools">
              <input type="file" ref={fileRef} accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleMediaPick} />
              <button className="bf-compose-tool" onClick={() => fileRef.current?.click()} title="Add media">
                <ImageIcon />
              </button>
              <button className="bf-compose-tool" onClick={() => setExpanded(v => !v)} title="Add tag">
                <TagIcon />
              </button>
              <button className="bf-compose-tool" onClick={() => setExpanded(v => !v)} title="Add location">
                <LocationIcon />
              </button>
            </div>
            <div className="bf-compose-right">
              {charCount > 0 && (
                <div className="bf-char-ring">
                  <svg viewBox="0 0 32 32" className="bf-char-svg">
                    <circle cx="16" cy="16" r="14" className="bf-char-bg" />
                    <circle cx="16" cy="16" r="14" className="bf-char-fill"
                      style={{ strokeDashoffset: 88 - (88 * Math.min(charCount / charLimit, 1)) }}
                    />
                  </svg>
                  {charCount > charLimit * 0.8 && (
                    <span className={"bf-char-num" + (charCount >= charLimit ? " over" : "")}>{charLimit - charCount}</span>
                  )}
                </div>
              )}
              <button
                className="bf-post-btn"
                onClick={handleSubmit}
                disabled={!text.trim() || posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SINGLE POST
   ════════════════════════════════════════════════════════════ */
const PostCard = ({ post, user, onLike, onComment, chatRef, navigate }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [imageViewer, setImageViewer] = useState(null);

  const posterUser = post.userInfo || (post.userId && typeof post.userId === "object" ? post.userId : null);
  const posterAvatar = posterUser?.avatar || post.userAvatar;
  const posterName = posterUser?.name || post.userName || "Anonymous";
  const postLikes = post.likes || [];
  const isLiked = user && postLikes.map(l => l.toString()).includes(user._id?.toString());
  const likeCount = postLikes.length;
  const comments = post.comments || [];
  const commentCount = comments.length;
  const isOwn = user && (posterUser?._id?.toString() === user._id?.toString() || post.userId?.toString() === user._id?.toString());
  const visibleComments = showAllComments ? comments : comments.slice(-3);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment(post._id, commentText.trim());
    setCommentText("");
    setShowComments(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <article className="bf-post">
      {/* Thread line */}
      <div className="bf-post-avatar-col">
        <Avatar name={posterName} avatar={posterAvatar} size={42} />
      </div>

      <div className="bf-post-main">
        {/* Header */}
        <div className="bf-post-header">
          <span className="bf-post-name">{posterName}</span>
          {isOwn && <span className="bf-post-you">you</span>}
          <span className="bf-post-sep">·</span>
          <span className="bf-post-time">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Content */}
        <div className="bf-post-body">
          <p className="bf-post-text">{post.title}</p>
          {post.description && <p className="bf-post-desc">{post.description}</p>}
        </div>

        {/* Tags */}
        {(post.propertyType || post.location || post.budget) && (
          <div className="bf-post-meta">
            {post.propertyType && (
              <span className="bf-meta-tag type">
                <TagIcon /> {post.subCategory || post.propertyType}
              </span>
            )}
            {post.location && (
              <span className="bf-meta-tag location">
                <LocationIcon /> {post.location}
              </span>
            )}
            {post.budget && (
              <span className="bf-meta-tag budget">
                Rs. {parseInt(post.budget).toLocaleString()}/mo
              </span>
            )}
          </div>
        )}

        {/* Media Grid */}
        {post.media?.length > 0 && (
          <div className={"bf-post-media count-" + Math.min(post.media.length, 4)}>
            {post.media.slice(0, 4).map((m, i) => {
              const isVid = /\.(mp4|webm|mov)$/i.test(m);
              return isVid ? (
                <video key={i} src={`${API_URL}/uploads/${m}`} className="bf-media-item" controls muted playsInline />
              ) : (
                <img
                  key={i}
                  src={`${API_URL}/uploads/${m}`}
                  alt=""
                  className="bf-media-item"
                  onClick={() => setImageViewer(`${API_URL}/uploads/${m}`)}
                />
              );
            })}
          </div>
        )}

        {/* Image lightbox */}
        {imageViewer && (
          <div className="bf-lightbox" onClick={() => setImageViewer(null)}>
            <img src={imageViewer} alt="" />
            <button className="bf-lightbox-close">×</button>
          </div>
        )}

        {/* Contact chips */}
        {(post.contactPhone || (user && !isOwn && posterUser && chatRef)) && (
          <div className="bf-post-contact">
            {post.contactPhone && (
              <a href={`tel:${post.contactPhone}`} className="bf-contact-btn">📞 {post.contactPhone}</a>
            )}
            {user && !isOwn && posterUser && chatRef && (
              <button className="bf-contact-btn msg" onClick={() => chatRef.current?.openWith(posterUser)}>
                <MessageIcon /> Message
              </button>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="bf-post-actions">
          <button
            className={"bf-action like" + (isLiked ? " liked" : "")}
            onClick={() => onLike(post._id)}
          >
            <HeartIcon filled={isLiked} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            className={"bf-action comment" + (showComments ? " active" : "")}
            onClick={() => setShowComments(v => !v)}
          >
            <CommentIcon />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>
          <button className="bf-action share" onClick={handleShare}>
            <ShareIcon />
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="bf-comments">
            {commentCount > 3 && !showAllComments && (
              <button className="bf-show-more" onClick={() => setShowAllComments(true)}>
                Show all {commentCount} replies
              </button>
            )}
            {visibleComments.map((c, ci) => (
              <div key={ci} className="bf-comment">
                <Avatar name={c.userName} avatar={c.userAvatar} size={28} />
                <div className="bf-comment-content">
                  <div className="bf-comment-head">
                    <span className="bf-comment-name">{c.userName}</span>
                    <span className="bf-comment-time">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="bf-comment-text">{c.text}</p>
                </div>
              </div>
            ))}
            {user && (
              <div className="bf-comment-compose">
                <Avatar name={user.name} avatar={user.avatar} size={28} />
                <div className="bf-comment-input-wrap">
                  <input
                    className="bf-comment-input"
                    placeholder="Post your reply..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                  />
                  <button
                    className="bf-comment-send"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function BuyersForumPage({ user, chatRef }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("new");

  const fetchPosts = useCallback(async (s = sort) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/buyer-posts?sort=${s}&postType=forum`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch {}
    setLoading(false);
  }, [sort]);

  useEffect(() => { fetchPosts(sort); }, [sort]); // eslint-disable-line

  const handleLike = async (postId) => {
    if (!user) { navigate("/login"); return; }
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const likes = p.likes || [];
      const liked = likes.map(l => l.toString()).includes(user._id.toString());
      return { ...p, likes: liked ? likes.filter(l => l.toString() !== user._id.toString()) : [...likes, user._id] };
    }));
    try {
      await fetch(`${API_URL}/buyer-posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id })
      });
    } catch {}
  };

  const handleComment = async (postId, text) => {
    if (!user) { navigate("/login"); return; }
    try {
      await fetch(`${API_URL}/buyer-posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, userName: user.name, userAvatar: user.avatar || "", text })
      });
      fetchPosts(sort);
    } catch {}
  };

  return (
    <div className="bf-page">
      {/* Header */}
      <div className="bf-header">
        <div className="bf-header-inner">
          <h1 className="bf-title">Community</h1>
          <div className="bf-tabs">
            <button className={"bf-tab" + (sort === "new" ? " active" : "")} onClick={() => setSort("new")}>
              <span className="bf-tab-label">Latest</span>
            </button>
            <button className={"bf-tab" + (sort === "top" ? " active" : "")} onClick={() => setSort("top")}>
              <span className="bf-tab-label">Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed container */}
      <div className="bf-container">
        {/* Compose */}
        {user ? (
          <ComposeBox user={user} onPost={() => fetchPosts(sort)} />
        ) : (
          <div className="bf-login-prompt">
            <p>Join the conversation</p>
            <button className="bf-login-btn" onClick={() => navigate("/login")}>Sign in to post</button>
          </div>
        )}

        {/* Divider */}
        <div className="bf-divider" />

        {/* Posts */}
        {loading ? (
          <div className="bf-loading">
            <div className="bf-spinner" />
            <span>Loading feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bf-empty">
            <div className="bf-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>No posts yet</h3>
            <p>Be the first to share something with the community.</p>
          </div>
        ) : (
          <div className="bf-feed">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                user={user}
                onLike={handleLike}
                onComment={handleComment}
                chatRef={chatRef}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
