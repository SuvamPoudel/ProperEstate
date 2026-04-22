import React, { useState, useEffect } from "react";
import { API_URL } from "../constants";
import LandCard from "../components/LandCard";

export const ListedAssetsPage = ({ user, toggleSave, fetchDashboardData }) => {
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUploaded = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user-dashboard/${user._id}`);
      const data = await res.json();
      if (data.success) setUploaded(data.uploaded || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUploaded(); }, [user?._id]); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    await fetch(`${API_URL}/admin/delete-land/` + id, { method: "DELETE" });
    fetchUploaded();
    if (fetchDashboardData) fetchDashboardData();
  };

  return (
    <div className="dashboard-page-wrapper">
      <div className="container">
        <h2 className="page-title">My Listed Assets</h2>
        {loading ? (
          <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading...</p>
        ) : (
          <div className="lands-grid">
            {uploaded.length > 0
              ? uploaded.map(l => (
                  <LandCard
                    key={l._id}
                    land={l}
                    user={user}
                    toggleSave={toggleSave}
                    showActions={true}
                    onDelete={handleDelete}
                  />
                ))
              : <p>No listings yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export const SavedWishlistPage = ({ user, toggleSave }) => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user-dashboard/${user._id}`);
      const data = await res.json();
      if (data.success) setSaved(data.saved || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSaved(); }, [user?._id]); // eslint-disable-line

  // Re-fetch whenever savedLands in user changes (after toggle)
  useEffect(() => { fetchSaved(); }, [user?.savedLands?.length]); // eslint-disable-line

  const handleToggle = async (landId) => {
    if (toggleSave) await toggleSave(landId);
    // Re-fetch after a short delay to let backend update
    setTimeout(fetchSaved, 300);
  };

  return (
    <div className="dashboard-page-wrapper">
      <div className="container">
        <h2 className="page-title">My Saved Wishlist</h2>
        {loading ? (
          <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading...</p>
        ) : (
          <div className="lands-grid">
            {saved.length > 0
              ? saved.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={handleToggle} />)
              : <p>No saved properties yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export const RentalRequestsPage = ({ dashData, respondToBooking }) => {
  return (
    <div className="dashboard-page-wrapper">
      <div className="container">
        <h2 className="page-title">Rental Requests</h2>
        <div className="users-list">
          {dashData.bookings?.length > 0 ? dashData.bookings.map(b => (
            <div key={b._id} className="user-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <p><strong>Property:</strong> {b.landId?.title}</p>
              <p><strong>Renter:</strong> {b.buyerId?.name} &nbsp;|&nbsp; <strong>Email:</strong> {b.buyerId?.email}</p>
              {b.rentDuration && <p><strong>Duration:</strong> {b.rentDuration}</p>}
              {b.negotiatedPrice && (
                <p>
                  <strong>Offer:</strong>{" "}
                  <span style={{color:"rgba(0,212,255,0.85)",fontWeight:700}}>Rs. {parseInt(b.negotiatedPrice).toLocaleString()}/mo</span>{" "}
                  <span style={{color:"var(--text-muted)",fontSize:"0.85rem"}}>(listed: Rs. {b.landId?.price?.toLocaleString()}/mo)</span>
                </p>
              )}
              <p>
                <strong>Status:</strong>{" "}
                <span style={{ fontWeight: "bold", color: b.status === "pending" ? "orange" : b.status === "accepted" ? "green" : "red" }}>
                  {b.status?.toUpperCase()}
                </span>
              </p>
              {b.status === "pending" && (
                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <button className="btn-primary" onClick={() => respondToBooking(b._id, "accepted")}>Accept</button>
                  <button className="btn-danger-sm" onClick={() => respondToBooking(b._id, "rejected")}>Reject</button>
                </div>
              )}
            </div>
          )) : <p>No rental requests yet.</p>}
        </div>
      </div>
    </div>
  );
};
