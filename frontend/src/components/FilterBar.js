import React, { useState } from "react";

const CATEGORIES = [
  { label: "All",        value: "" },
  { label: "🏠 House",   value: "House" },
  { label: "🚪 Room",    value: "Room" },
  { label: "🌿 Land",    value: "Land" },
  { label: "🏢 Commercial", value: "Commercial" },
];

const PRICE_PRESETS = [
  { label: "Any",       min: 0,     max: 9999999 },
  { label: "< 10k",     min: 0,     max: 10000   },
  { label: "10–25k",    min: 10000, max: 25000   },
  { label: "25–50k",    min: 25000, max: 50000   },
  { label: "50k+",      min: 50000, max: 9999999 },
];

const FilterBar = ({ onFilter, refreshList }) => {
  const [activeCategory, setActiveCategory] = useState("");
  const [activePriceIdx, setActivePriceIdx] = useState(0);
  const [location, setLocation] = useState("");

  const apply = ({ cat = activeCategory, priceIdx = activePriceIdx, loc = location }) => {
    const preset = PRICE_PRESETS[priceIdx];
    onFilter({ category: cat, minPrice: preset.min, maxPrice: preset.max, location: loc });
  };

  const handleCategory = (val) => { setActiveCategory(val); apply({ cat: val }); };
  const handlePrice    = (idx) => { setActivePriceIdx(idx); apply({ priceIdx: idx }); };
  const handleLocation = (e)   => { setLocation(e.target.value); apply({ loc: e.target.value }); };
  const handleReset    = ()    => { setActiveCategory(""); setActivePriceIdx(0); setLocation(""); refreshList?.(); };

  return (
    <div className="filterbar-root">
      <div className="filterbar-strip">

        {/* Title anchor */}
        <span className="filterbar-eyebrow">Properties</span>

        {/* Type label + chips */}
        <span className="filterbar-row-label">Type</span>
        <div className="filterbar-chips">
          {CATEGORIES.map(({ label, value }) => (
            <button
              key={value}
              className={"filterbar-chip" + (activeCategory === value ? " active" : "")}
              onClick={() => handleCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="filterbar-sep" />

        {/* Budget label + chips */}
        <span className="filterbar-row-label">Budget</span>
        <div className="filterbar-chips">
          {PRICE_PRESETS.map(({ label }, idx) => (
            <button
              key={label}
              className={"filterbar-chip small" + (activePriceIdx === idx ? " active" : "")}
              onClick={() => handlePrice(idx)}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="filterbar-sep" />

        {/* Location */}
        <div className="filterbar-location">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <input
            type="text"
            className="filterbar-location-input"
            placeholder="City or district…"
            value={location}
            onChange={handleLocation}
          />
          {location && (
            <button className="filterbar-clear-loc" onClick={() => { setLocation(""); apply({ loc: "" }); }}>×</button>
          )}
        </div>

        {/* Reset */}
        <button className="filterbar-reset" onClick={handleReset}>Reset</button>

      </div>
    </div>
  );
};

export default FilterBar;
