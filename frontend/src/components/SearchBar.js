import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

const SearchBar = ({ onSearch }) => {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); setIsSearching(false); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/search-live?q=` + encodeURIComponent(query));
      const data = await res.json();
      if (data.success) setSuggestions(data.results);
    } catch { setSuggestions([]); }
    setIsSearching(false);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value; setQ(val); setShowSug(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  const saveRecentSearch = (searchTerm) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSelect = (land) => {
    setQ(land.title); setShowSug(false); setSuggestions([]);
    saveRecentSearch(land.title);
    navigate("/land/" + land._id);
  };

  const handleSearch = () => {
    if (q.trim()) { setShowSug(false); saveRecentSearch(q.trim()); onSearch(q); }
  };

  const handleRecentClick = (term) => { setQ(term); setShowSug(false); onSearch(term); };

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showRecents = showSug && q.length === 0 && recentSearches.length > 0;
  const showSuggestions = showSug && suggestions.length > 0 && q.length >= 2;

  return (
    <div className="search-wrapper-enhanced" ref={wrapRef}>
      <div className="search-container-enhanced">
        <div className="search-icon-enhanced">
          {isSearching ? (
            <div className="search-loading-spinner"></div>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          )}
        </div>
        <input
          className="search-input-enhanced"
          placeholder="Search properties, locations..."
          value={q}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onFocus={() => setShowSug(true)}
          autoComplete="off"
          spellCheck="false"
        />
        {q && (
          <button className="search-clear-btn" onClick={() => { setQ(""); setSuggestions([]); setShowSug(false); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        {/* Ghost search button — no background */}
        <button className="search-btn-enhanced" onClick={handleSearch} aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>

      {(showSuggestions || showRecents) && (
        <div className="search-suggestions-enhanced">
          {showRecents && (
            <div className="search-section">
              <div className="search-section-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                </svg>
                Recent Searches
              </div>
              {recentSearches.map((term, i) => (
                <div key={i} className="search-recent-item" onClick={() => handleRecentClick(term)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,11 12,14 22,4"/>
                    <path d="M21,12v7a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"/>
                  </svg>
                  {term}
                </div>
              ))}
            </div>
          )}

          {showSuggestions && (
            <div className="search-section">
              <div className="search-section-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                Properties ({suggestions.length})
              </div>
              {suggestions.map((s) => (
                <div key={s._id} className="search-sug-item-enhanced" onClick={() => handleSelect(s)}>
                  <div className="sug-image-enhanced">
                    <img src={s.image ? (s.image.startsWith("http") ? s.image : `${API_URL}/uploads/${s.image}`) : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=60"} alt="" />
                    <div className="sug-category-badge">{s.subCategory || s.category}</div>
                  </div>
                  <div className="sug-content-enhanced">
                    <div className="sug-title-enhanced">{s.title}</div>
                    <div className="sug-location-enhanced">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {[s.city, s.district].filter(Boolean).join(", ") || s.location}
                    </div>
                  </div>
                  <div className="sug-price-enhanced">
                    Rs. {parseInt(s.price).toLocaleString()}
                    <span>/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSug && q.length === 0 && recentSearches.length === 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                Popular Searches
              </div>
              {['Kathmandu Apartments', 'Pokhara Houses', 'Commercial Space', 'Land for Sale', 'Luxury Rentals'].map((term, i) => (
                <div key={i} className="search-quick-item" onClick={() => handleRecentClick(term)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                  </svg>
                  {term}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
