import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const Home = () => {
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter States
  const [maxPrice, setMaxPrice] = useState(10000000); // Default max 1 Crore
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch Function (Reusable for Refresh)
  const fetchLands = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch("http://localhost:5000/api/lands");
      const data = await response.json();
      if (data.success) {
        setLands(data.data);
        setFilteredLands(data.data);
      }
    } catch (error) {
      console.error("Error fetching lands:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLands();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = lands;

    // 1. Search Filter
    if (searchTerm) {
      result = result.filter((land) =>
        land.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        land.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Category Filter
    if (selectedCategory !== "All") {
      result = result.filter((land) => land.category === selectedCategory);
    }

    // 3. Price Filter (Slider)
    result = result.filter((land) => land.price <= maxPrice);

    setFilteredLands(result);
  }, [searchTerm, selectedCategory, maxPrice, lands]);

  return (
    <div className="app-root">
      {/* Header with SEARCH BAR restored */}
      <header className="header">
        <div className="nav-bar">
          <Link to="/" className="logo">ProperEstate</Link>

          <div className="search-wrapper">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search locations, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="nav-right">
             <Link to="/add-land" className="nav-btn active">+ List Land</Link>
             <Link to="/profile" className="nav-btn">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="container">
        
        {/* TOOLBAR: Filters + Refresh Button */}
        <div className="toolbar">
          <div className="filter-section">
            
            {/* Category */}
            <div className="filter-group">
              <span className="filter-label">Type</span>
              <select 
                className="category-select"
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Farm">Farm</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            {/* Price Slider (Daraz Style) */}
            <div className="filter-group">
              <span className="filter-label">Max Price: Rs. {maxPrice.toLocaleString()}</span>
              <input 
                type="range" 
                min="0" 
                max="50000000" 
                step="100000" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-slider"
              />
            </div>
          </div>

          {/* REFRESH BUTTON - Solves the 'Log out' issue */}
          <button className="refresh-btn" onClick={fetchLands} disabled={loading}>
            {loading ? "Loading..." : "🔄 Refresh List"}
          </button>
        </div>

        {/* LANDS GRID */}
        {filteredLands.length === 0 ? (
           <div style={{textAlign:'center', padding: '50px', color:'#999'}}>
             <h3>No lands found matching your filters.</h3>
             <button className="btn-primary" style={{width:'auto'}} onClick={() => {setMaxPrice(50000000); setSearchTerm(''); setSelectedCategory('All')}}>Clear Filters</button>
           </div>
        ) : (
          <div className="lands-grid">
            {filteredLands.map((land) => (
              <Link to={`/land/${land._id}`} key={land._id} style={{textDecoration:'none'}}>
                <div className="land-card">
                  <div className="card-img-container">
                    <img src={`http://localhost:5000/${land.image}`} alt={land.title} />
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{land.title}</h3>
                    <div className="card-loc">📍 {land.location}</div>
                    <div className="card-price">Rs. {land.price.toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;