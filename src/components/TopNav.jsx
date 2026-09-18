import React, { useState } from 'react';
import { getGradeInfo } from '../hooks/useInfiniteFlight';

export default function TopNav({
  sessions, activeSessionId, switchSession, flightCount,
  onOpenSearch, mapTheme = 'dark', setMapTheme, map3D, setMap3D, showRadar, setShowRadar, showFir, setShowFir, onOpenSettings,
  activeView, setActiveView, userProfile, onOpenProfile
}) {
  const [showMobileTools, setShowMobileTools] = useState(false);
  const grade = userProfile ? getGradeInfo(userProfile.grade) : null;

  // Active session object
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const isCurrentExpert = currentSession ? (/expert/i.test(currentSession.name) || currentSession.id.includes('expert')) : true;
  const isCurrentTraining = currentSession ? (/training/i.test(currentSession.name) || currentSession.id.includes('training')) : false;
  const currentDotType = isCurrentExpert ? 'expert' : isCurrentTraining ? 'training' : 'casual';
  const currentShortLabel = isCurrentExpert ? 'EXP' : isCurrentTraining ? 'TRN' : 'CAS';

  // Cycle to next session on mobile single-tap
  const handleCycleSession = () => {
    if (!sessions || sessions.length <= 1) return;
    const curIdx = sessions.findIndex(s => s.id === activeSessionId);
    const nextIdx = (curIdx + 1) % sessions.length;
    switchSession(sessions[nextIdx].id);
  };

  return (
    <header className="wp-header">
      {/* ── Left: Brand + Desktop View Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 1, minWidth: 0 }}>
        <div className="wp-brand-pill wp-glass">
          <div className="wp-brand-icon"><i className="fa-solid fa-plane-up"></i></div>
          <div className="wp-brand-name">Track<span>24</span></div>
          {activeView === 'map' && (
            <div className="wp-flight-count-badge">
              <span className="wp-live-pulse"></span>
              <span>{flightCount.toLocaleString()} <span className="wp-live-text-desktop">live</span></span>
            </div>
          )}
        </div>

        {/* View Navigation Pills (Desktop Only) */}
        <div className="wp-view-nav wp-glass">
          <button className={`wp-view-pill ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>
            <i className="fa-solid fa-map-location-dot"></i><span>Live Map</span>
          </button>
          <button className={`wp-view-pill ${activeView === 'logbook' ? 'active' : ''}`} onClick={() => setActiveView('logbook')}>
            <i className="fa-solid fa-book"></i><span>Logbook</span>
          </button>
          <button className={`wp-view-pill ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
            <i className="fa-solid fa-chart-pie"></i><span>Analytics</span>
          </button>
          <button className={`wp-view-pill ${activeView === 'countries' ? 'active' : ''}`} onClick={() => setActiveView('countries')}>
            <i className="fa-solid fa-earth-americas"></i><span>Countries</span>
          </button>
        </div>

        {/* Search Bar (Desktop Only) */}
        {activeView === 'map' && (
          <div className="wp-search-bar wp-glass" onClick={onOpenSearch}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
            <input type="text" readOnly placeholder="Find flights or airports…" onClick={onOpenSearch} />
            <span className="wp-search-shortcut">⌘K</span>
          </div>
        )}
      </div>

      {/* ── Right: Server Switcher + Tools + Avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Mobile Server Pill (Matches E 2749 v) */}
        {activeView === 'map' && (
          <button
            className="wp-mob-server-pill wp-glass"
            onClick={handleCycleSession}
            title={`Active Server: ${currentSession?.name || 'Server'} (Tap to switch)`}
          >
            <span className={`wp-mob-server-code ${currentDotType}`}>
              {isCurrentExpert ? 'E' : isCurrentTraining ? 'T' : 'C'}
            </span>
            <span className="wp-mob-server-num">
              {(currentSession?.userCount ?? flightCount).toLocaleString()}
            </span>
            <i className="fa-solid fa-chevron-down wp-mob-server-arr"></i>
          </button>
        )}

        {/* Mobile Center Search Pill: Track 24 */}
        {activeView === 'map' && (
          <button
            className="wp-mob-search-pill wp-glass"
            onClick={onOpenSearch}
            title="Search Flights, Airports & Waypoints on Track 24"
            aria-label="Search Track 24"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            <span>Track <span className="wp-brand-accent">24</span></span>
          </button>
        )}

        {/* Desktop Server Switcher (hidden on mobile) */}
        {activeView === 'map' && (
          <div className="wp-server-switcher wp-glass">
            {sessions.map(s => {
              const isExpert = /expert/i.test(s.name) || s.id.includes('expert');
              const isTraining = /training/i.test(s.name) || s.id.includes('training');
              const dotType = isExpert ? 'expert' : isTraining ? 'training' : 'casual';
              const label = isExpert ? 'Expert' : isTraining ? 'Training' : 'Casual';
              return (
                <button
                  key={s.id}
                  className={`wp-server-pill ${s.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => switchSession(s.id)}
                  title={`${s.name} (${s.userCount || 0})`}
                >
                  <span className={`server-dot ${dotType}`}></span>
                  <span>{label}</span>
                  <span className="server-count">{s.userCount ?? 0}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Map Tools (Desktop Only) */}
        {activeView === 'map' && (
          <div className="wp-header-tools">
            <div className="wp-map-theme-pill wp-glass" title="Basemap: Dark / Light / Satellite">
              <button
                className={`wp-theme-tab ${mapTheme === 'dark' ? 'active' : ''}`}
                onClick={() => setMapTheme && setMapTheme('dark')}
                title="Dark Radar Basemap"
              >
                <i className="fa-solid fa-moon"></i>
                <span className="theme-name">Dark</span>
              </button>
              <button
                className={`wp-theme-tab ${mapTheme === 'light' ? 'active' : ''}`}
                onClick={() => setMapTheme && setMapTheme('light')}
                title="Positron Daylight Basemap"
              >
                <i className="fa-solid fa-sun"></i>
                <span className="theme-name">Light</span>
              </button>
              <button
                className={`wp-theme-tab ${mapTheme === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapTheme && setMapTheme('satellite')}
                title="High-Res Satellite Aerial Imagery"
              >
                <i className="fa-solid fa-earth-americas"></i>
                <span className="theme-name">Satellite</span>
              </button>
            </div>

            <button className={`wp-icon-button wp-glass ${showRadar ? 'active' : ''}`} title="Weather Radar" onClick={() => setShowRadar(!showRadar)}>
              <i className="fa-solid fa-cloud-rain"></i>
            </button>
            <button className={`wp-icon-button wp-glass ${map3D ? 'active' : ''}`} title="3D Mode" onClick={() => setMap3D(!map3D)}>
              <i className="fa-solid fa-cube"></i>
            </button>
            <button className={`wp-icon-button wp-glass ${showFir ? 'active' : ''}`} title="FIR Boundaries" onClick={() => setShowFir(!showFir)}>
              <i className="fa-solid fa-draw-polygon"></i>
            </button>
            <button className="wp-icon-button wp-glass" title="Settings" onClick={onOpenSettings}>
              <i className="fa-solid fa-sliders"></i>
            </button>
          </div>
        )}

        {/* Mobile Quick Recenter Button */}
        {activeView === 'map' && (
          <button
            className="wp-mob-icon-btn wp-glass"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('track24:recenter'));
              }
            }}
            title="Recenter Radar"
            aria-label="Recenter Radar"
          >
            <i className="fa-solid fa-crosshairs"></i>
          </button>
        )}

        {/* Mobile Map Tools & Layers Toggle (Basemaps, Radar, 3D, FIR, Views) */}
        {activeView === 'map' && (
          <button
            className={`wp-mob-icon-btn wp-glass ${showMobileTools ? 'active' : ''}`}
            onClick={() => setShowMobileTools(!showMobileTools)}
            title="Map Layers & Views"
            aria-label="Map Layers and Views"
          >
            <i className="fa-solid fa-layer-group"></i>
          </button>
        )}

        <button
          className="wp-mob-icon-btn wp-glass"
          onClick={onOpenSettings}
          title="Notifications & Radar Settings"
          aria-label="Alerts"
        >
          <i className="fa-solid fa-message"></i>
        </button>

        {/* User Avatar Button */}
        <button
          className="wp-avatar-btn wp-glass"
          onClick={onOpenProfile}
          title={`Pilot: ${userProfile?.discourseUsername || userProfile?.username || 'Profile'}`}
        >
          <div className="wp-avatar-icon-wrap">
            <i className="fa-solid fa-user"></i>
          </div>
          <span className="wp-avatar-username">
            {userProfile?.discourseUsername || userProfile?.username || 'Pilot'}
          </span>
          <span className="wp-avatar-grade">
            G{userProfile?.grade || 1}
          </span>
        </button>
      </div>

      {/* ── Mobile Map Tools & Layers Popover (Dark/Light/Satellite, Radar, 3D, FIR, Views) ── */}
      {showMobileTools && (
        <div className="wp-mob-tools-drawer wp-glass">
          <div className="wp-mob-tools-head">
            <span className="wp-mob-tools-title"><i className="fa-solid fa-layer-group"></i> Layers & Views</span>
            <button className="wp-mob-tools-close" onClick={() => setShowMobileTools(false)} aria-label="Close layers">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="wp-mob-tools-sec">
            <div className="wp-mob-tools-label">Basemap Style</div>
            <div className="wp-mob-tools-row">
              <button
                className={`wp-mob-tool-chip ${mapTheme === 'dark' ? 'active' : ''}`}
                onClick={() => setMapTheme && setMapTheme('dark')}
              >
                <i className="fa-solid fa-moon"></i> Dark
              </button>
              <button
                className={`wp-mob-tool-chip ${mapTheme === 'light' ? 'active' : ''}`}
                onClick={() => setMapTheme && setMapTheme('light')}
              >
                <i className="fa-solid fa-sun"></i> Light
              </button>
              <button
                className={`wp-mob-tool-chip ${mapTheme === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapTheme && setMapTheme('satellite')}
              >
                <i className="fa-solid fa-earth-americas"></i> Satellite
              </button>
            </div>
          </div>

          <div className="wp-mob-tools-sec">
            <div className="wp-mob-tools-label">Radar Overlays & Tools</div>
            <div className="wp-mob-tools-row">
              <button
                className={`wp-mob-tool-chip ${showRadar ? 'active' : ''}`}
                onClick={() => setShowRadar && setShowRadar(!showRadar)}
              >
                <i className="fa-solid fa-cloud-rain"></i> Weather
              </button>
              <button
                className={`wp-mob-tool-chip ${map3D ? 'active' : ''}`}
                onClick={() => setMap3D && setMap3D(!map3D)}
              >
                <i className="fa-solid fa-cube"></i> 3D Mode
              </button>
              <button
                className={`wp-mob-tool-chip ${showFir ? 'active' : ''}`}
                onClick={() => setShowFir && setShowFir(!showFir)}
              >
                <i className="fa-solid fa-draw-polygon"></i> FIR
              </button>
              <button
                className="wp-mob-tool-chip"
                onClick={() => { setShowMobileTools(false); onOpenSettings && onOpenSettings(); }}
              >
                <i className="fa-solid fa-sliders"></i> Settings
              </button>
            </div>
          </div>

          <div className="wp-mob-tools-sec">
            <div className="wp-mob-tools-label">Navigation Views</div>
            <div className="wp-mob-tools-row">
              <button
                className={`wp-mob-tool-chip ${activeView === 'map' ? 'active' : ''}`}
                onClick={() => { setActiveView('map'); setShowMobileTools(false); }}
              >
                <i className="fa-solid fa-map-location-dot"></i> Live Map
              </button>
              <button
                className={`wp-mob-tool-chip ${activeView === 'logbook' ? 'active' : ''}`}
                onClick={() => { setActiveView('logbook'); setShowMobileTools(false); }}
              >
                <i className="fa-solid fa-book"></i> Logbook
              </button>
              <button
                className={`wp-mob-tool-chip ${activeView === 'analytics' ? 'active' : ''}`}
                onClick={() => { setActiveView('analytics'); setShowMobileTools(false); }}
              >
                <i className="fa-solid fa-chart-pie"></i> Analytics
              </button>
              <button
                className={`wp-mob-tool-chip ${activeView === 'countries' ? 'active' : ''}`}
                onClick={() => { setActiveView('countries'); setShowMobileTools(false); }}
              >
                <i className="fa-solid fa-earth-americas"></i> Countries
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
