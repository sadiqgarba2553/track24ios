import React, { useState } from 'react';

export default function FleetFilterSidebar({
  categoryFilter,
  setCategoryFilter,
  altFilter,
  setAltFilter,
  totalFlights,
  filteredCount,
  onReset,
  isDrawerOpen
}) {
  const [collapsed, setCollapsed] = useState(true); // default collapsed as sleek tab

  const isFiltered = categoryFilter !== 'all' || altFilter !== 'all';

  // Auto-hide if FlightDrawer or AirportDrawer is open on the right
  if (isDrawerOpen) return null;

  return (
    <div className={`wp-filter-sidebar wp-glass ${collapsed ? 'collapsed' : ''}`}>
      {/* Header / Toggle Tab */}
      <div className="wp-filter-sidebar-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="wp-filter-sidebar-title">
          <i className="fa-solid fa-sliders"></i>
          <span>Fleet Filters</span>
          <span className="wp-filter-count-badge">
            {filteredCount === totalFlights ? totalFlights : `${filteredCount}/${totalFlights}`}
          </span>
        </div>

        <div className="wp-filter-sidebar-actions" onClick={e => e.stopPropagation()}>
          {isFiltered && !collapsed && (
            <button className="wp-filter-reset-btn" onClick={onReset} title="Reset all filters">
              <i className="fa-solid fa-rotate-left"></i>
              <span>Reset</span>
            </button>
          )}
          <button
            className="wp-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand Filters" : "Collapse Filters"}
          >
            {collapsed ? '+' : '–'}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {!collapsed && (
        <div className="wp-filter-sidebar-body">
          {/* Section 1: Aircraft Categories */}
          <div className="wp-filter-section">
            <div className="wp-filter-sec-label">AIRCRAFT CATEGORY</div>
            <div className="wp-filter-grid-2col">
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
          </div>

          {/* Section 2: Altitude Brackets */}
          <div className="wp-filter-section">
            <div className="wp-filter-sec-label">ALTITUDE BRACKET</div>
            <div className="wp-filter-grid-2col">
              <button
                className={`wp-filter-pill ${altFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAltFilter('all')}
              >
                All Altitudes
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
                title="FL100 to FL280"
              >
                Mid FL100-280
              </button>
              <button
                className={`wp-filter-pill ${altFilter === 'low' ? 'active' : ''}`}
                onClick={() => setAltFilter('low')}
                title="Below FL100"
              >
                Low &lt;FL100
              </button>
            </div>
          </div>

          {/* Section 3: Summary */}
          <div className="wp-filter-summary">
            <span>{filteredCount} of {totalFlights} visible</span>
            {isFiltered && (
              <span className="wp-filter-active-indicator">Filter Active</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
