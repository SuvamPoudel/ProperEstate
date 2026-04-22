import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

const BuyersSectionPage = ({ user, chatRef }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [formData, setFormData] = useState({
    title: "", description: "", propertyType: "", subCategory: "",
    location: "", budget: "", contactPhone: "", contactEmail: ""
  });

  const BS_CATEGORIES = {
    "Land":  { icon: "🌿", subs: ["Agricultural Land", "Residential Land", "Commercial Land"] },
    "House": { icon: "🏠", subs: ["Apartment / Flat", "House / Villa", "Bungalow"] },
    "Room":  { icon: "🚪", subs: ["Room - Living", "Room - Office", "Room - Storage"] },
    "Commercial": { icon: "🏢", subs: ["Shop / Showroom", "Office Space", "Warehouse"] },
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/buyer-posts?postType=section`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!formData.title || !formData.propertyType || !formData.location) { alert("Please fill required fields."); return; }
    try {
      const res = await fetch(`${API_URL}/buyer-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId: user._id, userName: user.name, userAvatar: user.avatar, postType: "section" })
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ title: "", description: "", propertyType: "", subCategory: "", location: "", budget: "", contactPhone: "", contactEmail: "" });
        fetchPosts();
      }
    } catch {}
  };

  const handleComment = async (postId) => {
    if (!user) { navigate("/login"); return; }
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    try {
      await fetch(`${API_URL}/buyer-posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, userName: user.name, userAvatar: user.avatar, text })
      });
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch {}
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s/60) + "m ago";
    if (s < 86400) return Math.floor(s/3600) + "h ago";
    return Math.floor(s/86400) + "d ago";
  };

  const subCats = formData.propertyType ? BS_CATEGORIES[formData.propertyType]?.subs || [] : [];

  return (
    <div className="bs-page">
      <div className="bs-hero">
        <div className="bs-hero-inner">
          <h1>Buyers Section</h1>
          <p>Post what you're looking for. Sellers and agents will reach out directly.</p>
          {user ? (
            <button className="bs-post-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? "✕ Cancel" : "+ Post What You Need"}
            </button>
          ) : (
            <button className="bs-post-btn" onClick={() => navigate("/login")}>Login to Post</button>
          )}
        </div>
      </div>

      <div className="bs-body">
        {showForm && (
          <div className="bs-form-card">
            <h3>What are you looking for?</h3>
            <form onSubmit={handlePost} className="bs-form">
              <div className="bs-form-grid">
                <div className="bs-field full">
                  <label>Post Title *</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Looking for 2BHK flat in Kathmandu" required />
                </div>
                <div className="bs-field full">
                  <label>Property Type *</label>
                  <div className="category-selector">
                    {Object.entries(BS_CATEGORIES).map(([cat, info]) => (
                      <button key={cat} type="button"
                        className={"cat-btn" + (formData.propertyType === cat ? " selected" : "")}
                        onClick={() => setFormData({...formData, propertyType: cat, subCategory: ""})}>
                        {info.icon} {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {formData.propertyType && (
                  <div className="bs-field full">
                    <label>Sub-Category</label>
                    <div className="subcategory-selector">
                      {subCats.map(sc => (
                        <button key={sc} type="button"
                          className={"subcat-btn" + (formData.subCategory === sc ? " selected" : "")}
                          onClick={() => setFormData({...formData, subCategory: sc})}>
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bs-field">
                  <label>Location *</label>
                  <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Lalitpur, Kathmandu" required />
                </div>
                <div className="bs-field">
                  <label>Budget (Rs./mo)</label>
                  <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="e.g. 15000" />
                </div>
                <div className="bs-field">
                  <label>Contact Phone</label>
                  <input value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value.replace(/\D/g,"").slice(0,10)})} placeholder="98XXXXXXXX" maxLength={10} />
                </div>
                <div className="bs-field">
                  <label>Contact Email</label>
                  <input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} placeholder="your@email.com" />
                </div>
                <div className="bs-field full">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Any specific requirements, preferences, timeline..." style={{width:"100%",resize:"vertical"}} />
                </div>
              </div>
              <button type="submit" className="btn-primary full-width" style={{marginTop:16}}>📢 Post Request</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="rp-loading"><div className="rp-spinner"></div><p>Loading posts...</p></div>
        ) : posts.length === 0 ? (
          <div className="rp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3A3A52" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <h3>No posts yet</h3>
            <p>Be the first to post what you're looking for!</p>
          </div>
        ) : (
          <div className="bs-feed">
            {posts.map(post => {
              const posterUser = post.userId && typeof post.userId === "object" ? post.userId : null;
              const initials = (post.userName || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
              const isOwn = posterUser?._id && user?._id && posterUser._id.toString() === user._id.toString();
              const showAllComments = expandedComments[post._id];
              const visibleComments = showAllComments ? post.comments : (post.comments || []).slice(-2);
              return (
                <div key={post._id} className="bs-post-card">
                  <div className="bs-post-header">
                    <div className="bs-post-avatar">{initials}</div>
                    <div className="bs-post-meta">
                      <span className="bs-post-author">{post.userName}</span>
                      <span className="bs-post-time">{timeAgo(post.createdAt)}</span>
                    </div>
                    <div className="bs-post-type-badge">
                      {BS_CATEGORIES[post.propertyType]?.icon} {post.subCategory || post.propertyType}
                    </div>
                  </div>
                  <h3 className="bs-post-title">{post.title}</h3>
                  {post.description && <p className="bs-post-desc">{post.description}</p>}
                  <div className="bs-post-tags">
                    {post.location && <span className="bs-tag">📍 {post.location}</span>}
                    {post.budget && <span className="bs-tag">💰 Rs. {parseInt(post.budget).toLocaleString()}/mo</span>}
                  </div>
                  <div className="bs-post-contact">
                    {post.contactPhone && (
                      <a href={`tel:${post.contactPhone}`} className="bs-contact-btn phone">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {post.contactPhone}
                      </a>
                    )}
                    {post.contactEmail && (
                      <a href={`mailto:${post.contactEmail}`} className="bs-contact-btn email">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                        Email
                      </a>
                    )}
                    {user && posterUser && !isOwn && chatRef && (
                      <button className="bs-contact-btn msg" onClick={() => chatRef.current?.openWith(posterUser)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Message
                      </button>
                    )}
                  </div>
                  <div className="bs-comments">
                    <div className="bs-comments-header">
                      <span className="bs-comments-count">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {post.comments?.length || 0} {post.comments?.length === 1 ? "comment" : "comments"}
                      </span>
                      {post.comments?.length > 2 && (
                        <button className="bs-show-more" onClick={() => setExpandedComments(prev => ({...prev, [post._id]: !prev[post._id]}))}>
                          {showAllComments ? "Show less" : `View all ${post.comments.length} comments`}
                        </button>
                      )}
                    </div>
                    {visibleComments.map((c, ci) => {
                      const cInitials = (c.userName || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
                      return (
                        <div key={ci} className="bs-comment">
                          <div className="bs-comment-avatar">{cInitials}</div>
                          <div className="bs-comment-body">
                            <span className="bs-comment-author">{c.userName}</span>
                            <span className="bs-comment-text">{c.text}</span>
                            <span className="bs-comment-time">{timeAgo(c.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {user && (
                      <div className="bs-comment-input-row">
                        <div className="bs-comment-avatar">{(user.name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}</div>
                        <div className="bs-comment-input-wrap">
                          <input
                            value={commentInputs[post._id] || ""}
                            onChange={e => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                            onKeyDown={e => e.key === "Enter" && handleComment(post._id)}
                            placeholder="Write a comment..."
                            className="bs-comment-input"
                          />
                          <button className="bs-comment-send" onClick={() => handleComment(post._id)} disabled={!(commentInputs[post._id] || "").trim()}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyersSectionPage;
