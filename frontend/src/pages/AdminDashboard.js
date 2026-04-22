import React, { useState, useEffect } from "react";
import { API_URL } from "../constants";
import LandCard from "../components/LandCard";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [lands, setLands] = useState([]);
  const [view, setView] = useState("pending");
  const [backgroundMedia, setBackgroundMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchAdminData = () => {
    fetch(`${API_URL}/admin/users`).then(res => res.json()).then(d => setUsers(d.users));
    fetch(`${API_URL}/admin/all-lands`).then(res => res.json()).then(d => setLands(d.lands));
    fetch(`${API_URL}/admin/background-media`).then(res => res.json()).then(d => d.success && setBackgroundMedia(d.media));
  };
  useEffect(() => { fetchAdminData(); }, []);

  const handleVerify = async (id, status) => {
    if (!window.confirm("Mark this land as " + status + "?")) return;
    await fetch(`${API_URL}/admin/verify-land/` + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAdminData();
  };
  const deleteLand = async (id) => {
    if (!window.confirm("Delete this land?")) return;
    await fetch(`${API_URL}/admin/delete-land/` + id, { method: "DELETE" });
    fetchAdminData();
  };
  const deleteUser = async (id) => {
    if (!window.confirm("Delete User AND their lands?")) return;
    await fetch(`${API_URL}/admin/delete-user/` + id, { method: "DELETE" });
    fetchAdminData();
  };
  const verifySeller = async (id, status) => {
    await fetch(`${API_URL}/admin/verify-seller/` + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAdminData();
  };
  const setAccountType = async (id, accountType) => {
    await fetch(`${API_URL}/admin/set-account-type/` + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountType }) });
    fetchAdminData();
  };

  const uploadBackgroundMedia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    const ext = file.name.split('.').pop().toLowerCase();
    let type = "image";
    if (["mp4", "webm", "mov"].includes(ext)) type = "video";
    else if (ext === "gif") type = "gif";
    formData.append("type", type);
    setUploadingMedia(true);
    try {
      const res = await fetch(`${API_URL}/admin/background-media`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { alert("Background media uploaded!"); fetchAdminData(); }
    } catch (err) { alert("Upload failed: " + err.message); }
    setUploadingMedia(false);
    e.target.value = "";
  };

  const toggleMediaActive = async (id, currentActive) => {
    await fetch(`${API_URL}/admin/background-media/` + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !currentActive }) });
    fetchAdminData();
  };

  const deleteBackgroundMedia = async (id) => {
    if (!window.confirm("Delete this background media?")) return;
    await fetch(`${API_URL}/admin/background-media/` + id, { method: "DELETE" });
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
        <div onClick={() => setView("backgrounds")} className={view === "backgrounds" ? "active" : ""}>🎬 Backgrounds</div>
      </div>
      <div className="admin-content">
        <h1>{view === "lands" ? "All Listed Properties" : view === "users" ? "Registered Users" : view === "sellers" ? "Seller Verification Requests" : view === "backgrounds" ? "Background Media Management" : "Pending Land Verifications"}</h1>
        {view === "pending" && (
          <div className="users-list">
            {lands.filter(l => l.status === "pending").map(l => (
              <div key={l._id} className="user-row" style={{ flexDirection: "column", gap: "10px" }}>
                <div className="user-info">
                  <strong>{l.title}</strong> - {[l.city, l.district, l.province].filter(Boolean).join(", ") || l.location} (Owner: {l.ownerName})
                  {l.ownerEmail && <span style={{ color: "#666", fontSize: "0.85rem" }}> - {l.ownerEmail}</span>}
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <a href={`${API_URL}/uploads/` + l.lalpurjaImage} target="_blank" rel="noreferrer" style={{ color: "blue" }}>View Lalpurja</a>
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
                  {u.sellerDoc && <a href={`${API_URL}/uploads/` + u.sellerDoc} target="_blank" rel="noreferrer" style={{ color: "blue" }}>View Document</a>}
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
        {view === "backgrounds" && (
          <div>
            <div style={{ marginBottom: "30px", padding: "20px", background: "rgba(40,40,40,0.5)", borderRadius: "12px" }}>
              <h3 style={{ marginBottom: "15px", color: "#D4AF37" }}>Upload New Background</h3>
              <p style={{ fontSize: "0.9rem", color: "#ccc", marginBottom: "15px" }}>Upload videos (MP4, WebM), GIFs, or images for home page backgrounds.</p>
              <input type="file" accept="video/*,image/gif,image/png,image/jpeg" onChange={uploadBackgroundMedia} disabled={uploadingMedia}
                style={{ padding: "10px", border: "2px dashed #D4AF37", borderRadius: "8px", width: "100%", background: "rgba(0,0,0,0.3)", color: "#fff" }} />
              {uploadingMedia && <p style={{ marginTop: "10px", color: "#D4AF37" }}>Uploading...</p>}
            </div>
            <h3 style={{ marginBottom: "20px", color: "#fff" }}>Current Backgrounds ({backgroundMedia.length})</h3>
            {backgroundMedia.length === 0 && <p style={{ color: "#999" }}>No background media uploaded yet.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {backgroundMedia.map((media, index) => (
                <div key={media._id} style={{ border: "2px solid " + (media.active ? "#D4AF37" : "#444"), borderRadius: "12px", overflow: "hidden", background: "rgba(20,20,20,0.9)" }}>
                  <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
                    {media.type === "video" ? (
                      <video src={`${API_URL}/uploads/${media.url}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} muted loop autoPlay />
                    ) : (
                      <img src={`${API_URL}/uploads/${media.url}`} alt="background" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ padding: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase", fontWeight: "600" }}>{media.type} #{index + 1}</span>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600", background: media.active ? "#2d5a4e" : "#5a2d2d", color: media.active ? "#4caf50" : "#ff6b6b" }}>
                        {media.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className={media.active ? "btn-outline" : "btn-primary"} style={{ flex: 1, fontSize: "0.85rem", padding: "8px" }} onClick={() => toggleMediaActive(media._id, media.active)}>
                        {media.active ? "Deactivate" : "Activate"}
                      </button>
                      <button className="btn-danger-sm" style={{ fontSize: "0.85rem", padding: "8px 12px" }} onClick={() => deleteBackgroundMedia(media._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
