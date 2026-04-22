import React, { useState, useEffect } from "react";
import { API_URL } from "../constants";
import EsewaPayment from "../components/EsewaPayment";

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
          {p.preferredGender && p.preferredGender !== "No Preference" && <span className="pcard-pref-tag">👤 {p.preferredGender}</span>}
          {p.preferredAge && p.preferredAge !== "No Preference" && <span className="pcard-pref-tag">🎂 {p.preferredAge} yrs</span>}
          {p.moveInDate && <span className="pcard-pref-tag">📅 {new Date(p.moveInDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
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
  const [tab, setTab] = useState("browse");
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [searchLoc, setSearchLoc] = useState("");
  const [searchType, setSearchType] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [postStep, setPostStep] = useState("form");
  const [formData, setFormData] = useState({
    name: user?.name || "", phone: "", email: user?.email || "",
    location: "", budget: "", propertyType: "", subCategory: "",
    preferredGender: "", preferredAge: "", moveInDate: "", description: "",
  });
  const [errors, setErrors] = useState({});

  const subCats = formData.propertyType ? PARTNER_CATEGORIES[formData.propertyType]?.subs || [] : [];

  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const res = await fetch(`${API_URL}/rental-partners`);
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

  const handleChat = (posterUser) => {
    if (!user) return;
    if (chatRef?.current?.open) chatRef.current.open();
    setTimeout(() => { if (chatRef?.current?.openWith) chatRef.current.openWith(posterUser); }, 100);
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

  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; setShowPayment(true); };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    try {
      await fetch(`${API_URL}/rental-partner`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, userId: user?._id }) });
    } catch (err) { console.error(err); }
    setPostStep("success");
    fetchPartners();
  };

  return (
    <div className="rp-page">
      {showPayment && (
        <EsewaPayment amount={100} description="Rental Partner Listing Fee - ProperEstate" onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} />
      )}

      <div className="rp-hero">
        <div className="rp-hero-inner">
          <h1>Find a Rental Partner</h1>
          <p>Connect with people looking to share rent across Nepal. Browse requests or post your own.</p>
          <div className="rp-hero-stats">
            <span><strong>{partners.length}</strong> active requests</span>
            <span>Rs. 200 to post</span>
          </div>
        </div>
      </div>

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
              <div className="rp-loading"><div className="rp-spinner"></div><p>Loading partner requests...</p></div>
            ) : filtered.length === 0 ? (
              <div className="rp-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
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

        {tab === "post" && (
          <div className="rp-post-wrap">
            {postStep === "success" ? (
              <div className="rp-success-box">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C8A96E" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
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
                    <button type="submit" className="btn-primary full-width" style={{marginTop:12}}>Post Partner Request — Pay Rs. 200</button>
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

export default RentalPartnerPage;
