import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { API_URL } from "../constants";

const BecomeSellerSection = ({ user, setUser }) => {
  const [open, setOpen] = useState(false);
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
    const res = await fetch(`${API_URL}/become-seller`, { method: "POST", body: fd });
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
      <span className="seller-status-icon">✓</span>
      <div>
        <h3>Verified Seller</h3>
        <p>You can list properties on ProperEstate.</p>
      </div>
    </div>
  );

  if (user.accountType === "seller_pending" || done) return (
    <div className="seller-status-box pending">
      <span className="seller-status-icon">⏳</span>
      <div>
        <h3>Verification Pending</h3>
        <p>Admin verifies within 24–48 hrs.</p>
      </div>
    </div>
  );

  return (
    <div className="become-seller-accordion">
      <button
        className={"become-seller-toggle " + (open ? "open" : "")}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className="bst-label">Become a Seller</span>
        <span className="bst-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="become-seller-body">
          <p>Upload a valid ID to list properties for rent.</p>
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
              <label>Upload Document</label>
              <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} required />
            </div>
            <button className="profile-save-btn" type="submit" disabled={loading}>
              {loading ? "[ Uploading... ]" : "[ Submit for Verification ]"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

function ProfilePage({ user, setUser }) {
  const [formData, setFormData] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [file, setFile] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [saved, setSaved] = useState(false);

  const validatePhone = (val) => {
    if (val && !/^[0-9]{10}$/.test(val)) setPhoneError("Phone must be exactly 10 digits");
    else setPhoneError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) { setPhoneError("Phone must be exactly 10 digits"); return; }
    const data = new FormData();
    data.append("userId", user._id);
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    if (file) data.append("avatar", file);
    const res = await fetch(`${API_URL}/update-profile`, { method: "POST", body: data });
    const result = await res.json();
    if (result.success) {
      setUser(result.user);
      localStorage.setItem("properEstateUser", JSON.stringify(result.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!user) return <Navigate to="/login" />;
  const avatarSrc = file
    ? URL.createObjectURL(file)
    : (user.avatar ? `${API_URL}/uploads/` + user.avatar : null);

  const roleLabel =
    user.role === "admin"                   ? "Admin"
    : user.accountType === "seller"         ? "Verified Seller"
    : user.accountType === "seller_pending" ? "Pending"
    : "Buyer";

  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : "—";

  return (
    <div className="profile-page-wrapper">
      <div className="profile-city-bg" aria-hidden="true" />

      <div className="profile-card">

        {/* ── Header row: avatar + name + email + badge ── */}
        <div className="profile-header" style={{display:'flex',flexDirection:'row',alignItems:'center',gap:'12px',padding:'14px 16px 12px',borderBottom:'1px solid rgba(0,212,255,0.08)'}}>
          {/* Avatar ring — overflow:visible so camera btn shows outside */}
          <div style={{position:'relative',flexShrink:0,width:'52px',height:'52px'}}>
            <div className="profile-avatar-ring" style={{width:'52px',height:'52px',borderRadius:'50%',border:'1.5px solid rgba(0,212,255,0.45)',background:'#080B14',overflow:'hidden',position:'relative'}}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="profile-avatar-img" />
                : <div className="profile-avatar-placeholder">{user.name?.[0]?.toUpperCase() || "U"}</div>
              }
            </div>
            <input type="file" id="avatarInput" hidden accept="image/*" onChange={e => setFile(e.target.files[0])} />
            <label htmlFor="avatarInput" className="profile-camera-btn" title="Change photo" style={{position:'absolute',bottom:'-2px',right:'-2px',width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,212,255,0.15)',border:'1px solid rgba(0,212,255,0.5)',borderRadius:'50%',fontSize:'9px',cursor:'pointer',color:'rgba(0,212,255,0.9)',zIndex:2}}>✎</label>
          </div>          <div className="profile-header-info" style={{display:'flex',flexDirection:'column',gap:'3px',minWidth:0,flex:1}}>
            <div className="profile-display-name" style={{fontFamily:"'Rajdhani',sans-serif",fontSize:'1.05rem',fontWeight:700,color:'#F4F1EC',letterSpacing:'0.08em',textTransform:'uppercase',lineHeight:1,margin:0}}>{user.name}</div>
            <div className="profile-display-email" style={{fontFamily:"'Rajdhani',sans-serif",fontSize:'0.65rem',color:'rgba(0,212,255,0.55)',margin:0,letterSpacing:'0.04em'}}>{user.email}</div>
            <span className="profile-role-badge">{roleLabel}</span>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="profile-stats-row" style={{display:'flex',borderBottom:'1px solid rgba(0,212,255,0.08)'}}>
          <div className="profile-stat">
            <span className="profile-stat-value">{user.listings || 0}</span>
            <span className="profile-stat-label">Listings</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{user.bookings || 0}</span>
            <span className="profile-stat-label">Bookings</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{memberSince}</span>
            <span className="profile-stat-label">Since</span>
          </div>
        </div>

        {/* ── Edit form ── */}
        <form className="profile-form-new" onSubmit={handleUpdate}>
          <div className="profile-field">
            <label>Full Name</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">◈</span>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your full name" required />
            </div>
          </div>
          <div className="profile-field">
            <label>Phone</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">◉</span>
              <input
                value={formData.phone}
                onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,10); setFormData({...formData,phone:v}); validatePhone(v); }}
                placeholder="10-digit number" maxLength={10} inputMode="numeric"
              />
            </div>
            {phoneError && <p className="profile-field-error">⚠ {phoneError}</p>}
            {formData.phone && !phoneError && formData.phone.length === 10 && <p className="profile-field-ok">✓ Valid</p>}
          </div>
          <div className="profile-field readonly">
            <label>Email</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">◎</span>
              <input value={user.email} disabled />
            </div>
          </div>
          <button className={"profile-save-btn " + (saved ? "saved" : "")} type="submit">
            {saved ? "[ Saved ]" : "[ Save Changes ]"}
          </button>
        </form>

        {/* ── Become a Seller dropdown ── */}
        <BecomeSellerSection user={user} setUser={setUser} />

      </div>
    </div>
  );
}

export default ProfilePage;
