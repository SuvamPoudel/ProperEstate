import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

const LandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [land, setLand] = useState(null);

  useEffect(() => {
    // Fetch single land details
    const fetchLand = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/lands/${id}`);
        const data = await response.json();
        if (data.success) {
          setLand(data.data);
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      }
    };
    fetchLand();
  }, [id]);

  if (!land) return <div className="container">Loading details...</div>;

  return (
    <div className="app-root">
       {/* Simple Header for Details Page */}
       <header className="header">
        <div className="nav-bar">
          <div className="logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>ProperEstate</div>
          <button className="nav-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </header>

      <div className="details-container">
        <button className="back-btn" onClick={() => navigate('/')}>← Go Back</button>
        
        <div className="details-grid">
          {/* LEFT SIDE: Image + Map + Desc */}
          <div className="details-left">
            <div className="details-image-box">
              {/* FIXED: Added class details-main-img in CSS to control height/width */}
              <img 
                src={`http://localhost:5000/${land.image}`} 
                alt={land.title} 
                className="details-main-img" 
              />
            </div>

            <div className="details-desc">
              <h3>Description</h3>
              <p>{land.description || "No description provided for this land."}</p>
            </div>

            {/* MINI MAP SECTION */}
            <div className="map-box">
              {/* Uses Google Maps Embed API with the location name. Zero config needed. */}
              <iframe 
                title="Land Location"
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(land.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              >
              </iframe>
            </div>
          </div>

          {/* RIGHT SIDE: Info Card */}
          <div className="details-info">
            <h1 className="details-title">{land.title}</h1>
            <span className="details-price">Rs. {land.price.toLocaleString()}</span>
            
            <div style={{margin: '20px 0', borderTop:'1px solid #eee', paddingTop:'20px'}}>
              <p><strong>📍 Location:</strong> {land.location}</p>
              <p><strong>📏 Area:</strong> {land.area} Anna</p>
              <p><strong>🏷️ Category:</strong> {land.category}</p>
            </div>

            <button className="btn-primary">Contact Seller</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandDetails;