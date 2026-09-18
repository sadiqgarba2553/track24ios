import React from 'react';
import { getWatchedFlightIds } from '../utils/notifications';

export default function MobileNav({
  activeTab,
  setActiveTab,
  activeView,
  setActiveView
}) {
  const watchedCount = getWatchedFlightIds().length;

  const handleTabClick = (tab) => {
    if (tab === 'map') {
      setActiveView('map');
      setActiveTab(null);
    } else {
      setActiveTab(activeTab === tab ? null : tab);
    }
  };

  return (
    <nav className="wp-mobile-nav wp-glass" role="navigation" aria-label="Mobile navigation">
      {/* 1. Live Radar Map */}
      <button
        className={`wp-mob-btn ${activeView === 'map' && !activeTab ? 'active' : ''}`}
        onClick={() => handleTabClick('map')}
        title="Live Map"
      >
        <i className="fa-solid fa-map-location-dot"></i>
        <span>Radar</span>
      </button>

      {/* 2. Fleet Sheet */}
      <button
        className={`wp-mob-btn ${activeTab === 'fleet' ? 'active' : ''}`}
        onClick={() => handleTabClick('fleet')}
        title="Fleet List"
      >
        <i className="fa-solid fa-plane"></i>
        <span>Fleet</span>
      </button>

      {/* 3. ATC & Airports */}
      <button
        className={`wp-mob-btn ${activeTab === 'atc' || activeTab === 'airports' ? 'active' : ''}`}
        onClick={() => handleTabClick('atc')}
        title="Airports & ATC"
      >
        <i className="fa-solid fa-tower-broadcast"></i>
        <span>ATC/Hubs</span>
      </button>

      {/* 4. Alerts & Notifications */}
      <button
        className={`wp-mob-btn ${activeTab === 'alerts' ? 'active' : ''}`}
        onClick={() => handleTabClick('alerts')}
        title="Radar Alerts & Push"
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <i className="fa-solid fa-bell"></i>
          {watchedCount > 0 && (
            <span className="wp-mob-badge-dot"></span>
          )}
        </div>
        <span>Alerts</span>
      </button>

      {/* 5. More Menu */}
      <button
        className={`wp-mob-btn ${activeTab === 'more' || activeView !== 'map' ? 'active' : ''}`}
        onClick={() => handleTabClick('more')}
        title="More Views & Settings"
      >
        <i className="fa-solid fa-bars"></i>
        <span>Menu</span>
      </button>
    </nav>
  );
}
