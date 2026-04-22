import React from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

const LandCard = ({ land, user, toggleSave, showActions = false, onDelete }) => {
  // Compare as strings — savedLands may contain strings or ObjectIds
  const landIdStr = land._id?.toString();
  const isSaved = user?.savedLands?.some(id => id?.toString() === landIdStr);
  const navigate = useNavigate();

  // Deduplicate location terms
  const locationTerms = [land.city, land.district, land.province].filter(Boolean);
  const uniqueLocation = [...new Set(locationTerms)].join(", ") || land.location;

  return (
    <div
      className={`land-card ${land.featured ? "featured" : ""}`}
      onClick={() => navigate("/land/" + land._id)}
    >
      {/* Full-bleed image */}
      <img
        className="land-card-img"
        src={land.image
          ? (land.image.startsWith("http") ? land.image : `${API_URL}/uploads/${land.image}`)
          : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400"}
        alt={land.title}
      />

      {/* Category badge — top left */}
      <div className="card-badge">{land.subCategory || land.category || "Property"}</div>

      {/* Save / wishlist button — top right */}
      {toggleSave && !showActions && (
        <button
          className="card-save-btn"
          onClick={(e) => { e.stopPropagation(); toggleSave(land._id); }}
          title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "#e53935" : "none"} stroke={isSaved ? "#e53935" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}

      {/* Permanent resting title — always visible */}
      <div className="card-resting">
        <div className="card-resting-title">{land.title}</div>
        <div className="card-resting-price">Rs. {parseInt(land.price).toLocaleString()}/mo</div>
      </div>

      {/* Bottom overlay: dramatic hover reveal */}
      <div className="card-overlay">
        <div className="card-overlay-title">{land.title}</div>
        <div className="card-overlay-meta">
          <span className="card-overlay-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {uniqueLocation}
          </span>
          <span className="card-overlay-price">Rs. {parseInt(land.price).toLocaleString()}/mo</span>
        </div>
        {user?._id === land.ownerId && (
          <div className="card-overlay-status" style={{ color: land.status === "approved" ? "#4caf50" : "#ff9800" }}>
            {land.status?.toUpperCase()}
          </div>
        )}
        {/* Show action buttons when in dashboard mode */}
        {showActions && (
          <div className="card-overlay-actions" onClick={(e) => e.stopPropagation()}>
            {user?._id === land.ownerId && (
              <button className="card-action-btn" onClick={() => navigate("/edit-land/" + land._id)}>Edit</button>
            )}
            <button className="card-action-btn danger" onClick={() => onDelete(land._id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandCard;
