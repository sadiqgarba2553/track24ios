import React from 'react';

export default function FleetFilterBar({
  categoryFilter,
  setCategoryFilter,
  altFilter,
  setAltFilter,
  totalFlights,
  filteredCount,
  onReset
}) {
  const isFiltered = categoryFilter !== 'all' || altFilter !== 'all';

  return (
    <div className="wp-fleet-filter-bar wp-glass">
      {/* Category Pills */}
      <div className="wp-filter-group">
        <button
          className={`wp-filter-pill ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All Fleet
        </button>
        <button
          className={`wp-filter-pill ${categoryFilter === 'widebody' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('widebody')}
        >
          <i className="fa-solid fa-plane"></i> Widebody
        </button>
        <button
          className={`wp-filter-pill ${categoryFilter === 'narrowbody' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('narrowbody')}
        >
          <i className="fa-solid fa-plane-up"></i> Narrowbody
        </button>
        <button
          className={`wp-filter-pill ${categoryFilter === 'cargo' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('cargo')}
        >
          <i className="fa-solid fa-box"></i> Cargo
        </button>
        <button
          className={`wp-filter-pill ${categoryFilter === 'military' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('military')}
        >
          <i className="fa-solid fa-jet-fighter"></i> Military
        </button>
        <button
          className={`wp-filter-pill ${categoryFilter === 'ga' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('ga')}
        >
          <i className="fa-solid fa-fan"></i> GA / Prop
        </button>
      </div>

      <div className="wp-filter-separator"></div>

      {/* Altitude Brackets */}
      <div className="wp-filter-group">
        <button
          className={`wp-filter-pill ${altFilter === 'all' ? 'active' : ''}`}
          onClick={() => setAltFilter('all')}
        >
          All Alt
        </button>
        <button
          className={`wp-filter-pill ${altFilter === 'high' ? 'active' : ''}`}
          onClick={() => setAltFilter('high')}
          title="Above FL280 (28,000 ft)"
        >
          High &gt;FL280
        </button>
        <button
          className={`wp-filter-pill ${altFilter === 'mid' ? 'active' : ''}`}
          onClick={() => setAltFilter('mid')}
          title="FL100 to FL280 (10,000 - 28,000 ft)"
        >
          Mid FL100-280
        </button>
        <button
          className={`wp-filter-pill ${altFilter === 'low' ? 'active' : ''}`}
          onClick={() => setAltFilter('low')}
          title="Below FL100 (10,000 ft)"
        >
          Low &lt;FL100
        </button>
      </div>

      {/* Count & Reset */}
      <div className="wp-filter-meta">
        <span className="wp-filter-count">
          {filteredCount} / {totalFlights}
        </span>
        {isFiltered && (
          <button className="wp-filter-reset-btn" onClick={onReset} title="Reset all fleet filters">
            <i className="fa-solid fa-rotate-left"></i>
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
